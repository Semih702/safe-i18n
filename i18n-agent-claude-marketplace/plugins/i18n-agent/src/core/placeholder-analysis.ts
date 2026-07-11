import type { ValidationIssue } from "../types.js";

export function extractPlaceholders(text: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let i = 0;
  while (i < text.length) {
    if (text[i] === "'") {
      const next = text[i + 1];
      if (next === "{" || next === "}") { i += 2; continue; }
    }
    if (text[i] === "{") {
      if (depth === 0) {
        const rest = text.slice(i + 1);
        const simpleMatch = /^(\w+)\}/.exec(rest);
        if (simpleMatch && !ICU_KEYWORDS.has(simpleMatch[1]!)) {
          if (!result.includes(simpleMatch[1]!)) result.push(simpleMatch[1]!);
        }
        const icuMatch = /^(\w+)\s*,\s*(?:plural|select|selectordinal)\b/.exec(rest);
        if (icuMatch && !result.includes(icuMatch[1]!)) {
          result.push(icuMatch[1]!);
        }
      }
      depth++;
    } else if (text[i] === "}") {
      depth--;
      if (depth < 0) depth = 0;
    }
    i++;
  }
  return result;
}

const ICU_KEYWORDS = new Set([
  "plural", "select", "selectordinal",
  "zero", "one", "two", "few", "many", "other",
]);

export function checkPlaceholderParity(
  baseMessages: Record<string, string>,
  targetMessages: Record<string, string>,
  targetLocale: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [key, baseValue] of Object.entries(baseMessages)) {
    const targetValue = targetMessages[key];
    if (targetValue === undefined) continue;

    const basePh = extractPlaceholders(baseValue);
    const targetPh = extractPlaceholders(targetValue);

    for (const ph of basePh) {
      if (!targetPh.includes(ph)) {
        issues.push({
          type: "placeholder-mismatch",
          severity: "error",
          locale: targetLocale,
          key,
          message: `Placeholder "{${ph}}" in base locale is missing in "${targetLocale}"`,
          details: `Base: "${baseValue}" | Target: "${targetValue}"`,
        });
      }
    }

    for (const ph of targetPh) {
      if (!basePh.includes(ph)) {
        issues.push({
          type: "placeholder-mismatch",
          severity: "error",
          locale: targetLocale,
          key,
          message: `Placeholder "{${ph}}" in "${targetLocale}" does not exist in base locale`,
          details: `Base: "${baseValue}" | Target: "${targetValue}"`,
        });
      }
    }
  }

  return issues;
}

export function checkBalancedBraces(text: string): boolean {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "'" && i + 1 < text.length) {
      const next = text[i + 1];
      if (next === "{" || next === "}") { i++; continue; }
    }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth < 0) return false; }
  }
  return depth === 0;
}
