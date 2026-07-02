import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import * as t from "@babel/types";
import type { MigrationEntry } from "../core/types.js";
import { checkTransformSafety } from "./safety.js";

const traverse = (typeof _traverse === "function" ? _traverse : (_traverse as { default: typeof _traverse }).default) as typeof _traverse;
const generate = (typeof _generate === "function" ? _generate : (_generate as { default: typeof _generate }).default) as typeof _generate;

export interface TransformResult {
  code: string;
  applied: string[];
  skipped: string[];
  errors: string[];
}

interface FileEntryGroup {
  filePath: string;
  entries: MigrationEntry[];
}

function groupByFile(entries: MigrationEntry[]): FileEntryGroup[] {
  const map = new Map<string, MigrationEntry[]>();
  for (const entry of entries) {
    const key = entry.candidate.filePath;
    const group = map.get(key) ?? [];
    group.push(entry);
    map.set(key, group);
  }
  return [...map.entries()].map(([filePath, entries]) => ({ filePath, entries }));
}

function addUseClientDirective(ast: ReturnType<typeof parse>): void {
  const body = ast.program.body;
  if (body.length > 0 && t.isExpressionStatement(body[0])) {
    const expr = body[0].expression;
    if (t.isStringLiteral(expr) && (expr.value === "use client" || expr.value === "use server")) {
      return;
    }
  }
  const directive = t.expressionStatement(t.stringLiteral("use client"));
  body.unshift(directive);
}

function hasImport(ast: ReturnType<typeof parse>, source: string, specifier: string): boolean {
  let found = false;
  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === source) {
        for (const spec of path.node.specifiers) {
          if (t.isImportSpecifier(spec) && t.isIdentifier(spec.imported) && spec.imported.name === specifier) {
            found = true;
          }
        }
      }
    },
  });
  return found;
}

function addImport(ast: ReturnType<typeof parse>, source: string, specifier: string): void {
  if (hasImport(ast, source, specifier)) return;

  const importDecl = t.importDeclaration(
    [t.importSpecifier(t.identifier(specifier), t.identifier(specifier))],
    t.stringLiteral(source),
  );

  const body = ast.program.body;
  let lastImportIdx = -1;
  for (let i = 0; i < body.length; i++) {
    if (t.isImportDeclaration(body[i])) lastImportIdx = i;
  }

  if (lastImportIdx >= 0) {
    body.splice(lastImportIdx + 1, 0, importDecl);
  } else {
    let insertIdx = 0;
    if (body.length > 0 && t.isExpressionStatement(body[0])) {
      const expr = body[0].expression;
      if (t.isStringLiteral(expr) && (expr.value === "use client" || expr.value === "use server")) {
        insertIdx = 1;
      }
    }
    body.splice(insertIdx, 0, importDecl);
  }
}


function bodyHasCall(body: t.BlockStatement, funcName: string, namespace: string): boolean {
  for (const stmt of body.body) {
    if (!t.isVariableDeclaration(stmt)) continue;
    for (const decl of stmt.declarations) {
      let call = decl.init;
      if (t.isAwaitExpression(call)) call = call.argument;
      if (
        t.isCallExpression(call) &&
        t.isIdentifier(call.callee) &&
        call.callee.name === funcName &&
        call.arguments.length > 0 &&
        t.isStringLiteral(call.arguments[0]) &&
        call.arguments[0].value === namespace
      ) {
        return true;
      }
    }
  }
  return false;
}

function addUseTranslationsHook(
  ast: ReturnType<typeof parse>,
  namespace: string,
  varName: string,
  componentNames: Set<string>,
): void {
  traverse(ast, {
    FunctionDeclaration(path) {
      if (!path.node.id || !/^[A-Z]/.test(path.node.id.name)) return;
      if (!componentNames.has(path.node.id.name)) return;
      if (!t.isBlockStatement(path.node.body)) return;
      if (bodyHasCall(path.node.body, "useTranslations", namespace)) return;
      const hookCall = t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier(varName),
          t.callExpression(t.identifier("useTranslations"), [t.stringLiteral(namespace)]),
        ),
      ]);
      path.node.body.body.unshift(hookCall);
    },
    VariableDeclarator(path) {
      if (!t.isIdentifier(path.node.id) || !/^[A-Z]/.test(path.node.id.name)) return;
      if (!componentNames.has(path.node.id.name)) return;
      const init = path.node.init;
      if (!t.isArrowFunctionExpression(init) && !t.isFunctionExpression(init)) return;
      if (!t.isBlockStatement(init.body)) return;
      if (bodyHasCall(init.body, "useTranslations", namespace)) return;
      const hookCall = t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier(varName),
          t.callExpression(t.identifier("useTranslations"), [t.stringLiteral(namespace)]),
        ),
      ]);
      init.body.body.unshift(hookCall);
    },
  });
}

function addGetTranslationsCall(
  ast: ReturnType<typeof parse>,
  namespace: string,
  varName: string,
  componentNames: Set<string>,
): void {
  traverse(ast, {
    FunctionDeclaration(path) {
      if (!path.node.id || !/^[A-Z]/.test(path.node.id.name)) return;
      if (!componentNames.has(path.node.id.name)) return;
      if (!t.isBlockStatement(path.node.body)) return;
      if (bodyHasCall(path.node.body, "getTranslations", namespace)) return;
      const awaitCall = t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier(varName),
          t.awaitExpression(
            t.callExpression(t.identifier("getTranslations"), [t.stringLiteral(namespace)]),
          ),
        ),
      ]);
      path.node.async = true;
      path.node.body.body.unshift(awaitCall);
    },
    VariableDeclarator(path) {
      if (!t.isIdentifier(path.node.id) || !/^[A-Z]/.test(path.node.id.name)) return;
      if (!componentNames.has(path.node.id.name)) return;
      const init = path.node.init;
      if (!t.isArrowFunctionExpression(init) && !t.isFunctionExpression(init)) return;
      if (!t.isBlockStatement(init.body)) return;
      if (bodyHasCall(init.body, "getTranslations", namespace)) return;
      const awaitCall = t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier(varName),
          t.awaitExpression(
            t.callExpression(t.identifier("getTranslations"), [t.stringLiteral(namespace)]),
          ),
        ),
      ]);
      init.async = true;
      init.body.body.unshift(awaitCall);
    },
  });
}

