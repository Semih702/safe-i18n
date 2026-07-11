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
  "src/i18n/messages",
  "src/i18n/locales",
  "src/translations",
  "src/lang",
  "public/locales",
  "public/lang",
  "assets/locales",
  "assets/i18n",
];

const LOCALE_CODE = /^[a-z]{2}(-[A-Z]{2})?$/;

export function discoverLocaleFiles(root: string): LocaleDiscoveryResult {
  for (const dir of COMMON_LOCALE_DIRS) {
    const fullDir = path.join(root, dir);
    if (!existsSync(fullDir) || !statSync(fullDir).isDirectory()) continue;
    const result = scanLocaleDir(root, fullDir, dir);
    if (result.locales.length > 0) return result;
  }

  return { localeDir: null, locales: [], baseLocale: null, pattern: "unknown" };
}

function scanLocaleDir(
  root: string,
  dirPath: string,
  relativeDir: string,
): LocaleDiscoveryResult {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  const locales: LocaleFileInfo[] = [];

  // Flat files: messages/en.json, messages/en.yaml, messages/tr.json
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (![".json", ".yaml", ".yml", ".ts", ".js"].includes(ext)) continue;
    const locale = path.basename(entry.name, ext);
    if (!LOCALE_CODE.test(locale)) continue;

    const filePath = path.join(dirPath, entry.name);
    const relativePath = path.join(relativeDir, entry.name).replace(/\\/g, "/");
    const format = normalizeFormat(ext);
    const keyCount = countKeysInFile(filePath, format);

    locales.push({ locale, filePath, relativePath, format, keyCount });
  }

  if (locales.length > 0) {
    return {
      localeDir: relativeDir,
      locales,
      baseLocale: inferBaseLocale(locales),
      pattern: "flat-files",
    };
  }

  // Locale directories: locales/en/common.json, locales/en/auth.json
  for (const entry of entries) {
    if (!entry.isDirectory() || !LOCALE_CODE.test(entry.name)) continue;

    const localeDirPath = path.join(dirPath, entry.name);
    let totalKeys = 0;
    try {
      const files = readdirSync(localeDirPath, { withFileTypes: true });
      for (const file of files) {
        if (!file.isFile()) continue;
        const fExt = path.extname(file.name);
        if ([".json", ".yaml", ".yml"].includes(fExt)) {
          totalKeys += countKeysInFile(
            path.join(localeDirPath, file.name),
            normalizeFormat(fExt),
          );
        }
      }
    } catch { /* skip */ }

    locales.push({
      locale: entry.name,
      filePath: localeDirPath,
      relativePath: path.join(relativeDir, entry.name).replace(/\\/g, "/"),
      format: "json",
      keyCount: totalKeys,
    });
  }

  if (locales.length > 0) {
    return {
      localeDir: relativeDir,
      locales,
      baseLocale: inferBaseLocale(locales),
      pattern: "locale-dirs",
    };
  }

  return { localeDir: relativeDir, locales: [], baseLocale: null, pattern: "unknown" };
}

function normalizeFormat(ext: string): "json" | "yaml" | "ts" | "js" {
  if (ext === ".yaml" || ext === ".yml") return "yaml";
  if (ext === ".ts") return "ts";
  if (ext === ".js") return "js";
  return "json";
}

function countKeysInFile(filePath: string, format: string): number {
  if (format === "json") return countJsonKeys(filePath);
  if (format === "yaml") return countYamlKeys(filePath);
  return 0;
}

function countJsonKeys(filePath: string): number {
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
    return countNested(parsed);
  } catch {
    return 0;
  }
}

function countYamlKeys(filePath: string): number {
  try {
    const content = readFileSync(filePath, "utf-8");
    const parsed = parseSimpleYaml(content);
    return countNested(parsed);
  } catch {
    return 0;
  }
}

/**
 * Minimal YAML parser for flat and single-nested key-value locale files.
 * Handles the common patterns used in i18n YAML files without requiring
 * a full YAML library. Supports:
 *   key: value
 *   key: "quoted value"
 *   key: 'single quoted'
 *   parent:
 *     child: value
 * Does not support: anchors, aliases, multi-line, flow sequences, tags.
 */
export function parseSimpleYaml(content: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [
    { obj: root, indent: -1 },
  ];

  for (const rawLine of content.split("\n")) {
    // Skip comments and blank lines
    if (/^\s*(#|$)/.test(rawLine)) continue;

    const indent = rawLine.search(/\S/);
    if (indent < 0) continue;

    const trimmed = rawLine.trim();
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx < 0) continue;

    const key = trimmed.slice(0, colonIdx).trim().replace(/^["']|["']$/g, "");
    const rawValue = trimmed.slice(colonIdx + 1).trim();

    // Pop back to the right parent level
    while (stack.length > 1 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1]!.obj;

    if (rawValue === "" || rawValue === "|" || rawValue === ">") {
      // Start a new nested object
      const child: Record<string, unknown> = {};
      parent[key] = child;
      stack.push({ obj: child, indent });
    } else {
      // Leaf value — strip surrounding quotes
      parent[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }

  return root;
}

function countNested(obj: Record<string, unknown>): number {
  let n = 0;
  for (const v of Object.values(obj)) {
    if (typeof v === "string") n++;
    else if (typeof v === "object" && v !== null && !Array.isArray(v))
      n += countNested(v as Record<string, unknown>);
  }
  return n;
}

function inferBaseLocale(locales: LocaleFileInfo[]): string | null {
  const en = locales.find((l) => l.locale === "en");
  if (en) return "en";
  const sorted = [...locales].sort((a, b) => b.keyCount - a.keyCount);
  return sorted[0]?.locale ?? null;
}
