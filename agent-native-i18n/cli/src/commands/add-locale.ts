import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { discoverLocaleFiles } from "../core/locale-file-discovery.js";
import { planAddLocale } from "../core/diff-planner.js";

export function runAddLocale(
  root: string,
  locale: string,
  mode: string,
  json: boolean,
): void {
  if (mode !== "stub") {
    console.error(`Unsupported mode: "${mode}". Only "stub" mode is available.`);
    console.error('Stub mode copies key structure from the base locale with empty/TODO values.');
    console.error('For real translations, use Claude Code to fill in the stub file after creation.');
    process.exit(1);
  }

  const discovery = discoverLocaleFiles(root);

  if (discovery.locales.length === 0) {
    console.error("No existing locale files found. Cannot determine structure.");
    console.error("Create a base locale file first (e.g., messages/en.json).");
    process.exit(1);
  }

  const existing = discovery.locales.find((l) => l.locale === locale);
  if (existing) {
    console.error(`Locale "${locale}" already exists at ${existing.relativePath}`);
    console.error("Use the validate command to check for missing keys instead.");
    process.exit(1);
  }

  const plan = planAddLocale(root, locale, discovery);
  if (!plan) {
    console.error("Could not create a plan for adding this locale.");
    process.exit(1);
  }

  if (json) {
    const created: string[] = [];

    for (const file of plan.filesToCreate) {
      const targetPath = path.join(root, file.path);
      const baseContent = readBaseContent(path.join(root, file.basedOn));
      const stubContent = createStubContent(baseContent, locale);

      mkdirSync(path.dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, JSON.stringify(stubContent, null, 2) + "\n", "utf-8");
      created.push(file.path);
    }

    console.log(JSON.stringify({
      locale,
      baseLocale: plan.baseLocale,
      filesCreated: created,
      mode: "stub",
    }, null, 2));
    return;
  }

  console.log(`\nAdding locale "${locale}" based on "${plan.baseLocale}" (stub mode)\n`);

  for (const file of plan.filesToCreate) {
    const targetPath = path.join(root, file.path);
    const baseContent = readBaseContent(path.join(root, file.basedOn));
    const stubContent = createStubContent(baseContent, locale);

    mkdirSync(path.dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, JSON.stringify(stubContent, null, 2) + "\n", "utf-8");
    console.log(`  Created: ${file.path} (${file.keyCount} keys, stub values)`);
  }

  console.log(`\nDone. Created ${plan.filesToCreate.length} file(s) with TODO placeholders.`);
  console.log("Next steps:");
  console.log(`  1. Ask Claude to translate the stub file(s) for "${locale}"`);
  console.log("  2. Run: i18n-agent validate --root <project-root>");
}

function readBaseContent(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {};
  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function createStubContent(
  base: Record<string, unknown>,
  locale: string,
): Record<string, unknown> {
  const stub: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(base)) {
    if (typeof value === "string") {
      stub[key] = `TODO [${locale}]: ${value}`;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      stub[key] = createStubContent(value as Record<string, unknown>, locale);
    } else {
      stub[key] = value;
    }
  }

  return stub;
}
