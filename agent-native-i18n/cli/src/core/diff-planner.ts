import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { DiffPlan, PlannedFile, LocaleDiscoveryResult } from "../types.js";

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
    const targetPath = path.join(discovery.localeDir, `${targetLocale}${ext}`).replace(/\\/g, "/");

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

    const files = readdirSync(baseDirPath, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith(".json")) continue;

      const targetFilePath = path.join(discovery.localeDir, targetLocale, file.name).replace(/\\/g, "/");
      const baseFilePath = path.join(discovery.localeDir, baseLocale, file.name).replace(/\\/g, "/");

      let keyCount = 0;
      try {
        const content = readFileSync(path.join(baseDirPath, file.name), "utf-8");
        const parsed = JSON.parse(content) as Record<string, unknown>;
        keyCount = countKeys(parsed);
      } catch {
        // Skip
      }

      filesToCreate.push({
        path: targetFilePath,
        basedOn: baseFilePath,
        keyCount,
      });
    }
  }

  if (filesToCreate.length === 0) return null;

  const totalKeys = filesToCreate.reduce((sum, f) => sum + f.keyCount, 0);

  return {
    action: "add-locale",
    targetLocale,
    baseLocale,
    filesToCreate,
    summary: `Create ${filesToCreate.length} file(s) for locale "${targetLocale}" based on "${baseLocale}" (${totalKeys} keys, stub values)`,
  };
}

function countKeys(obj: Record<string, unknown>): number {
  let count = 0;
  for (const value of Object.values(obj)) {
    if (typeof value === "string") {
      count++;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      count += countKeys(value as Record<string, unknown>);
    }
  }
  return count;
}
