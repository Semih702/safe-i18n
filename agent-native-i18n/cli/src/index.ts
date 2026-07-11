#!/usr/bin/env node

import path from "node:path";
import { runDetect } from "./commands/detect.js";
import { runAnalyze } from "./commands/analyze.js";
import { runValidate } from "./commands/validate.js";
import { runAddLocale } from "./commands/add-locale.js";

const args = process.argv.slice(2);
const command = args[0];

function getFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

function getOption(name: string): string | undefined {
  const index = args.indexOf(`--${name}`);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return undefined;
}

function resolveRoot(): string {
  const rootArg = getOption("root");
  if (rootArg) {
    return path.resolve(rootArg);
  }
  return process.cwd();
}

function printUsage(): void {
  console.log(`i18n-agent — Deterministic i18n analysis CLI for Claude Code

Usage:
  i18n-agent <command> [options]

Commands:
  detect                     Detect project framework, i18n library, and locale files
  analyze                    Analyze locale files and show coverage report
  validate                   Validate locale files for consistency issues
  add-locale <locale>        Create stub locale file(s) based on existing structure

Options:
  --root <path>              Project root directory (default: current directory)
  --json                     Output JSON instead of human-readable text
  --ci                       Exit with code 1 on validation errors (validate only)
  --mode <mode>              Locale creation mode: "stub" (add-locale only, default: stub)
  --help                     Show this help message

Examples:
  i18n-agent detect --root /path/to/project
  i18n-agent analyze --json
  i18n-agent validate --ci
  i18n-agent add-locale tr --mode stub

Agent workflow:
  1. Run "detect" to understand the project
  2. Run "analyze" to see locale coverage
  3. Make changes (add locale, fix translations, etc.)
  4. Run "validate" to verify consistency
`);
}

const json = getFlag("json");
const ci = getFlag("ci");
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
      console.error("Error: locale code is required. Usage: i18n-agent add-locale <locale>");
      process.exit(1);
    }
    const mode = getOption("mode") ?? "stub";
    runAddLocale(root, locale, mode, json);
    break;
  }

  case "--help":
  case "-h":
  case "help":
  case undefined:
    printUsage();
    break;

  default:
    console.error(`Unknown command: "${command}"`);
    console.error('Run "i18n-agent --help" for available commands.');
    process.exit(1);
}
