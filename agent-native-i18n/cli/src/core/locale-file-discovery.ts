import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { LocaleDiscoveryResult, LocaleFileInfo } from "../types.js";

const COMMON_LOCALE_DIRS = [
  "messages",
  "locales",
  "locale",
  "i18n",
  "translations",
  "lang",
  "langs",
  "src/messages",
  "src/locales",
  "src/locale",
  "src/i18n",
  "src/translations",
  "src/lang",
  "public/locales",
  "public/lang",
];

const LOCALE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

export function discoverLocaleFiles(root: string): LocaleDiscoveryResult {
  for (const dir of COMMON_LOCALE_DIRS) {
    const fullDir = path.join(root, dir);
    if (!existsSync(fullDir) || !statSync(fullDir).isDirectory()) continue;

    const result = scanLocaleDir(root, fullDir, dir);
    if (result.locales.length > 0) {
      return result;
    }
  }

  return {
    localeDir: null,
    locales: [],
    baseLocale: null,
    pattern: "unknown",
  };
}

function scanLocaleDir(
  root: string,
  dirPath: string,
  relativeDir: string,
): LocaleDiscoveryResult {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  const locales: LocaleFileInfo[] = [];

  // Check for flat JSON files like messages/en.json
  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name);
    if (![".json", ".ts", ".js"].includes(ext)) continue;

    const localeName = path.basename(entry.name, ext);
    if (!LOCALE_PATTERN.test(localeName)) continue;

    const filePath = path.join(dirPath, entry.name);
    const relativePath = path.join(relativeDir, entry.name).replace(/\\/g, "/");
    const format = ext.slice(1) as "json" | "ts" | "js";
    const keyCount = format === "json" ? countJsonKeys(filePath) : 0;

    locales.push({
      locale: localeName,
      filePath,
      relativePath,
      format,
      keyCount,
    });
  }

  if (locales.length > 0) {
    const baseLocale = inferBaseLocale(locales);
    return {
      localeDir: relativeDir,
      locales,
      baseLocale,
      pattern: "flat-files",
    };
  }

  // Check for locale directories like locales/en/common.json
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!LOCALE_PATTERN.test(entry.name)) continue;

    const localeDirPath = path.join(dirPath, entry.name);
    const files = readdirSync(localeDirPath, { withFileTypes: true });

    let totalKeys = 0;
    for (const file of files) {
      if (file.isFile() && file.name.endsWith(".json")) {
        totalKeys += countJsonKeys(path.join(localeDirPath, file.name));
      }
    }

    const relativePath = path.join(relativeDir, entry.name).replace(/\\/g, "/");
    locales.push({
      locale: entry.name,
      filePath: localeDirPath,
      relativePath,
      format: "json",
      keyCount: totalKeys,
    });
  }

  if (locales.length > 0) {
    const baseLocale = inferBaseLocale(locales);
    return {
      localeDir: relativeDir,
      locales,
      baseLocale,
      pattern: "locale-dirs",
    };
  }

  return {
    localeDir: relativeDir,
    locales: [],
    baseLocale: null,
    pattern: "unknown",
  };
}

function countJsonKeys(filePath: string): number {
  try {
    const content = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return countNestedKeys(parsed);
  } catch {
    return 0;
  }
}

function countNestedKeys(obj: Record<string, unknown>): number {
  let count = 0;
  for (const value of Object.values(obj)) {
    if (typeof value === "string") {
      count++;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      count += countNestedKeys(value as Record<string, unknown>);
    }
  }
  return count;
}

function inferBaseLocale(locales: LocaleFileInfo[]): string | null {
  // Prefer "en" if it exists
  const en = locales.find((l) => l.locale === "en");
  if (en) return "en";

  // Otherwise pick the locale with the most keys
  const sorted = [...locales].sort((a, b) => b.keyCount - a.keyCount);
  return sorted[0]?.locale ?? null;
}
