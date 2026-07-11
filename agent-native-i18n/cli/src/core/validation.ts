import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { ValidationIssue, ValidationResult, LocaleDiscoveryResult } from "../types.js";
import { flattenMessages } from "./key-analysis.js";

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

  // Check base locale for duplicates
  issues.push(...checkDuplicates(root, discovery, baseLocale));

  for (const [locale, messages] of allFlat) {
    if (locale === baseLocale) continue;
    localesChecked.push(locale);

    const targetKeys = new Set(Object.keys(messages));

    // Missing keys
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

    // Unused keys
    for (const key of targetKeys) {
      if (!baseKeys.has(key)) {
        issues.push({
          type: "unused-key",
          severity: "warning",
          locale,
          key,
          message: `Key "${key}" in locale "${locale}" does not exist in base locale "${baseLocale}"`,
        });
      }
    }

    // Placeholder parity
    for (const key of baseKeys) {
      const baseValue = baseMessages[key];
      const targetValue = messages[key];
      if (baseValue === undefined || targetValue === undefined) continue;

      const basePlaceholders = extractPlaceholders(baseValue);
      const targetPlaceholders = extractPlaceholders(targetValue);

      for (const ph of basePlaceholders) {
        if (!targetPlaceholders.includes(ph)) {
          issues.push({
            type: "placeholder-mismatch",
            severity: "error",
            locale,
            key,
            message: `Placeholder "{${ph}}" in base locale is missing in locale "${locale}"`,
            details: `Base: "${baseValue}" | Target: "${targetValue}"`,
          });
        }
      }

      for (const ph of targetPlaceholders) {
        if (!basePlaceholders.includes(ph)) {
          issues.push({
            type: "placeholder-mismatch",
            severity: "error",
            locale,
            key,
            message: `Placeholder "{${ph}}" in locale "${locale}" does not exist in base locale`,
            details: `Base: "${baseValue}" | Target: "${targetValue}"`,
          });
        }
      }
    }

    // Duplicate keys in target
    issues.push(...checkDuplicates(root, discovery, locale));
  }

  // ICU syntax check on all locales
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

  for (const localeInfo of discovery.locales) {
    try {
      if (discovery.pattern === "flat-files" && localeInfo.format === "json") {
        const content = readFileSync(localeInfo.filePath, "utf-8");
        const parsed = JSON.parse(content) as Record<string, unknown>;
        result.set(localeInfo.locale, flattenMessages(parsed));
      } else if (discovery.pattern === "locale-dirs") {
        const merged = loadNamespacedMessages(localeInfo.filePath);
        result.set(localeInfo.locale, flattenMessages(merged));
      }
    } catch {
      // Skip unreadable files
    }
  }

  return result;
}

function loadNamespacedMessages(dirPath: string): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) return merged;

  const files = readdirSync(dirPath, { withFileTypes: true });
  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith(".json")) continue;
    const namespace = path.basename(file.name, ".json");
    try {
      const content = readFileSync(path.join(dirPath, file.name), "utf-8");
      merged[namespace] = JSON.parse(content);
    } catch {
      // Skip
    }
  }
  return merged;
}

function extractPlaceholders(text: string): string[] {
  const pattern = /\{(\w+)\}/g;
  const placeholders: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const name = match[1];
    if (name !== undefined && !placeholders.includes(name)) {
      placeholders.push(name);
    }
  }
  return placeholders;
}

function checkBalancedBraces(text: string): boolean {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "'" && i + 1 < text.length) {
      const next = text[i + 1];
      if (next === "{" || next === "}") {
        i++;
        continue;
      }
    }
    if (char === "{") depth++;
    else if (char === "}") {
      depth--;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

function checkDuplicates(
  root: string,
  discovery: LocaleDiscoveryResult,
  locale: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const localeInfo = discovery.locales.find((l) => l.locale === locale);
  if (!localeInfo) return issues;

  const filesToCheck: string[] = [];

  if (discovery.pattern === "flat-files" && localeInfo.format === "json") {
    filesToCheck.push(localeInfo.filePath);
  } else if (discovery.pattern === "locale-dirs" && existsSync(localeInfo.filePath)) {
    try {
      const files = readdirSync(localeInfo.filePath, { withFileTypes: true });
      for (const file of files) {
        if (file.isFile() && file.name.endsWith(".json")) {
          filesToCheck.push(path.join(localeInfo.filePath, file.name));
        }
      }
    } catch {
      // Skip
    }
  }

  for (const filePath of filesToCheck) {
    try {
      const text = readFileSync(filePath, "utf-8");
      issues.push(...findDuplicateKeysInJson(text, locale));
    } catch {
      // Skip
    }
  }

  return issues;
}

function findDuplicateKeysInJson(text: string, locale: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let depth = 0;
  const depthKeys = new Map<number, Map<string, number>>();
  const lines = text.split("\n");
  let inString = false;

  for (const line of lines) {
    for (let ci = 0; ci < line.length; ci++) {
      const c = line[ci];
      if (c === '"' && (ci === 0 || line[ci - 1] !== "\\")) {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (c === "{") {
        depth++;
        if (!depthKeys.has(depth)) depthKeys.set(depth, new Map());
      } else if (c === "}") {
        depthKeys.delete(depth);
        depth--;
      }
    }

    const keyMatch = /^\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/.exec(line);
    if (keyMatch) {
      const key = keyMatch[1] as string;
      const currentDepthKeys = depthKeys.get(depth) ?? new Map<string, number>();
      if (!depthKeys.has(depth)) depthKeys.set(depth, currentDepthKeys);

      const count = currentDepthKeys.get(key) ?? 0;
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
      currentDepthKeys.set(key, count + 1);
    }
  }

  return issues;
}
