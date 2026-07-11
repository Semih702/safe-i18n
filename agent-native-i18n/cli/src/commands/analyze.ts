import { detectProject } from "../core/project-detector.js";
import { detectI18nFramework } from "../core/i18n-framework-detector.js";
import { discoverLocaleFiles } from "../core/locale-file-discovery.js";
import { analyzeKeys } from "../core/key-analysis.js";
import type { AnalyzeResult } from "../types.js";

export function runAnalyze(root: string, json: boolean): void {
  const project = detectProject(root);
  const i18nFramework = detectI18nFramework(root);
  const locales = discoverLocaleFiles(root);
  const keyAnalysis = analyzeKeys(root, locales);

  const result: AnalyzeResult = {
    detect: { project, i18nFramework, locales },
    keyAnalysis,
  };

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Markdown summary
  console.log("# i18n Analysis Report\n");

  console.log("## Project\n");
  console.log(`- **Framework**: ${project.framework}`);
  console.log(`- **TypeScript**: ${project.hasTypeScript ? "yes" : "no"}`);
  console.log(`- **Package manager**: ${project.packageManager}`);
  console.log(`- **Existing i18n**: ${project.existingI18n ?? "none"}`);

  if (i18nFramework.name) {
    console.log(`\n## i18n Framework\n`);
    console.log(`- **Library**: ${i18nFramework.name} ${i18nFramework.version ?? ""}`);
    console.log(`- **Config**: ${i18nFramework.configExists ? i18nFramework.configPath : "not found"}`);
  }

  console.log(`\n## Locale Files\n`);
  if (locales.locales.length > 0) {
    console.log(`- **Directory**: \`${locales.localeDir}\``);
    console.log(`- **Pattern**: ${locales.pattern}`);
    console.log(`- **Base locale**: ${locales.baseLocale}`);
    console.log(`- **Locales found**: ${locales.locales.length}\n`);

    console.log("| Locale | Keys | Path |");
    console.log("|--------|------|------|");
    for (const l of locales.locales) {
      console.log(`| ${l.locale} | ${l.keyCount} | \`${l.relativePath}\` |`);
    }
  } else {
    console.log("No locale files found.\n");
    console.log("This project may not have i18n set up yet. Consider:");
    console.log("1. Installing an i18n library (e.g., `next-intl`, `react-i18next`)");
    console.log("2. Creating a `messages/` directory with locale JSON files");
    console.log("3. Using `i18n-agent add-locale en --mode stub` to create a starter file");
  }

  if (keyAnalysis) {
    console.log(`\n## Key Coverage\n`);
    console.log(`Base locale **${keyAnalysis.baseLocale}** has **${keyAnalysis.totalKeysInBase}** keys.\n`);

    if (Object.keys(keyAnalysis.coverage).length > 0) {
      console.log("| Locale | Total | Matching | Missing | Extra | Coverage |");
      console.log("|--------|-------|----------|---------|-------|----------|");
      for (const [locale, cov] of Object.entries(keyAnalysis.coverage)) {
        console.log(
          `| ${locale} | ${cov.totalKeys} | ${cov.matchingKeys} | ${cov.missingKeys} | ${cov.extraKeys} | ${cov.coveragePercent}% |`,
        );
      }
    }

    if (Object.keys(keyAnalysis.missingKeys).length > 0) {
      console.log(`\n## Missing Keys\n`);
      for (const [locale, keys] of Object.entries(keyAnalysis.missingKeys)) {
        console.log(`### ${locale}\n`);
        for (const key of keys.slice(0, 20)) {
          console.log(`- \`${key}\``);
        }
        if (keys.length > 20) {
          console.log(`- ... and ${keys.length - 20} more`);
        }
        console.log("");
      }
    }
  }
}
