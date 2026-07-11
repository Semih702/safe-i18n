import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { ValidationIssue, ValidationResult, LocaleDiscoveryResult } from "../types.js";
import { flattenMessages } from "./key-analysis.js";
import { checkPlaceholderParity, checkBalancedBraces } from "./placeholder-analysis.js";
import { parseSimpleYaml } from "./locale-file-discovery.js";

export function validateLocales(
  root: string,
  discovery: LocaleDiscoveryResult,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const localesChecked: string[] = [];
  let totalKeys = 0;

  if (!discovery.baseLocale || discovery.locales.length === 0) {
    return { valid: true, issues: [], localesChecked: [], totalKeys: 0 };
  }

  const baseLocale = discovery.baseLocale;
  const allFlat = loadAllFlat(root, discovery);

  const baseMessages = allFlat.get(baseLocale);
  if (!baseMessages) {
    issues.push({
      type: "json-parse-error",
      severity: "error",
      locale: baseLocale,
      key: "",
      message: `Could not read base locale file for "${baseLocale}"`,
    });
    return { valid: false, issues, localesChecked: [], totalKeys: 0 };
  }

  const baseKeys = new Set(Object.keys(baseMessages));
  totalKeys = baseKeys.size;

  // Duplicate check on base
  issues.push(...checkDuplicates(discovery, baseLocale));

  for (const [locale, messages] of allFlat) {
    if (locale === baseLocale) continue;
    localesChecked.push(locale);

    const targetKeys = new Set(Object.keys(messages));

    for (const key of baseKeys) {
      if (!targetKeys.has(key)) {
        issues.push({
          type: "missing-key",
          severity: "error",
          locale,
          key,
          message: `Key "${key}" is missing in locale "${locale}"`,
        });
      }
    }

    for (const key of targetKeys) {
      if (!baseKeys.has(key)) {
        issues.push({
          type: "unused-key",
          severity: "warning",
          locale,
          key,
          message: `Key "${key}" in "${locale}" does not exist in base locale "${baseLocale}"`,
        });
      }
    }

    // Placeholder parity
    issues.push(...checkPlaceholderParity(baseMessages, messages, locale));

    // Duplicates in target
    issues.push(...checkDuplicates(discovery, locale));
  }

  // ICU brace check on all locales
  for (const [locale, messages] of allFlat) {
    for (const [key, value] of Object.entries(messages)) {
      if (!checkBalancedBraces(value)) {
        issues.push({
          type: "syntax-error",
          severity: "error",
          locale,
          key,
          message: `Unbalanced braces in key "${key}" in locale "${locale}"`,
          details: `Value: "${value}"`,
        });
      }
    }
  }

  return {
    valid: issues.filter((i) => i.severity === "error").length === 0,
    issues,
    localesChecked,
    totalKeys,
  };
}

function loadAllFlat(
  root: string,
  discovery: LocaleDiscoveryResult,
): Map<string, Record<string, string>> {
  const result = new Map<string, Record<string, string>>();
  for (const info of discovery.locales) {
    try {
      if (discovery.pattern === "flat-files" && (info.format === "json" || info.format === "yaml")) {
        const content = readFileSync(info.filePath, "utf-8");
        const parsed = info.format === "yaml"
          ? parseSimpleYaml(content)
          : JSON.parse(content) as Record<string, unknown>;
        result.set(info.locale, flattenMessages(parsed));
      } else if (discovery.pattern === "locale-dirs") {
        result.set(info.locale, flattenMessages(loadNamespacedDir(info.filePath)));
      }
    } catch { /* skip */ }
  }
  return result;
}

function loadNamespacedDir(dirPath: string): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) return merged;
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (![".json", ".yaml", ".yml"].includes(ext)) continue;
    const ns = path.basename(entry.name, ext);
    const filePath = path.join(dirPath, entry.name);
    try {
      if (ext === ".yaml" || ext === ".yml") {
        merged[ns] = parseSimpleYaml(readFileSync(filePath, "utf-8"));
      } else {
        merged[ns] = JSON.parse(readFileSync(filePath, "utf-8"));
      }
    } catch { /* skip */ }
  }
  return merged;
}

function checkDuplicates(
  discovery: LocaleDiscoveryResult,
  locale: string,
): ValidationIssue[] {
  const info = discovery.locales.find((l) => l.locale === locale);
  if (!info) return [];

  const filesToCheck: string[] = [];
  if (discovery.pattern === "flat-files" && (info.format === "json" || info.format === "yaml")) {
    filesToCheck.push(info.filePath);
  } else if (discovery.pattern === "locale-dirs" && existsSync(info.filePath)) {
    try {
      for (const entry of readdirSync(info.filePath, { withFileTypes: true })) {
        if (entry.isFile() && [".json", ".yaml", ".yml"].includes(path.extname(entry.name))) {
          filesToCheck.push(path.join(info.filePath, entry.name));
        }
      }
    } catch { /* skip */ }
  }

  const issues: ValidationIssue[] = [];
  for (const fp of filesToCheck) {
    try {
      issues.push(...findDuplicateKeys(readFileSync(fp, "utf-8"), locale));
    } catch { /* skip */ }
  }
  return issues;
}

function findDuplicateKeys(text: string, locale: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let depth = 0;
  const depthKeys = new Map<number, Map<string, number>>();
  let inString = false;

  for (const line of text.split("\n")) {
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && (i === 0 || line[i - 1] !== "\\")) { inString = !inString; continue; }
      if (inString) continue;
      if (c === "{") { depth++; if (!depthKeys.has(depth)) depthKeys.set(depth, new Map()); }
      else if (c === "}") { depthKeys.delete(depth); depth--; }
    }

    const m = /^\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/.exec(line);
    if (!m) continue;
    const key = m[1] as string;
    const map = depthKeys.get(depth) ?? new Map<string, number>();
    if (!depthKeys.has(depth)) depthKeys.set(depth, map);
    const count = map.get(key) ?? 0;
    if (count > 0) {
      issues.push({
        type: "duplicate-key",
        severity: "error",
        locale,
        key,
        message: `Duplicate key "${key}" in locale "${locale}"`,
        details: `Key "${key}" appears more than once at the same nesting level`,
      });
    }
    map.set(key, count + 1);
  }
  return issues;
}
