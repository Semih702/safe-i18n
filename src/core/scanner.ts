import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import type { Node, JSXElement } from "@babel/types";
import * as t from "@babel/types";
import fg from "fast-glob";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { classifyRisk } from "./risk-classifier.js";
import type { RiskContext } from "./risk-classifier.js";
import type {
  SafeI18nConfig,
  StringCandidate,
  ScanResult,
  ScanSummary,
  ComponentType,
} from "./types.js";

// Handle both ESM default and CJS interop for @babel/traverse
const traverse = (typeof _traverse === "function" ? _traverse : (_traverse as { default: typeof _traverse }).default) as typeof _traverse;

let candidateCounter = 0;

function generateId(): string {
  return `str_${++candidateCounter}`;
}

function resetCounter(): void {
  candidateCounter = 0;
}

const TRANSLATABLE_PROPS = new Set([
  "placeholder", "aria-label", "aria-placeholder", "aria-roledescription",
  "aria-valuetext", "title", "alt", "label",
]);

const SKIP_CALL_NAMES = new Set([
  "console", "require", "import", "fetch", "addEventListener",
  "removeEventListener", "setTimeout", "setInterval", "clearTimeout",
  "clearInterval", "Promise", "Error", "TypeError", "JSON",
  "Object", "Array", "Math", "Date", "RegExp", "URL",
  "URLSearchParams", "localStorage", "sessionStorage",
  "gtag", "track", "analytics", "mixpanel", "segment",
  "ga", "fbq", "plausible", "posthog",
]);

const SKIP_PROP_NAMES = new Set([
  "className", "class", "style", "id", "key", "ref",
  "data-testid", "data-cy", "data-test", "data-test-id",
  "href", "src", "action", "method", "type", "name",
  "htmlFor", "role", "tabIndex", "value",
  "d", "viewBox", "fill", "stroke", "strokeWidth", "strokeLinecap",
  "strokeLinejoin", "clipPath", "clipRule", "fillRule", "fillOpacity",
  "strokeOpacity", "gradientTransform", "transform",
  "xmlns", "xmlnsXlink", "xlinkHref", "points", "cx", "cy", "r",
  "rx", "ry", "x", "x1", "x2", "y", "y1", "y2", "width", "height",
  "offset", "stopColor", "floodColor", "filterUnits", "stdDeviation",
  "aria-hidden", "aria-atomic", "aria-busy", "aria-checked", "aria-current",
  "aria-disabled", "aria-expanded", "aria-haspopup", "aria-invalid",
  "aria-live", "aria-modal", "aria-multiline", "aria-multiselectable",
  "aria-orientation", "aria-pressed", "aria-readonly", "aria-required",
  "aria-selected", "aria-sort", "aria-autocomplete", "aria-colcount",
  "aria-colindex", "aria-colspan", "aria-controls", "aria-describedby",
  "aria-details", "aria-errormessage", "aria-flowto", "aria-labelledby",
  "aria-owns", "aria-posinset", "aria-relevant", "aria-rowcount",
  "aria-rowindex", "aria-rowspan", "aria-setsize",
  "focusable", "data-prefix", "data-icon", "data-state", "data-side",
  "data-align", "data-orientation", "data-disabled", "data-highlighted",
  "data-slot", "data-value", "data-type", "data-radix-collection-item",
  "poster", "preload", "autoPlay", "muted", "loop", "controls",
  "align", "side", "sideOffset", "alignOffset", "autoComplete",
  "autoCorrect", "autoCapitalize", "spellCheck", "inputMode",
  "enterKeyHint", "pattern", "min", "max", "step", "maxLength",
  "minLength", "disabled", "readOnly", "required", "checked",
  "defaultValue", "defaultChecked", "accept", "multiple",
  "cols", "rows", "wrap", "dir", "lang", "translate",
  "crossOrigin", "referrerPolicy", "loading", "decoding", "fetchPriority",
  "variant", "size", "color", "target", "rel", "as", "asChild",
  "orientation", "direction", "position", "placement", "trigger",
  "mode", "scope", "scheme", "shape", "slot", "kind",
]);

