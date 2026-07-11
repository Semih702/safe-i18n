import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import type { KeyAnalysis, LocaleCoverage, LocaleDiscoveryResult } from "../types.js";

export function analyzeKeys(
  root: string,
  discovery: LocaleDiscoveryResult,
): KeyAnalysis | null {
  if (!discovery.baseLocale || discovery.locales.length === 0) {
    return null;
  }

  const baseLocale = discovery.baseLocale;
  const allMessages = loadAllMessages(root, discovery);
  const baseMessages = allMessages.get(baseLocale);

  if (!baseMessages) return null;

  const baseKeys = new Set(Object.keys(baseMessages));
  const coverage: Record<string, LocaleCoverage> = {};
  const missingKeys: Record<string, string[]> = {};
  const extraKeys: Record<string, string[]> = {};

  for (const [locale, messages] of allMessages) {
    if (locale === baseLocale) continue;

    const targetKeys = new Set(Object.keys(messages));
    const missing = [...baseKeys].filter((k) => !targetKeys.has(k));
    const extra = [...targetKeys].filter((k) => !baseKeys.has(k));
    const matching = [...baseKeys].filter((k) => targetKeys.has(k));

    coverage[locale] = {
      locale,
      totalKeys: targetKeys.size,
      matchingKeys: matching.length,
      missingKeys: missing.length,
      extraKeys: extra.length,
      coveragePercent: baseKeys.size > 0 ? Math.round((matching.length / baseKeys.size) * 100) : 100,
    };

    if (missing.length > 0) missingKeys[locale] = missing;
    if (extra.length > 0) extraKeys[locale] = extra;
  }

  return {
    baseLocale,
    locales: [...allMessages.keys()],
    totalKeysInBase: baseKeys.size,
    coverage,
    missingKeys,
    extraKeys,
  };
}

function loadAllMessages(
  root: string,
  discovery: LocaleDiscoveryResult,
): Map<string, Record<string, string>> {
  const result = new Map<string, Record<string, string>>();

  for (const localeInfo of discovery.locales) {
    try {
      let messages: Record<string, unknown>;

      if (discovery.pattern === "flat-files") {
        if (localeInfo.format !== "json") continue;
        const content = readFileSync(localeInfo.filePath, "utf-8");
        messages = JSON.parse(content) as Record<string, unknown>;
      } else if (discovery.pattern === "locale-dirs") {
        messages = loadNamespacedMessages(localeInfo.filePath);
      } else {
        continue;
      }

      result.set(localeInfo.locale, flattenMessages(messages));
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
      // Skip unreadable files
    }
  }
  return merged;
}

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
      Object.assign(result, flattenMessages(value as Record<string, unknown>, fullKey));
    }
  }

  return result;
}
