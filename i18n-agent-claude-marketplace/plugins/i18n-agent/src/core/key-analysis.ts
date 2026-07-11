import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import type { KeyAnalysis, LocaleCoverage, LocaleDiscoveryResult } from "../types.js";
import { parseSimpleYaml } from "./locale-file-discovery.js";

export function analyzeKeys(
  root: string,
  discovery: LocaleDiscoveryResult,
): KeyAnalysis | null {
  if (!discovery.baseLocale || discovery.locales.length === 0) return null;

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
      coveragePercent:
        baseKeys.size > 0
          ? Math.round((matching.length / baseKeys.size) * 100)
          : 100,
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
      let raw: Record<string, unknown>;
      if (discovery.pattern === "flat-files") {
        raw = readLocaleFile(localeInfo.filePath, localeInfo.format);
      } else if (discovery.pattern === "locale-dirs") {
        raw = loadNamespacedDir(localeInfo.filePath);
      } else {
        continue;
      }
      result.set(localeInfo.locale, flattenMessages(raw));
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

function readLocaleFile(filePath: string, format: string): Record<string, unknown> {
  const content = readFileSync(filePath, "utf-8");
  if (format === "yaml") return parseSimpleYaml(content);
  return JSON.parse(content) as Record<string, unknown>;
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
