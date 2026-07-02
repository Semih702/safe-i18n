import type {
  SafeI18nConfig,
  ScanResult,
  StringCandidate,
  MigrationPlan,
  MigrationEntry,
  MigrationPlanSummary,
  ComponentType,
} from "./types.js";

function determineHookOrFunction(
  componentType: ComponentType,
): "useTranslations" | "getTranslations" {
  if (componentType === "server") return "getTranslations";
  return "useTranslations";
}

function determineTransformType(
  candidate: StringCandidate,
): "jsx-text" | "jsx-attribute" | "template-literal" {
  if (candidate.propName) return "jsx-attribute";
  if (candidate.source.includes("{var}")) return "template-literal";
  return "jsx-text";
}

function determineAction(candidate: StringCandidate): "apply" | "skip" | "review" {
  switch (candidate.risk) {
    case "AUTO_SAFE":
      return "apply";
    case "REVIEW_REQUIRED":
      return "review";
    case "SKIP_NON_UI":
    case "SKIP_DANGEROUS":
      return "skip";
    default:
      return "skip";
  }
}

function buildImportStatement(hookOrFunction: "useTranslations" | "getTranslations"): string {
  if (hookOrFunction === "useTranslations") {
    return 'import { useTranslations } from "next-intl";';
  }
  return 'import { getTranslations } from "next-intl/server";';
}

function deduplicateKeys(entries: MigrationEntry[]): MigrationEntry[] {
  const keyMap = new Map<string, number>();

  return entries.map((entry) => {
    const fullKey = `${entry.namespace}.${entry.translationKey}`;
    const count = keyMap.get(fullKey) ?? 0;
    keyMap.set(fullKey, count + 1);

    if (count > 0) {
      return {
        ...entry,
        translationKey: `${entry.translationKey}_${count}`,
      };
    }
    return entry;
  });
}

function buildSummary(entries: MigrationEntry[]): MigrationPlanSummary {
  const namespaces = [...new Set(entries.map((e) => e.namespace))];
  const filesAffected = [...new Set(entries.map((e) => e.candidate.filePath))];

  return {
    totalEntries: entries.length,
    autoApply: entries.filter((e) => e.action === "apply").length,
    reviewRequired: entries.filter((e) => e.action === "review").length,
    skipped: entries.filter((e) => e.action === "skip").length,
    namespaces,
    filesAffected,
  };
}

export function createMigrationPlan(
  scanResult: ScanResult,
  config: SafeI18nConfig,
): MigrationPlan {
  const entries: MigrationEntry[] = scanResult.candidates.map(
    (candidate: StringCandidate): MigrationEntry => {
      const action = determineAction(candidate);
      const hookOrFunction = determineHookOrFunction(candidate.componentType);
      const transformType = determineTransformType(candidate);

      return {
        candidateId: candidate.id,
        candidate,
        action,
        translationKey: candidate.suggestedKey,
        namespace: candidate.suggestedNamespace,
        sourceValue: candidate.source,
        transformType,
        hookOrFunction,
        importStatement: buildImportStatement(hookOrFunction),
      };
    },
  );

  const deduplicated = deduplicateKeys(entries);

  return {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    config,
    entries: deduplicated,
    summary: buildSummary(deduplicated),
  };
}
