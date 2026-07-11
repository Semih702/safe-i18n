#!/usr/bin/env node

import path from "node:path";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { runDetect } from "./commands/detect.js";
import { runAnalyze } from "./commands/analyze.js";
import { runValidate } from "./commands/validate.js";
import { runAddLocale } from "./commands/add-locale.js";
import { detectProject } from "./core/project-detector.js";
import { detectI18nFramework } from "./core/i18n-framework-detector.js";
import { discoverLocaleFiles } from "./core/locale-file-discovery.js";
import type { DoctorCheck } from "./types.js";

const args = process.argv.slice(2);
const command = args[0];

function flag(name: string): boolean {
  return args.includes(`--${name}`);
}

function option(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
}

function resolveRoot(): string {
  const r = option("root");
  return r ? path.resolve(r) : process.cwd();
}

function printUsage(): void {
  console.log(`i18n-agent — Deterministic i18n analysis for Claude Code

Usage:
  i18n-agent <command> [options]

Commands:
  detect                     Detect project framework, i18n library, and locale files
  analyze                    Analyze locale files and produce a coverage report
  validate                   Validate locale files for consistency issues
  add-locale <locale>        Create stub locale file(s) from existing structure
  doctor                     Check whether the plugin environment is healthy

Options:
  --root <path>              Project root directory (default: cwd)
  --json                     Output JSON instead of human-readable text
  --ci                       Exit non-zero on validation errors (validate only)
  --mode <mode>              Locale creation mode: "stub" (default)
  --help                     Show this help message

Examples:
  i18n-agent detect
  i18n-agent analyze --json
  i18n-agent validate --ci
  i18n-agent add-locale tr --mode stub
  i18n-agent doctor
`);
}

function runDoctor(root: string): void {
  const checks: DoctorCheck[] = [];

  // Node.js
  try {
    const v = process.version;
    const major = parseInt(v.slice(1), 10);
    checks.push({
      name: "Node.js",
      passed: major >= 18,
      message: major >= 18 ? `${v} (ok)` : `${v} (requires >=18)`,
    });
  } catch {
    checks.push({ name: "Node.js", passed: false, message: "Not found" });
  }

  // package.json
  const hasPkg = existsSync(path.join(root, "package.json"));
  checks.push({
    name: "package.json",
    passed: hasPkg,
    message: hasPkg ? "Found" : "Not found at project root",
  });

  // git
  try {
    execSync("git --version", { stdio: "pipe" });
    checks.push({ name: "git", passed: true, message: "Available" });
  } catch {
    checks.push({ name: "git", passed: false, message: "Not found (optional)" });
  }

  // Project detection
  try {
    const project = detectProject(root);
    checks.push({
      name: "Project detection",
      passed: true,
      message: `${project.framework}, ${project.packageManager}`,
    });
  } catch (e) {
    checks.push({
      name: "Project detection",
      passed: false,
      message: e instanceof Error ? e.message : "Failed",
    });
  }

  // i18n detection
  try {
    const fw = detectI18nFramework(root);
    checks.push({
      name: "i18n framework",
      passed: true,
      message: fw.name ? `${fw.name} ${fw.version ?? ""}` : "None detected",
    });
  } catch (e) {
    checks.push({
      name: "i18n framework",
      passed: false,
      message: e instanceof Error ? e.message : "Failed",
    });
  }

  // Locale files
  try {
    const locales = discoverLocaleFiles(root);
    checks.push({
      name: "Locale files",
      passed: true,
      message:
        locales.locales.length > 0
          ? `${locales.locales.length} locale(s) in ${locales.localeDir}`
          : "None found",
    });
  } catch (e) {
    checks.push({
      name: "Locale files",
      passed: false,
      message: e instanceof Error ? e.message : "Failed",
    });
  }

  console.log("=== i18n-agent Doctor ===\n");
  let allPassed = true;
  for (const check of checks) {
    const icon = check.passed ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${check.name}: ${check.message}`);
    if (!check.passed && check.name !== "git") allPassed = false;
  }
  console.log(allPassed ? "\nAll checks passed." : "\nSome checks failed.");
}

const json = flag("json");
const ci = flag("ci");
const root = resolveRoot();

switch (command) {
  case "detect":
    runDetect(root, json);
    break;
  case "analyze":
    runAnalyze(root, json);
    break;
  case "validate":
    runValidate(root, json, ci);
    break;
  case "add-locale": {
    const locale = args[1];
    if (!locale || locale.startsWith("--")) {
      console.error("Error: locale code required. Usage: i18n-agent add-locale <locale>");
      process.exit(1);
    }
    runAddLocale(root, locale, option("mode") ?? "stub", json);
    break;
  }
  case "doctor":
    runDoctor(root);
    break;
  case "--help":
  case "-h":
  case "help":
  case undefined:
    printUsage();
    break;
  default:
    console.error(`Unknown command: "${command}". Run "i18n-agent --help" for usage.`);
    process.exit(1);
}
