import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ValidationIssue } from "../core/types.js";

export interface LocaleValidatorOptions {
  root: string;
  messagesPath: string;
  sourceLocale: string;
  targetLocales: string[];
}

/**
 * Flattens a nested object into dot-separated keys with string leaf values.
 */
export function flattenMessages(
  obj: Record<string, unknown>,
  prefix?: string,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      result[fullKey] = value;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const nested = flattenMessages(value as Record<string, unknown>, fullKey);
      Object.assign(result, nested);
    }
  }

  return result;
}

/**
 * Reads and parses a locale JSON file from the messages directory.
 */
export async function readLocaleFile(
  root: string,
  messagesPath: string,
  locale: string,
): Promise<Record<string, unknown>> {
  const filePath = path.join(root, messagesPath, `${locale}.json`);
  const content = await readFile(filePath, "utf-8");
  return JSON.parse(content) as Record<string, unknown>;
}

/**
 * Scans raw JSON text for duplicate keys at the same nesting level.
 * Since JSON.parse silently discards duplicates, this operates on the source text.
 */
function findDuplicateKeys(text: string, locale: string): ValidationIssue[] {
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
        if (!depthKeys.has(depth)) {
          depthKeys.set(depth, new Map());
        }
      } else if (c === "}") {
        depthKeys.delete(depth);
        depth--;
      }
    }

    const keyMatch = /^\s*"([^"\\]*(?:\\.[^"\\]*)*)"\s*:/.exec(line);
    if (keyMatch) {
      const key = keyMatch[1] as string;
      const currentDepthKeys = depthKeys.get(depth) ?? new Map<string, number>();
      if (!depthKeys.has(depth)) {
        depthKeys.set(depth, currentDepthKeys);
      }

      const count = currentDepthKeys.get(key) ?? 0;
      if (count > 0) {
        issues.push({
          type: "duplicate-key",
          severity: "error",
          locale,
          key,
          message: `Duplicate key "${key}" found in locale file for "${locale}"`,
          details: `Key "${key}" appears more than once at the same nesting level`,
        });
      }
      currentDepthKeys.set(key, count + 1);
    }
  }

  return issues;
}

/**
 * Validates locale files for missing keys, unused keys, and duplicate keys.
 */
export async function validateLocaleFiles(
  options: LocaleValidatorOptions,
): Promise<ValidationIssue[]> {
  const { root, messagesPath, sourceLocale, targetLocales } = options;
  const issues: ValidationIssue[] = [];
  const messagesDir = path.join(root, messagesPath);

  // Read source locale
  let sourceMessages: Record<string, string>;
  try {
    const sourceRaw = await readLocaleFile(root, messagesPath, sourceLocale);
    sourceMessages = flattenMessages(sourceRaw);
  } catch {
    issues.push({
      type: "missing-key",
      severity: "error",
      locale: sourceLocale,
      key: "",
      message: `Source locale file "${sourceLocale}.json" could not be read`,
    });
    return issues;
  }

  // Check source file for duplicate keys
  try {
    const sourceFilePath = path.join(messagesDir, `${sourceLocale}.json`);
    const sourceText = await readFile(sourceFilePath, "utf-8");
    const duplicates = findDuplicateKeys(sourceText, sourceLocale);
    issues.push(...duplicates);
  } catch {
    // Already handled above
  }

  const sourceKeys = new Set(Object.keys(sourceMessages));

  // Validate each target locale
  for (const targetLocale of targetLocales) {
    let targetMessages: Record<string, string>;
    try {
      const targetRaw = await readLocaleFile(root, messagesPath, targetLocale);
      targetMessages = flattenMessages(targetRaw);
    } catch {
      // If target file doesn't exist, all source keys are missing
      for (const key of sourceKeys) {
        issues.push({
          type: "missing-key",
          severity: "error",
          locale: targetLocale,
          key,
          message: `Key "${key}" is missing in locale "${targetLocale}"`,
        });
      }
      continue;
    }

    // Check for duplicate keys in target file
    try {
      const targetFilePath = path.join(messagesDir, `${targetLocale}.json`);
      const targetText = await readFile(targetFilePath, "utf-8");
      const duplicates = findDuplicateKeys(targetText, targetLocale);
      issues.push(...duplicates);
    } catch {
      // Skip duplicate check if file can't be re-read
    }

    const targetKeys = new Set(Object.keys(targetMessages));

    // Check for missing keys in target (present in source but not target)
    for (const key of sourceKeys) {
      if (!targetKeys.has(key)) {
        issues.push({
          type: "missing-key",
          severity: "error",
          locale: targetLocale,
          key,
          message: `Key "${key}" is missing in locale "${targetLocale}"`,
        });
      }
    }

    // Check for unused keys in target (present in target but not source)
    for (const key of targetKeys) {
      if (!sourceKeys.has(key)) {
        issues.push({
          type: "unused-key",
          severity: "warning",
          locale: targetLocale,
          key,
          message: `Key "${key}" in locale "${targetLocale}" does not exist in source locale "${sourceLocale}"`,
        });
      }
    }
  }

  return issues;
}
