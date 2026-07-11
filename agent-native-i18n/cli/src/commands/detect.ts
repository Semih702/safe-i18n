import { detectProject } from "../core/project-detector.js";
import { detectI18nFramework } from "../core/i18n-framework-detector.js";
import { discoverLocaleFiles } from "../core/locale-file-discovery.js";
import type { DetectResult } from "../types.js";

export function runDetect(root: string, json: boolean): void {
  const project = detectProject(root);
  const i18nFramework = detectI18nFramework(root);
  const locales = discoverLocaleFiles(root);

  const result: DetectResult = { project, i18nFramework, locales };

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log("=== Project Detection ===\n");
  console.log(`Framework:       ${project.framework}`);
  console.log(`TypeScript:      ${project.hasTypeScript ? "yes" : "no"}`);
  console.log(`App Router:      ${project.hasAppRouter ? "yes" : "no"}`);
  console.log(`Pages Router:    ${project.hasPagesRouter ? "yes" : "no"}`);
  console.log(`src/ directory:  ${project.hasSrcDirectory ? "yes" : "no"}`);
  console.log(`Package manager: ${project.packageManager}`);
  console.log(`Existing i18n:   ${project.existingI18n ?? "none detected"}`);

  console.log("\n=== i18n Framework ===\n");
  if (i18nFramework.name) {
    console.log(`Library:  ${i18nFramework.name}`);
    console.log(`Version:  ${i18nFramework.version ?? "unknown"}`);
    console.log(`Config:   ${i18nFramework.configExists ? i18nFramework.configPath : "not found"}`);
  } else {
    console.log("No i18n framework detected in dependencies.");
  }

  console.log("\n=== Locale Files ===\n");
  if (locales.locales.length > 0) {
    console.log(`Directory: ${locales.localeDir}`);
    console.log(`Pattern:   ${locales.pattern}`);
    console.log(`Base:      ${locales.baseLocale ?? "unknown"}`);
    console.log(`Locales:   ${locales.locales.map((l) => `${l.locale} (${l.keyCount} keys)`).join(", ")}`);
  } else {
    console.log("No locale files found.");
  }
}
