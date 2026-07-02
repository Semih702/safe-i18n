import type { ValidationIssue } from "../core/types.js";
import { readLocaleFile, flattenMessages } from "./locale-validator.js";

export interface PlaceholderValidatorOptions {
  root: string;
  messagesPath: string;
  sourceLocale: string;
  targetLocales: string[];
}

/**
 * Extracts placeholder names from a message string.
 * Matches patterns like {name}, {count}, {0}, etc.
 */
export function extractPlaceholders(text: string): string[] {
  const pattern = /\{(\w+)\}/g;
  const placeholders: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const name = match[1];
    if (name !== undefined && !placeholders.includes(name)) {
      placeholders.push(name);
    }
  }

  return placeholders;
}

/**
 * Validates that placeholders in target locale messages match those in the source locale.
 */
export async function validatePlaceholders(
  options: PlaceholderValidatorOptions,
): Promise<ValidationIssue[]> {
  const { root, messagesPath, sourceLocale, targetLocales } = options;
  const issues: ValidationIssue[] = [];

  // Read and flatten source locale
  let sourceMessages: Record<string, string>;
  try {
    const sourceRaw = await readLocaleFile(root, messagesPath, sourceLocale);
    sourceMessages = flattenMessages(sourceRaw);
  } catch {
    // If source can't be read, we can't validate placeholders
    return issues;
  }

  for (const targetLocale of targetLocales) {
    let targetMessages: Record<string, string>;
    try {
      const targetRaw = await readLocaleFile(root, messagesPath, targetLocale);
      targetMessages = flattenMessages(targetRaw);
    } catch {
      // Skip locales that can't be read
      continue;
    }

    // Only check keys that exist in both source and target
    for (const [key, sourceValue] of Object.entries(sourceMessages)) {
      const targetValue = targetMessages[key];
      if (targetValue === undefined) {
        continue;
      }

      const sourcePlaceholders = extractPlaceholders(sourceValue);
      const targetPlaceholders = extractPlaceholders(targetValue);

      // Check for placeholders in source that are missing from target
      for (const placeholder of sourcePlaceholders) {
        if (!targetPlaceholders.includes(placeholder)) {
          issues.push({
            type: "placeholder-mismatch",
            severity: "error",
            locale: targetLocale,
            key,
            message: `Placeholder "{${placeholder}}" found in source locale "${sourceLocale}" is missing in locale "${targetLocale}"`,
            details: `Source: "${sourceValue}" | Target: "${targetValue}"`,
          });
        }
      }

      // Check for placeholders in target that are not in source
      for (const placeholder of targetPlaceholders) {
        if (!sourcePlaceholders.includes(placeholder)) {
          issues.push({
            type: "placeholder-mismatch",
            severity: "error",
            locale: targetLocale,
            key,
            message: `Placeholder "{${placeholder}}" found in locale "${targetLocale}" does not exist in source locale "${sourceLocale}"`,
            details: `Source: "${sourceValue}" | Target: "${targetValue}"`,
          });
        }
      }
    }
  }

  return issues;
}
