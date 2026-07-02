import type { MigrationEntry, ComponentType } from "../core/types.js";

export interface SafetyCheckResult {
  safe: boolean;
  reason: string;
}

export function checkTransformSafety(entry: MigrationEntry): SafetyCheckResult {
  if (entry.action !== "apply") {
    return { safe: false, reason: `Entry action is "${entry.action}", not "apply".` };
  }

  if (entry.candidate.risk !== "AUTO_SAFE") {
    return {
      safe: false,
      reason: `Risk level is ${entry.candidate.risk}, only AUTO_SAFE entries are transformed.`,
    };
  }

  if (entry.transformType === "template-literal") {
    return {
      safe: false,
      reason: "Template literal transforms require manual review.",
    };
  }

  return { safe: true, reason: "Passed all safety checks." };
}

export function shouldAddUseClient(
  _currentComponentType: ComponentType,
  _needsHook: boolean,
): boolean {
  return false;
}

export function canUseHookInFile(source: string, componentType: ComponentType): boolean {
  if (componentType === "server") return false;
  if (componentType === "client") return true;
  return /\buse[A-Z]\w*\s*\(/.test(source);
}
