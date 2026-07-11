import { discoverLocaleFiles } from "../core/locale-file-discovery.js";
import { validateLocales } from "../core/validation.js";

export function runValidate(root: string, json: boolean, ci: boolean): void {
  const discovery = discoverLocaleFiles(root);

  if (discovery.locales.length === 0) {
    if (json) {
      console.log(
        JSON.stringify({ valid: true, issues: [], localesChecked: [], totalKeys: 0 }),
      );
    } else {
      console.log("No locale files found. Nothing to validate.");
    }
    return;
  }

  const result = validateLocales(root, discovery);

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    if (ci && !result.valid) process.exit(1);
    return;
  }

  const errors = result.issues.filter((i) => i.severity === "error");
  const warnings = result.issues.filter((i) => i.severity === "warning");

  console.log("=== i18n Validation ===\n");
  console.log(`Locales checked: ${result.localesChecked.join(", ") || "none"}`);
  console.log(`Total keys:      ${result.totalKeys}`);
  console.log(`Errors:          ${errors.length}`);
  console.log(`Warnings:        ${warnings.length}`);

  if (errors.length > 0) {
    console.log("\n--- Errors ---\n");
    for (const issue of errors) {
      console.log(`  [${issue.type}] ${issue.message}`);
      if (issue.details) console.log(`    ${issue.details}`);
    }
  }

  if (warnings.length > 0) {
    console.log("\n--- Warnings ---\n");
    for (const issue of warnings) {
      console.log(`  [${issue.type}] ${issue.message}`);
      if (issue.details) console.log(`    ${issue.details}`);
    }
  }

  console.log(result.valid ? "\nValidation passed." : "\nValidation failed.");
  if (ci && !result.valid) process.exit(1);
}