export function transformFileSource(
  source: string,
  entries: MigrationEntry[],
  safeOnly: boolean,
): TransformResult {
  const applied: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  const entriesToApply = entries.filter((entry) => {
    if (safeOnly) {
      const check = checkTransformSafety(entry);
      if (!check.safe) {
        skipped.push(`${entry.candidateId}: ${check.reason}`);
        return false;
      }
    }
    if (entry.action !== "apply") {
      skipped.push(`${entry.candidateId}: action is "${entry.action}"`);
      return false;
    }
    return true;
  });

  if (entriesToApply.length === 0) {
    return { code: source, applied, skipped, errors };
  }

  let ast: ReturnType<typeof parse>;
  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: ["jsx", "typescript", "decorators"],
      errorRecovery: true,
    });
  } catch (err) {
    errors.push(`Failed to parse file: ${err instanceof Error ? err.message : String(err)}`);
    return { code: source, applied, skipped, errors };
  }

  const componentType = entriesToApply[0]?.candidate.componentType ?? "unknown";
  const isServer = componentType === "server";

  const namespaces = [...new Set(entriesToApply.map((e) => e.namespace))];
  const tVarNames = new Map<string, string>();

  for (const ns of namespaces) {
    const varName = namespaces.length === 1 ? "t" : `t${ns.charAt(0).toUpperCase() + ns.slice(1).replace(/[^a-zA-Z0-9]/g, "")}`;
    tVarNames.set(ns, varName);
  }

  const componentNames = new Set(
    entriesToApply.map((e) => e.candidate.component).filter((c): c is string => c !== null),
  );

  if (isServer) {
    addImport(ast, "next-intl/server", "getTranslations");
    for (const [ns, varName] of tVarNames) {
      addGetTranslationsCall(ast, ns, varName, componentNames);
    }
  } else {
    const hasDirective = /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*(["'])use client\1/.test(source);
    if (!hasDirective) {
      addUseClientDirective(ast);
    }
    addImport(ast, "next-intl", "useTranslations");
    for (const [ns, varName] of tVarNames) {
      addUseTranslationsHook(ast, ns, varName, componentNames);
    }
  }

  const entryByLineCol = new Map<string, MigrationEntry>();
  for (const entry of entriesToApply) {
    const key = `${entry.candidate.line}:${entry.candidate.column}`;
    entryByLineCol.set(key, entry);
  }

  traverse(ast, {
    JSXText(path) {
      const text = path.node.value.trim();
      if (!text) return;
      const loc = path.node.loc;
      if (!loc) return;
      const key = `${loc.start.line}:${loc.start.column}`;
      const entry = entryByLineCol.get(key);
      if (!entry) return;

      const tVar = tVarNames.get(entry.namespace) ?? "t";
      const callExpr = t.jsxExpressionContainer(
        t.callExpression(t.identifier(tVar), [t.stringLiteral(entry.translationKey)]),
      );
      path.replaceWith(callExpr);
      applied.push(entry.candidateId);
    },

    JSXAttribute(path) {
      const attrName = t.isJSXIdentifier(path.node.name) ? path.node.name.name : null;
      if (!attrName || !t.isStringLiteral(path.node.value)) return;
      const loc = path.node.value.loc;
      if (!loc) return;
      const key = `${loc.start.line}:${loc.start.column}`;
      const entry = entryByLineCol.get(key);
      if (!entry) return;

      const tVar = tVarNames.get(entry.namespace) ?? "t";
      path.node.value = t.jsxExpressionContainer(
        t.callExpression(t.identifier(tVar), [t.stringLiteral(entry.translationKey)]),
      ) as unknown as t.StringLiteral;
      applied.push(entry.candidateId);
    },

    JSXExpressionContainer(path) {
      const expr = path.node.expression;
      if (!t.isStringLiteral(expr)) return;
      const loc = expr.loc;
      if (!loc) return;
      const key = `${loc.start.line}:${loc.start.column}`;
      const entry = entryByLineCol.get(key);
      if (!entry) return;

      const tVar = tVarNames.get(entry.namespace) ?? "t";
      path.node.expression = t.callExpression(t.identifier(tVar), [
        t.stringLiteral(entry.translationKey),
      ]);
      applied.push(entry.candidateId);
    },

    StringLiteral(path) {
      const loc = path.node.loc;
      if (!loc) return;
      const key = `${loc.start.line}:${loc.start.column}`;
      const entry = entryByLineCol.get(key);
      if (!entry) return;
      if (path.parent && (t.isJSXAttribute(path.parent) || t.isImportDeclaration(path.parent))) return;

      const tVar = tVarNames.get(entry.namespace) ?? "t";
      path.replaceWith(
        t.callExpression(t.identifier(tVar), [t.stringLiteral(entry.translationKey)]),
      );
      applied.push(entry.candidateId);
    },
  });

  const output = generate(ast, {
    retainLines: true,
    concise: false,
  }, source);

  return { code: output.code, applied, skipped, errors };
}

export { groupByFile };
export type { FileEntryGroup };