function getJSXElementName(node: JSXElement): string {
  const opening = node.openingElement;
  if (t.isJSXIdentifier(opening.name)) return opening.name.name;
  if (t.isJSXMemberExpression(opening.name)) {
    return `${t.isJSXIdentifier(opening.name.object) ? opening.name.object.name : "?"}.${opening.name.property.name}`;
  }
  return "unknown";
}

function getComponentName(ancestors: Node[]): string | null {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const node = ancestors[i];
    if (!node) continue;
    if (t.isFunctionDeclaration(node) && node.id) return node.id.name;
    if (t.isVariableDeclarator(node) && t.isIdentifier(node.id)) return node.id.name;
    if (
      t.isExportDefaultDeclaration(node) &&
      t.isFunctionDeclaration(node.declaration) &&
      node.declaration.id
    ) {
      return node.declaration.id.name;
    }
  }
  return null;
}

function detectComponentType(source: string, filePath: string): ComponentType {
  const directiveMatch = source.match(/^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*(["'])use (client|server)\1/);
  if (directiveMatch) return directiveMatch[2] as ComponentType;
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.startsWith("app/") || normalized.includes("/app/")) return "server";
  return "client";
}

function inferRoute(filePath: string): string | null {
  const normalized = filePath.replace(/\\/g, "/");
  const appMatch = normalized.match(/app\/(.+?)\/(page|layout|loading|error|not-found)\./);
  if (appMatch?.[1]) return `/${appMatch[1]}`;
  const appRoot = normalized.match(/app\/(page|layout)\./);
  if (appRoot) return "/";
  return null;
}

function inferNamespace(filePath: string, route: string | null, strategy: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  if (strategy === "route-based" && route) {
    return route.replace(/^\//, "").replace(/\//g, ".") || "common";
  }
  if (strategy === "component-based") {
    const basename = path.basename(normalized, path.extname(normalized));
    return basename.replace(/([A-Z])/g, (m, c, i) => (i > 0 ? `-${c}` : c)).toLowerCase();
  }
  const parts = normalized.split("/");
  const relevantParts = parts.filter(
    (p) => !["src", "app", "components", "pages", "lib", "utils"].includes(p),
  );
  const dir = relevantParts.slice(0, -1).pop();
  return dir || "common";
}

function generateKey(source: string, propName: string | null): string {
  const words = source
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);

  if (words.length === 0) return "text";

  const camel =
    words[0]!.toLowerCase() +
    words
      .slice(1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("");

  const key = camel.slice(0, 40);

  if (propName && TRANSLATABLE_PROPS.has(propName)) {
    return `${propName}_${key}`;
  }
  return key;
}

function isLikelyNonText(value: string): boolean {
  if (/^[a-z][a-zA-Z0-9]*$/.test(value) && /[A-Z]/.test(value)) return true; // camelCase identifier
  if (/^[A-Z_][A-Z0-9_]*$/.test(value)) return true; // CONSTANT_CASE
  if (/^[a-z0-9]+(-[a-z0-9]+)+$/.test(value)) return true; // kebab-case (requires hyphen)
  if (/^(https?:\/\/|\/[a-z])/.test(value)) return true; // URL or path
  if (/\{var\}:\/\//.test(value)) return true; // URL pattern with variable
  if (/^[#.][a-zA-Z]/.test(value)) return true; // CSS selector
  if (/^\d+(\.\d+)?$/.test(value)) return true; // number
  if (value.length <= 1) return true; // single char
  if (value.length <= 2 && !/^[a-zA-Z]+$/.test(value)) return true; // short non-word symbols
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return true; // hex color
  if (/^[MmLlHhVvCcSsQqTtAaZz0-9\s.,\-]+$/.test(value)) return true; // SVG path
  if (/\.\w{2,4}$/.test(value) && !value.includes(" ")) return true; // file path
  if (value.includes("url(")) return true; // CSS url()
  if (/^(fill|stroke|text|bg|border|shadow|outline|ring)-/.test(value)) return true; // CSS utility
  if (!value.includes(" ") && value.length > 40) return true; // long technical token
  if (/^\.?\d/.test(value) && !/[a-zA-Z]{2,}/.test(value)) return true; // numeric-like
  const letters = value.replace(/[^a-zA-Z]/g, "").length;
  if (value.length > 10 && letters / value.length < 0.3) return true; // mostly non-letters
  if (/^(flex|grid|block|inline|absolute|relative|fixed|sticky)\s/i.test(value) ||
      (value.includes("-") && value.includes(" ") && /\b(px|py|mt|mb|ml|mr|pt|pb|pl|pr|gap|w-|h-|text-|bg-|border|rounded|font|items|justify|overflow|min-|max-)\b/.test(value))) return true; // Tailwind classes
  return false;
}

function buildRiskContext(info: {
  parentType: string;
  propName: string | null;
  source: string;
  ancestors: Node[];
}): RiskContext {
  const { parentType, propName, source, ancestors } = info;

  let isInConditional = false;
  let isInTemplateLiteral = false;
  let isComparisonOperand = false;
  const isObjectKey = false;
  let isInConsoleCall = false;
  let isInApiCall = false;
  let isInTestId = false;
  let isInClassName = false;
  let isInStorageCall = false;
  let isInAnalyticsCall = false;
  let isInRouteDefinition = false;
  let isInImport = false;
  let isEnumValue = false;

  for (const ancestor of ancestors) {
    if (t.isConditionalExpression(ancestor) || t.isLogicalExpression(ancestor)) {
      isInConditional = true;
    }
    if (t.isTemplateLiteral(ancestor)) isInTemplateLiteral = true;
    if (t.isBinaryExpression(ancestor) && ["===", "!==", "==", "!="].includes(ancestor.operator)) {
      isComparisonOperand = true;
    }
    if (t.isImportDeclaration(ancestor)) isInImport = true;
    if (t.isTSEnumMember(ancestor)) isEnumValue = true;
    if (t.isCallExpression(ancestor) && t.isMemberExpression(ancestor.callee)) {
      const obj = ancestor.callee.object;
      if (t.isIdentifier(obj)) {
        if (obj.name === "console") isInConsoleCall = true;
        if (["localStorage", "sessionStorage"].includes(obj.name)) isInStorageCall = true;
        if (["fetch", "axios", "http"].includes(obj.name)) isInApiCall = true;
        if (SKIP_CALL_NAMES.has(obj.name)) isInAnalyticsCall = true;
      }
    }
    if (t.isCallExpression(ancestor) && t.isIdentifier(ancestor.callee)) {
      if (SKIP_CALL_NAMES.has(ancestor.callee.name)) isInAnalyticsCall = true;
      if (["fetch", "require"].includes(ancestor.callee.name)) isInApiCall = true;
    }
  }

  if (propName === "data-testid" || propName === "data-cy" || propName === "data-test") {
    isInTestId = true;
  }
  if (propName === "className" || propName === "class") isInClassName = true;
  if (propName === "href" || propName === "src" || propName === "action") isInRouteDefinition = true;

  return {
    source,
    parentType,
    propName,
    isInConditional,
    isInTemplateLiteral,
    isComparisonOperand,
    isObjectKey,
    isInConsoleCall,
    isInApiCall,
    isInTestId,
    isInClassName,
    isInStorageCall,
    isInAnalyticsCall,
    isInRouteDefinition,
    isInImport,
    isEnumValue,
  };
}

function extractFromFile(
  source: string,
  filePath: string,
  config: SafeI18nConfig,
): StringCandidate[] {
  const candidates: StringCandidate[] = [];
  const compType = detectComponentType(source, filePath);
  const route = inferRoute(filePath);

  let ast: ReturnType<typeof parse>;
  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: ["jsx", "typescript", "decorators"],
      errorRecovery: true,
    });
  } catch {
    return candidates;
  }

  traverse(ast, {
    JSXText(pathNode) {
      const value = pathNode.node.value.trim();
      if (!value || isLikelyNonText(value)) return;

      const parent = pathNode.parent;
      if (!t.isJSXElement(parent)) return;
      const elementName = getJSXElementName(parent);

      const ancestors = pathNode.getAncestry().map((p) => p.node);
      const component = getComponentName(ancestors);

      const riskCtx = buildRiskContext({
        parentType: elementName,
        propName: null,
        source: value,
        ancestors,
      });
      const { risk, reason } = classifyRisk(riskCtx);

      candidates.push({
        id: generateId(),
        source: value,
        filePath,
        line: pathNode.node.loc?.start.line ?? 0,
        column: pathNode.node.loc?.start.column ?? 0,
        component,
        parentElement: elementName,
        propName: null,
        route,
        suggestedNamespace: inferNamespace(filePath, route, config.i18n.namespaceStrategy),
        suggestedKey: generateKey(value, null),
        description: `Text inside <${elementName}> in ${component || "anonymous component"}`,
        variables: [],
        risk,
        riskReason: reason,
        componentType: compType,
      });
    },

    JSXAttribute(pathNode) {
      const attrName =
        t.isJSXIdentifier(pathNode.node.name) ? pathNode.node.name.name : null;
      if (!attrName) return;

      const value = pathNode.node.value;
      if (!t.isStringLiteral(value)) return;
      const text = value.value.trim();
      if (!text) return;

      if (SKIP_PROP_NAMES.has(attrName)) {
        if (!TRANSLATABLE_PROPS.has(attrName)) return;
      }

      if (!TRANSLATABLE_PROPS.has(attrName) && isLikelyNonText(text)) return;

      const parentElement = pathNode.parentPath?.parent;
      const elementName =
        parentElement && t.isJSXElement(parentElement)
          ? getJSXElementName(parentElement)
          : "unknown";

      const ancestors = pathNode.getAncestry().map((p) => p.node);
      const component = getComponentName(ancestors);

      const riskCtx = buildRiskContext({
        parentType: elementName,
        propName: attrName,
        source: text,
        ancestors,
      });
      const { risk, reason } = classifyRisk(riskCtx);

      candidates.push({
        id: generateId(),
        source: text,
        filePath,
        line: value.loc?.start.line ?? 0,
        column: value.loc?.start.column ?? 0,
        component,
        parentElement: elementName,
        propName: attrName,
        route,
        suggestedNamespace: inferNamespace(filePath, route, config.i18n.namespaceStrategy),
        suggestedKey: generateKey(text, attrName),
        description: `${attrName} prop on <${elementName}> in ${component || "anonymous component"}`,
        variables: [],
        risk,
        riskReason: reason,
        componentType: compType,
      });
    },

    JSXExpressionContainer(pathNode) {
      const expr = pathNode.node.expression;
      if (t.isJSXEmptyExpression(expr)) return;

      if (t.isStringLiteral(expr)) {
        const text = expr.value.trim();
        if (!text || isLikelyNonText(text)) return;

        const parent = pathNode.parent;
        const elementName =
          parent && t.isJSXElement(parent) ? getJSXElementName(parent) : "unknown";

        const ancestors = pathNode.getAncestry().map((p) => p.node);
        const component = getComponentName(ancestors);

        const riskCtx = buildRiskContext({
          parentType: elementName,
          propName: null,
          source: text,
          ancestors,
        });
        const { risk, reason } = classifyRisk(riskCtx);

        candidates.push({
          id: generateId(),
          source: text,
          filePath,
          line: expr.loc?.start.line ?? 0,
          column: expr.loc?.start.column ?? 0,
          component,
          parentElement: elementName,
          propName: null,
          route,
          suggestedNamespace: inferNamespace(filePath, route, config.i18n.namespaceStrategy),
          suggestedKey: generateKey(text, null),
          description: `Expression string in <${elementName}> in ${component || "anonymous component"}`,
          variables: [],
          risk,
          riskReason: reason,
          componentType: compType,
        });
      }

      if (t.isConditionalExpression(expr)) {
        const parts = [expr.consequent, expr.alternate].filter(t.isStringLiteral);
        for (const part of parts) {
          const text = part.value.trim();
          if (!text || isLikelyNonText(text)) continue;

          const parent = pathNode.parent;
          const elementName =
            parent && t.isJSXElement(parent) ? getJSXElementName(parent) : "unknown";

          const ancestors = pathNode.getAncestry().map((p) => p.node);
          const component = getComponentName(ancestors);

          candidates.push({
            id: generateId(),
            source: text,
            filePath,
            line: part.loc?.start.line ?? 0,
            column: part.loc?.start.column ?? 0,
            component,
            parentElement: elementName,
            propName: null,
            route,
            suggestedNamespace: inferNamespace(filePath, route, config.i18n.namespaceStrategy),
            suggestedKey: generateKey(text, null),
            description: `Conditional string in <${elementName}> in ${component || "anonymous component"}`,
            variables: [],
            risk: "REVIEW_REQUIRED",
            riskReason: "String inside conditional expression — may have logic-dependent behavior.",
            componentType: compType,
          });
        }
      }

      if (t.isTemplateLiteral(expr)) {
        const quasis = expr.quasis.map((q) => q.value.cooked || q.value.raw).join("{var}");
        if (!quasis.trim() || isLikelyNonText(quasis)) return;

        const attrParent = pathNode.parent;
        if (t.isJSXAttribute(attrParent)) {
          const attrPropName = t.isJSXIdentifier(attrParent.name) ? attrParent.name.name : null;
          if (attrPropName && SKIP_PROP_NAMES.has(attrPropName)) return;
        }

        const variables = expr.expressions
          .map((e) => (t.isIdentifier(e) ? e.name : t.isMemberExpression(e) && t.isIdentifier(e.property) ? e.property.name : "expr"))
          .filter(Boolean);

        const parent = pathNode.parent;
        const elementName =
          parent && t.isJSXElement(parent) ? getJSXElementName(parent) : "unknown";

        const ancestors = pathNode.getAncestry().map((p) => p.node);
        const component = getComponentName(ancestors);

        candidates.push({
          id: generateId(),
          source: quasis,
          filePath,
          line: expr.loc?.start.line ?? 0,
          column: expr.loc?.start.column ?? 0,
          component,
          parentElement: elementName,
          propName: null,
          route,
          suggestedNamespace: inferNamespace(filePath, route, config.i18n.namespaceStrategy),
          suggestedKey: generateKey(quasis, null),
          description: `Template literal with variables [${variables.join(", ")}] in ${component || "anonymous component"}`,
          variables,
          risk: "REVIEW_REQUIRED",
          riskReason: "Template literal with interpolation — requires manual verification of variable usage.",
          componentType: compType,
        });
      }
    },
  });

  return candidates;
}

function buildSummary(candidates: StringCandidate[], scannedFiles: string[], skippedFiles: string[]): ScanSummary {
  return {
    totalStrings: candidates.length,
    autoSafe: candidates.filter((c) => c.risk === "AUTO_SAFE").length,
    reviewRequired: candidates.filter((c) => c.risk === "REVIEW_REQUIRED").length,
    skipNonUi: candidates.filter((c) => c.risk === "SKIP_NON_UI").length,
    skipDangerous: candidates.filter((c) => c.risk === "SKIP_DANGEROUS").length,
    filesScanned: scannedFiles.length,
    filesSkipped: skippedFiles.length,
  };
}

export async function scanProject(root: string, config: SafeI18nConfig): Promise<ScanResult> {
  resetCounter();

  const files = await fg(config.include, {
    cwd: root,
    ignore: config.exclude,
    absolute: true,
    onlyFiles: true,
  });

  const candidates: StringCandidate[] = [];
  const scannedFiles: string[] = [];
  const skippedFiles: string[] = [];

  for (const file of files) {
    try {
      const source = await readFile(file, "utf-8");
      const relativePath = path.relative(root, file).replace(/\\/g, "/");
      const fileCandiates = extractFromFile(source, relativePath, config);
      candidates.push(...fileCandiates);
      scannedFiles.push(relativePath);
    } catch {
      skippedFiles.push(path.relative(root, file).replace(/\\/g, "/"));
    }
  }

  return {
    candidates,
    summary: buildSummary(candidates, scannedFiles, skippedFiles),
    scannedFiles,
    skippedFiles,
  };
}
