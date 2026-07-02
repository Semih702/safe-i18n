export type {
  SafeI18nConfig,
  StringCandidate,
  ScanResult,
  ScanSummary,
  MigrationPlan,
  MigrationEntry,
  MigrationPlanSummary,
  ApplyManifest,
  FileBackup,
  ValidationResult,
  ValidationIssue,
  ProjectInfo,
  RiskLevel,
  Framework,
  ComponentType,
  LocaleFile,
  TranslationMessage,
} from "./core/types.js";

export { SafeI18nConfigSchema } from "./core/types.js";
export { loadConfig, writeConfig } from "./core/config.js";
export { analyzeProject } from "./core/project-analyzer.js";
export { scanProject } from "./core/scanner.js";
export { createMigrationPlan } from "./core/planner.js";
export { classifyRisk } from "./core/risk-classifier.js";
export { transformFileSource } from "./codemod/transforms.js";
export { checkTransformSafety } from "./codemod/safety.js";
export { createProvider } from "./llm/provider.js";
