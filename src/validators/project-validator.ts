import { execSync } from "node:child_process";
import type {
  SafeI18nConfig,
  ValidationResult,
  ValidationIssue,
  CommandValidationResult,
} from "../core/types.js";
import { validateLocaleFiles } from "./locale-validator.js";
import { validatePlaceholders } from "./placeholder-validator.js";
import { validateICUSyntax } from "./icu-validator.js";

export interface ProjectValidatorOptions {
  root: string;
  config: SafeI18nConfig;
}

/**
 * Runs all validators against the project and optionally executes user-defined validation commands.
 * Returns a unified ValidationResult indicating whether the project is valid.
 */
export async function validateProject(
  options: ProjectValidatorOptions,
): Promise<ValidationResult> {
  const { root, config } = options;
  const { sourceLocale, targetLocales } = config;
  const messagesPath = config.i18n.messagesPath;
  const allLocales = [sourceLocale, ...targetLocales];
  const issues: ValidationIssue[] = [];

  // Run locale file validation (missing keys, unused keys, duplicate keys)
  const localeIssues = await validateLocaleFiles({
    root,
    messagesPath,
    sourceLocale,
    targetLocales,
  });
  issues.push(...localeIssues);

  // Run placeholder validation
  const placeholderIssues = await validatePlaceholders({
    root,
    messagesPath,
    sourceLocale,
    targetLocales,
  });
  issues.push(...placeholderIssues);

  // Run ICU syntax validation
  const icuIssues = await validateICUSyntax({
    root,
    messagesPath,
    locales: allLocales,
  });
  issues.push(...icuIssues);

  // Count total keys from source locale (best-effort)
  let totalKeys = 0;
  try {
    const { readLocaleFile, flattenMessages } = await import("./locale-validator.js");
    const sourceRaw = await readLocaleFile(root, messagesPath, sourceLocale);
    const sourceMessages = flattenMessages(sourceRaw);
    totalKeys = Object.keys(sourceMessages).length;
  } catch {
    // If we can't read the source locale, totalKeys stays 0
  }

  // Run user-defined validation commands
  const commandResults: CommandValidationResult[] = [];
  const validationCommands = config.validation.commands;

  for (const command of validationCommands) {
    const cmdResult = runValidationCommand(command, root);
    commandResults.push(cmdResult);

    if (!cmdResult.success) {
      issues.push({
        type: "syntax-error",
        severity: "error",
        locale: "",
        key: "",
        message: `Validation command failed: "${command}"`,
        details: cmdResult.stderr || `Exit code: ${String(cmdResult.exitCode)}`,
      });
    }
  }

  // Valid only if there are no errors (warnings are acceptable)
  const hasErrors = issues.some((issue) => issue.severity === "error");

  const result: ValidationResult = {
    valid: !hasErrors,
    issues,
    localesChecked: allLocales,
    totalKeys,
  };

  if (commandResults.length > 0) {
    result.commandResults = commandResults;
  }

  return result;
}

/**
 * Executes a single validation command synchronously and captures its output.
 */
function runValidationCommand(
  command: string,
  cwd: string,
): CommandValidationResult {
  try {
    const stdout = execSync(command, {
      cwd,
      encoding: "utf-8",
      timeout: 60_000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    return {
      command,
      exitCode: 0,
      stdout,
      stderr: "",
      success: true,
    };
  } catch (error: unknown) {
    const execError = error as {
      status?: number | null;
      stdout?: string;
      stderr?: string;
      message?: string;
    };

    return {
      command,
      exitCode: execError.status ?? 1,
      stdout: execError.stdout ?? "",
      stderr: execError.stderr ?? execError.message ?? "Command execution failed",
      success: false,
    };
  }
}
