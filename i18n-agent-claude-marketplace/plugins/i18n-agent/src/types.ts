export type Framework =
  | "next-app-router"
  | "next-pages-router"
  | "react-cra"
  | "react-vite"
  | "react-generic"
  | "vue-cli"
  | "vue-vite"
  | "nuxt"
  | "unknown";

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

export type I18nFramework =
  | "next-intl"
  | "react-intl"
  | "react-i18next"
  | "i18next"
  | "lingui"
  | "vue-i18n"
  | null;

export interface ProjectInfo {
  framework: Framework;
  hasTypeScript: boolean;
  hasAppRouter: boolean;
  hasPagesRouter: boolean;
  hasSrcDirectory: boolean;
  packageManager: PackageManager;
  existingI18n: string | null;
  rootDir: string;
}

export interface I18nFrameworkInfo {
  name: I18nFramework;
  version: string | null;
  configExists: boolean;
  configPath: string | null;
}

export interface LocaleFileInfo {
  locale: string;
  filePath: string;
  relativePath: string;
  format: "json" | "yaml" | "ts" | "js";
  keyCount: number;
}

export interface LocaleDiscoveryResult {
  localeDir: string | null;
  locales: LocaleFileInfo[];
  baseLocale: string | null;
  pattern: "flat-files" | "locale-dirs" | "namespaced" | "unknown";
}

export interface KeyAnalysis {
  baseLocale: string;
  locales: string[];
  totalKeysInBase: number;
  coverage: Record<string, LocaleCoverage>;
  missingKeys: Record<string, string[]>;
  extraKeys: Record<string, string[]>;
}

export interface LocaleCoverage {
  locale: string;
  totalKeys: number;
  matchingKeys: number;
  missingKeys: number;
  extraKeys: number;
  coveragePercent: number;
}

export interface ValidationIssue {
  type:
    | "missing-key"
    | "unused-key"
    | "placeholder-mismatch"
    | "duplicate-key"
    | "syntax-error"
    | "json-parse-error";
  severity: "error" | "warning";
  locale: string;
  key: string;
  message: string;
  details?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  localesChecked: string[];
  totalKeys: number;
}

export interface DetectResult {
  project: ProjectInfo;
  i18nFramework: I18nFrameworkInfo;
  locales: LocaleDiscoveryResult;
}

export interface AnalyzeResult {
  detect: DetectResult;
  keyAnalysis: KeyAnalysis | null;
}

export interface DiffPlan {
  action: "add-locale";
  targetLocale: string;
  baseLocale: string;
  filesToCreate: PlannedFile[];
  summary: string;
}

export interface PlannedFile {
  path: string;
  basedOn: string;
  keyCount: number;
}

export interface DoctorCheck {
  name: string;
  passed: boolean;
  message: string;
}
