import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { DiffPlan, PlannedFile, LocaleDiscoveryResult } from "../types.js";
import { parseSimpleYaml } from "./locale-file-discovery.js";

export function planAddLocale(
  root: string,
  targetLocale: string,
  discovery: LocaleDiscoveryResult,
): DiffPlan | null {
  if (!discovery.baseLocale || !discovery.localeDir) return null;

  const baseLocale = discovery.baseLocale;
  const filesToCreate: PlannedFile[] = [];

  if (discovery.pattern === "flat-files") {
    const baseInfo = discovery.locales.find((l) => l.locale === baseLocale);
    if (!baseInfo) return null;

    const ext = path.extname(baseInfo.relativePath);
    const targetPath = path
      .join(discovery.localeDir, `${targetLocale}${ext}`)
      .replace(/\\/g, "/");

    filesToCreate.push({
      path: targetPath,
      basedOn: baseInfo.relativePath,
      keyCount: baseInfo.keyCount,
    });
  } else if (discovery.pattern === "locale-dirs") {
    const baseInfo = discovery.locales.find((l) => l.locale === baseLocale);
    if (!baseInfo) return null;

    const baseDirPath = path.join(root, discovery.localeDir, baseLocale);
    if (!existsSync(baseDirPath) || !statSync(baseDirPath).isDirectory()) return null;

    for (const entry of readdirSync(baseDirPath, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name);
      if (![".json", ".yaml", ".yml"].includes(ext)) continue;

      let keyCount = 0;
      try {
        const content = readFileSync(path.join(baseDirPath, entry.name), "utf-8");
        const parsed = (ext === ".yaml" || ext === ".yml")
          ? parseSimpleYaml(content)
          : JSON.parse(content) as Record<string, unknown>;
        keyCount = countKeys(parsed);
      } catch { /* skip */ }

      filesToCreate.push({
        path: path
          .join(discovery.localeDir, targetLocale, entry.name)
          .replace(/\\/g, "/"),
        basedOn: path
          .join(discovery.localeDir, baseLocale, entry.name)
          .replace(/\\/g, "/"),
        keyCount,
      });
    }
  }

  if (filesToCreate.length === 0) return null;

  const totalKeys = filesToCreate.reduce((s, f) => s + f.keyCount, 0);
  return {
    action: "add-locale",
    targetLocale,
    baseLocale,
    filesToCreate,
    summary: `Create ${filesToCreate.length} file(s) for locale "${targetLocale}" based on "${baseLocale}" (${totalKeys} keys, stub values)`,
  };
}

function countKeys(obj: Record<string, unknown>): number {
  let n = 0;
  for (const v of Object.values(obj)) {
    if (typeof v === "string") n++;
    else if (typeof v === "object" && v !== null && !Array.isArray(v))
      n += countKeys(v as Record<string, unknown>);
  }
  return n;
}
