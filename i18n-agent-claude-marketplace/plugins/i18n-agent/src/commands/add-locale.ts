import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { discoverLocaleFiles, parseSimpleYaml } from "../core/locale-file-discovery.js";
import { planAddLocale } from "../core/diff-planner.js";
import { createStubContent } from "../core/stub-generator.js";

export function runAddLocale(
  root: string,
  locale: string,
  mode: string,
  json: boolean,
): void {
  if (mode !== "stub") {
    console.error(
      `Unsupported mode: "${mode}". Only "stub" is available.\n` +
        "Stub mode copies key structure from the base locale with TODO placeholders.\n" +
        "For real translations, ask Claude Code to fill in the stub file after creation.",
    );
    process.exit(1);
  }

  const discovery = discoverLocaleFiles(root);

  if (discovery.locales.length === 0) {
    console.error(
      "No existing locale files found. Cannot determine structure.\n" +
        "Create a base locale file first (e.g., messages/en.json).",
    );
    process.exit(1);
  }

  if (discovery.locales.find((l) => l.locale === locale)) {
    console.error(
      `Locale "${locale}" already exists.\n` +
        "Use the validate command to check for missing keys instead.",
    );
    process.exit(1);
  }

  const plan = planAddLocale(root, locale, discovery);
  if (!plan) {
    console.error("Could not create a plan for adding this locale.");
    process.exit(1);
  }

  const created: string[] = [];
  for (const file of plan.filesToCreate) {
    const targetPath = path.join(root, file.path);
    const baseContent = readBase(path.join(root, file.basedOn));
    const stubContent = createStubContent(baseContent, locale);
    const ext = path.extname(file.path);
    const isYaml = ext === ".yaml" || ext === ".yml";

    mkdirSync(path.dirname(targetPath), { recursive: true });
    const output = isYaml
      ? serializeYaml(stubContent)
      : JSON.stringify(stubContent, null, 2) + "\n";
    writeFileSync(targetPath, output, "utf-8");
    created.push(file.path);
  }

  if (json) {
    console.log(
      JSON.stringify(
        { locale, baseLocale: plan.baseLocale, filesCreated: created, mode: "stub" },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`\nAdded locale "${locale}" based on "${plan.baseLocale}" (stub mode)\n`);
  for (const file of plan.filesToCreate) {
    console.log(`  Created: ${file.path} (${file.keyCount} keys, TODO placeholders)`);
  }
  console.log(`\nDone. Created ${plan.filesToCreate.length} file(s).`);
  console.log("Next steps:");
  console.log(`  1. Ask Claude to translate the stub file(s) for "${locale}"`);
  console.log("  2. Run: i18n-agent validate");
}

function readBase(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {};
  try {
    const content = readFileSync(filePath, "utf-8");
    const ext = path.extname(filePath);
    if (ext === ".yaml" || ext === ".yml") return parseSimpleYaml(content);
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function serializeYaml(obj: Record<string, unknown>, indent = 0): string {
  const pad = "  ".repeat(indent);
  let out = "";
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      const needsQuote = /[:#{}[\],&*?|>!'"%@`]/.test(value) || value === "";
      out += `${pad}${key}: ${needsQuote ? `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : value}\n`;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      out += `${pad}${key}:\n`;
      out += serializeYaml(value as Record<string, unknown>, indent + 1);
    }
  }
  return out;
}
