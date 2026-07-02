/**
 * Reverses the safe-i18n migration on the test suite.
 *
 * Reads en.json, finds all t("key") calls in .tsx files,
 * replaces them with the original English text, removes
 * i18n imports/hooks, and deletes generated artifacts.
 *
 * Usage: node scripts/reset-migration.mjs
 */
import { readFileSync, writeFileSync, rmSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dirname, "..");

// ── Step 1: Load messages ──────────────────────────────────────────
const enPath = join(ROOT, "messages", "en.json");
if (!existsSync(enPath)) {
  console.error("messages/en.json not found — nothing to reset.");
  process.exit(1);
}
const messages = JSON.parse(readFileSync(enPath, "utf8"));

// Build flat lookup: namespace → key → value
const lookup = {};
for (const [ns, keys] of Object.entries(messages)) {
  lookup[ns] = keys;
}

// ── Step 2: Find all .tsx files ────────────────────────────────────
function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !["node_modules", ".next", "scripts", ".safe-i18n"].includes(entry.name)) {
      results.push(...walk(full));
    } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
      results.push(full);
    }
  }
  return results;
}

// ── Step 3: Reverse transforms ─────────────────────────────────────
let filesModified = 0;

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");

  // Skip non-component files
  if (rel === "i18n/request.ts" || rel === "next.config.ts") continue;
  if (rel.startsWith("scripts/")) continue;

  let content = readFileSync(file, "utf8");
  const original = content;

  // Find which namespace this file uses
  const nsMatch = content.match(/(getTranslations|useTranslations)\("([^"]*)"\)/);
  if (!nsMatch) continue;

  const hookFn = nsMatch[1];
  const namespace = nsMatch[2];
  const nsMessages = lookup[namespace];

  if (!nsMessages) {
    console.warn(`  SKIP ${rel}: namespace "${namespace}" not found in en.json`);
    continue;
  }

  // Step A: Handle prop values FIRST: prop={t("key")} → prop="value"
  content = content.replace(/([\w-]+)=\{t\("([^"]*)"\)\}/g, (match, prop, key) => {
    const value = nsMessages[key];
    if (value === undefined) return match;
    const escaped = value.replace(/"/g, "&quot;");
    return `${prop}="${escaped}"`;
  });

  // Step B: Handle JSX text: {t("key")} → original text
  content = content.replace(/\{t\("([^"]*)"\)\}/g, (match, key) => {
    const value = nsMessages[key];
    if (value === undefined) {
      console.warn(`  WARN ${rel}: key "${key}" not found in namespace "${namespace}"`);
      return match;
    }
    return value;
  });

  // Step C: Handle remaining t() calls (ternary etc): t("key") → "value"
  content = content.replace(/t\("([^"]*)"\)/g, (match, key) => {
    const value = nsMessages[key];
    if (value === undefined) return match;
    return `"${value.replace(/"/g, '\\"')}"`;
  });

  // Remove the hook/call declaration line
  // Client: const t = useTranslations("namespace");
  // Server: const t = await getTranslations("namespace");
  if (hookFn === "useTranslations") {
    content = content.replace(/const t = useTranslations\("[^"]*"\);\n?/, "");
  } else {
    content = content.replace(/const t = await getTranslations\("[^"]*"\);\n?/, "");
  }

  // Remove async added to function declaration for server components
  // (only if getTranslations was used and function was made async by the tool)
  if (hookFn === "getTranslations") {
    // Don't remove async if other awaits exist
    const otherAwaits = content.match(/await\s+(?!getTranslations)/g);
    if (!otherAwaits || otherAwaits.length === 0) {
      content = content.replace(/export default async function/, "export default function");
    }
  }

  // Remove import lines
  content = content.replace(/import \{ getTranslations \} from "next-intl\/server";\s*/, "");
  content = content.replace(/import \{ useTranslations \} from "next-intl";\s*/, "");

  // Remove auto-added "use client" for components/ files
  // The test expects migration to auto-add this directive
  if (rel.startsWith("components/") && hookFn === "useTranslations") {
    content = content.replace(/^"use client";\s*/m, "");
  }

  if (content !== original) {
    writeFileSync(file, content, "utf8");
    filesModified++;
    console.log(`  RESET ${rel}`);
  }
}

// ── Step 4: Remove generated artifacts ─────────────────────────────
const toDelete = [
  "messages",
  "i18n",
  ".safe-i18n",
  "safe-i18n.config.json",
];

let artifactsRemoved = 0;
for (const item of toDelete) {
  const full = join(ROOT, item);
  if (existsSync(full)) {
    rmSync(full, { recursive: true, force: true });
    artifactsRemoved++;
    console.log(`  DELETE ${item}`);
  }
}

// ── Step 5: Reset layout.tsx ───────────────────────────────────────
const layoutPath = join(ROOT, "app", "layout.tsx");
if (existsSync(layoutPath)) {
  let layout = readFileSync(layoutPath, "utf8");
  const origLayout = layout;

  // Remove next-intl imports
  layout = layout.replace(/import \{ NextIntlClientProvider \} from "next-intl";\n?/, "");
  layout = layout.replace(/import \{ getLocale, getMessages \} from "next-intl\/server";\n?/, "");

  // Remove locale/messages fetching
  layout = layout.replace(/\s*const locale = await getLocale\(\);\n/, "\n");
  layout = layout.replace(/\s*const messages = await getMessages\(\);\n/, "");

  // Remove NextIntlClientProvider wrapper
  layout = layout.replace(/<NextIntlClientProvider messages=\{messages\}>\n?\s*/, "");
  layout = layout.replace(/\s*<\/NextIntlClientProvider>/, "");

  // Remove lang={locale}
  layout = layout.replace(/ lang=\{locale\}/, "");

  // Remove async if no other awaits
  const otherAwaits = layout.match(/await\s+/g);
  if (!otherAwaits || otherAwaits.length === 0) {
    layout = layout.replace(/export default async function/, "export default function");
  }

  if (layout !== origLayout) {
    writeFileSync(layoutPath, layout, "utf8");
    console.log("  RESET app/layout.tsx");
    filesModified++;
  }
}

// ── Step 6: Reset next.config.ts ───────────────────────────────────
const nextConfigPath = join(ROOT, "next.config.ts");
if (existsSync(nextConfigPath)) {
  let config = readFileSync(nextConfigPath, "utf8");
  const origConfig = config;

  // Remove next-intl plugin setup (all variations)
  config = config.replace(/import createNextIntlPlugin from ["']next-intl\/plugin["'];?\n?/g, "");
  config = config.replace(/const withNextIntl = createNextIntlPlugin\([^)]*\);?\n?/g, "");

  // Unwrap withNextIntl(...)
  config = config.replace(/export default withNextIntl\((\w+)\)/, "export default $1");

  if (config !== origConfig) {
    writeFileSync(nextConfigPath, config, "utf8");
    console.log("  RESET next.config.ts");
    filesModified++;
  }
}

console.log(`\nDone! ${filesModified} files reset, ${artifactsRemoved} artifacts removed.`);
console.log("You can now run: node ../../dist/cli/index.js migrate --to tr --provider mock");
