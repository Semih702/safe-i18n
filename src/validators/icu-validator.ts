import type { ValidationIssue } from "../core/types.js";
import { readLocaleFile, flattenMessages } from "./locale-validator.js";

export interface ICUValidatorOptions {
  root: string;
  messagesPath: string;
  locales: string[];
}

/**
 * Checks whether braces in a string are balanced.
 * Returns true if every `{` has a matching `}`.
 */
export function checkBalancedBraces(text: string): boolean {
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Skip escaped braces
    if (char === "'" && i + 1 < text.length) {
      const next = text[i + 1];
      if (next === "{" || next === "}") {
        i++; // skip the escaped brace
        continue;
      }
    }

    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth < 0) {
        return false;
      }
    }
  }

  return depth === 0;
}

/**
 * Validates ICU message syntax in locale files.
 * Checks for balanced braces and well-formed ICU patterns.
 */
export async function validateICUSyntax(
  options: ICUValidatorOptions,
): Promise<ValidationIssue[]> {
  const { root, messagesPath, locales } = options;
  const issues: ValidationIssue[] = [];

  for (const locale of locales) {
    let messages: Record<string, string>;
    try {
      const raw = await readLocaleFile(root, messagesPath, locale);
      messages = flattenMessages(raw);
    } catch {
      // Skip locales that can't be read
      continue;
    }

    for (const [key, value] of Object.entries(messages)) {
      // Check for balanced braces
      if (!checkBalancedBraces(value)) {
        issues.push({
          type: "syntax-error",
          severity: "error",
          locale,
          key,
          message: `Unbalanced braces in message for key "${key}" in locale "${locale}"`,
          details: `Value: "${value}"`,
        });
        continue;
      }

      // Check for common ICU patterns with basic structure validation
      const icuPatterns = findICUPatterns(value);
      for (const pattern of icuPatterns) {
        if (!validateICUPattern(pattern)) {
          issues.push({
            type: "syntax-error",
            severity: "error",
            locale,
            key,
            message: `Invalid ICU pattern in message for key "${key}" in locale "${locale}"`,
            details: `Pattern: "${pattern}" in value: "${value}"`,
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Extracts top-level ICU patterns (plural, select, selectordinal) from a message.
 */
function findICUPatterns(text: string): string[] {
  const patterns: string[] = [];
  const icuTypePattern = /\{(\w+)\s*,\s*(plural|select|selectordinal)\s*,/g;
  let match: RegExpExecArray | null;

  while ((match = icuTypePattern.exec(text)) !== null) {
    // Extract the full ICU block starting from this match
    const startIndex = match.index;
    let depth = 0;
    let endIndex = startIndex;

    for (let i = startIndex; i < text.length; i++) {
      const char = text[i];
      if (char === "{") {
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }

    if (endIndex > startIndex) {
      patterns.push(text.slice(startIndex, endIndex));
    }
  }

  return patterns;
}

/**
 * Validates a single ICU pattern for basic structural correctness.
 * Checks that plural patterns contain required "other" clause,
 * and that select patterns have at least one case.
 */
function validateICUPattern(pattern: string): boolean {
  // Extract the ICU type (plural, select, selectordinal)
  const typeMatch = /\{\w+\s*,\s*(plural|select|selectordinal)\s*,/.exec(pattern);
  if (!typeMatch) {
    return false;
  }

  const icuType = typeMatch[1];

  // Plural and selectordinal require an "other" clause
  if (icuType === "plural" || icuType === "selectordinal") {
    if (!pattern.includes("other")) {
      return false;
    }
  }

  // Select patterns need at least one case keyword followed by a brace block
  if (icuType === "select") {
    // After the "select," there should be at least one "word {" pattern
    const afterSelect = pattern.slice(typeMatch[0].length);
    const casePattern = /\w+\s*\{/;
    if (!casePattern.test(afterSelect)) {
      return false;
    }
  }

  return true;
}
