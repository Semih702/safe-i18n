import type { RiskLevel } from "./types.js";
import { RiskLevel as RiskLevelEnum } from "./types.js";

export interface RiskContext {
  source: string;
  parentType: string;
  propName: string | null;
  isInConditional: boolean;
  isInTemplateLiteral: boolean;
  isComparisonOperand: boolean;
  isObjectKey: boolean;
  isInConsoleCall: boolean;
  isInApiCall: boolean;
  isInTestId: boolean;
  isInClassName: boolean;
  isInStorageCall: boolean;
  isInAnalyticsCall: boolean;
  isInRouteDefinition: boolean;
  isInImport: boolean;
  isEnumValue: boolean;
}

const VISIBLE_ELEMENTS = new Set([
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "button",
  "label",
  "a",
  "li",
  "td",
  "th",
  "caption",
  "summary",
  "legend",
  "figcaption",
  "dt",
  "dd",
  "blockquote",
  "em",
  "strong",
  "small",
  "b",
  "i",
  "u",
  "mark",
  "cite",
  "q",
  "abbr",
  "option",
  "textarea",
  "title",
]);

const COMPONENT_CHILDREN_SAFE = new Set([
  "Button",
  "Link",
  "MenuItem",
  "Tab",
  "Badge",
  "Chip",
  "Tag",
  "Alert",
  "Toast",
  "Tooltip",
  "Text",
  "Heading",
  "Title",
  "Label",
  "Paragraph",
]);

const SAFE_PROPS = new Set([
  "placeholder",
  "aria-label",
  "aria-placeholder",
  "aria-roledescription",
  "aria-valuetext",
  "title",
  "alt",
  "label",
  "description",
  "helperText",
  "errorMessage",
  "successMessage",
  "tooltip",
  "hint",
]);

function looksLikeUrlOrPath(source: string): boolean {
  return (
    source.startsWith("/") ||
    source.startsWith("http://") ||
    source.startsWith("https://") ||
    source.startsWith("mailto:") ||
    source.startsWith("tel:")
  );
}

function looksLikeIdentifier(source: string): boolean {
  if (source.includes(" ")) return false;
  if (!/^[a-z][a-zA-Z0-9_.-]*$/.test(source)) return false;
  return /[A-Z_.\-]/.test(source);
}

function looksLikeConfigKey(propName: string | null): boolean {
  if (!propName) return false;
  const configProps = new Set([
    "key",
    "id",
    "name",
    "type",
    "value",
    "href",
    "src",
    "action",
    "method",
    "target",
    "rel",
    "role",
    "className",
    "style",
    "variant",
    "size",
    "color",
    "icon",
    "as",
    "component",
    "ref",
    "testId",
    "data-testid",
  ]);
  return configProps.has(propName);
}

export function classifyRisk(
  context: RiskContext,
): { risk: RiskLevel; reason: string } {
  // --- SKIP_NON_UI ---
  if (context.isInConsoleCall) {
    return { risk: RiskLevelEnum.SKIP_NON_UI, reason: "String in console call" };
  }

  if (context.isInTestId) {
    return { risk: RiskLevelEnum.SKIP_NON_UI, reason: "String used as test ID (data-testid)" };
  }

  if (context.isInClassName) {
    return { risk: RiskLevelEnum.SKIP_NON_UI, reason: "String used as CSS class name" };
  }

  if (context.isInImport) {
    return { risk: RiskLevelEnum.SKIP_NON_UI, reason: "String in import path" };
  }

  if (context.isInRouteDefinition) {
    return { risk: RiskLevelEnum.SKIP_NON_UI, reason: "String in route definition" };
  }

  if (context.isEnumValue) {
    return { risk: RiskLevelEnum.SKIP_NON_UI, reason: "String is an enum value" };
  }

  if (context.isInAnalyticsCall) {
    return { risk: RiskLevelEnum.SKIP_NON_UI, reason: "String in analytics call" };
  }

  if (context.isObjectKey && looksLikeConfigKey(context.propName)) {
    return { risk: RiskLevelEnum.SKIP_NON_UI, reason: "Object key that looks like config" };
  }

  // --- SKIP_DANGEROUS ---
  if (context.isComparisonOperand) {
    return {
      risk: RiskLevelEnum.SKIP_DANGEROUS,
      reason: "String used as comparison operand — changing it would break logic",
    };
  }

  if (context.isInStorageCall) {
    return {
      risk: RiskLevelEnum.SKIP_DANGEROUS,
      reason: "String in storage call (localStorage/sessionStorage)",
    };
  }

  if (context.isInApiCall) {
    return {
      risk: RiskLevelEnum.SKIP_DANGEROUS,
      reason: "String in API call — likely an endpoint or parameter",
    };
  }

  // Safe props (placeholder, alt, title, etc.) take priority over identifier/URL heuristics
  if (context.propName !== null && SAFE_PROPS.has(context.propName)) {
    return {
      risk: RiskLevelEnum.AUTO_SAFE,
      reason: `String in safe prop "${context.propName}"`,
    };
  }

  if (looksLikeUrlOrPath(context.source)) {
    return {
      risk: RiskLevelEnum.SKIP_DANGEROUS,
      reason: "String looks like a URL or path",
    };
  }

  if (looksLikeIdentifier(context.source)) {
    return {
      risk: RiskLevelEnum.SKIP_DANGEROUS,
      reason: "String looks like an identifier, not user-visible text",
    };
  }

  // --- REVIEW_REQUIRED (checked before AUTO_SAFE: uncertainty outranks safe context) ---
  if (context.isInConditional) {
    return {
      risk: RiskLevelEnum.REVIEW_REQUIRED,
      reason: "String inside conditional expression",
    };
  }

  if (context.isInTemplateLiteral) {
    return {
      risk: RiskLevelEnum.REVIEW_REQUIRED,
      reason: "String in template literal — may contain dynamic content",
    };
  }

  // --- AUTO_SAFE ---
  if (context.propName === null && VISIBLE_ELEMENTS.has(context.parentType)) {
    return {
      risk: RiskLevelEnum.AUTO_SAFE,
      reason: `Static text in <${context.parentType}> element`,
    };
  }

  if (context.propName === null && COMPONENT_CHILDREN_SAFE.has(context.parentType)) {
    return {
      risk: RiskLevelEnum.AUTO_SAFE,
      reason: `Text child of <${context.parentType}> component`,
    };
  }

  // String passed to unknown function
  if (context.parentType === "CallExpression") {
    return {
      risk: RiskLevelEnum.REVIEW_REQUIRED,
      reason: "String passed to a function call — verify it is user-visible",
    };
  }

  // Strings in arrays or objects that could be UI labels
  if (context.parentType === "ArrayExpression" || context.parentType === "ObjectExpression") {
    return {
      risk: RiskLevelEnum.REVIEW_REQUIRED,
      reason: `String in ${context.parentType === "ArrayExpression" ? "array" : "object"} — could be a UI label`,
    };
  }

  // Default to REVIEW_REQUIRED for anything we can't confidently classify
  return {
    risk: RiskLevelEnum.REVIEW_REQUIRED,
    reason: "Could not confidently classify — manual review recommended",
  };
}
