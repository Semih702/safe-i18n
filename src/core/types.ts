import { z } from "zod";

export const RiskLevel = {
  AUTO_SAFE: "AUTO_SAFE",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  SKIP_NON_UI: "SKIP_NON_UI",
  SKIP_DANGEROUS: "SKIP_DANGEROUS",
} as const;

export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const NamespaceStrategy = {
  ROUTE_BASED: "route-based",
  FILE_BASED: "file-based",
  COMPONENT_BASED: "component-based",
  FLAT: "flat",
} as const;

export type NamespaceStrategy = (typeof NamespaceStrategy)[keyof typeof NamespaceStrategy];

export const I18nAdapter = {
  NEXT_INTL: "next-intl",
} as const;

export type I18nAdapter = (typeof I18nAdapter)[keyof typeof I18nAdapter];

export const Framework = {
  NEXT_APP_ROUTER: "next-app-router",
  NEXT_PAGES_ROUTER: "next-pages-router",
  REACT_CRA: "react-cra",
  REACT_VITE: "react-vite",
  REACT_GENERIC: "react-generic",
} as const;

export type Framework = (typeof Framework)[keyof typeof Framework];

export const ComponentType = {
  SERVER: "server",
  CLIENT: "client",
  UNKNOWN: "unknown",
} as const;

export type ComponentType = (typeof ComponentType)[keyof typeof ComponentType];

export const SafeI18nConfigSchema = z.object({
  sourceLocale: z.string().default("en"),
  targetLocales: z.array(z.string()).default([]),
  include: z.array(z.string()).default(["src/**/*.{ts,tsx,js,jsx}", "app/**/*.{ts,tsx,js,jsx}", "components/**/*.{ts,tsx,js,jsx}", "pages/**/*.{ts,tsx,js,jsx}", "lib/**/*.{ts,tsx,js,jsx}"]),
  exclude: z
    .array(z.string())
    .default([
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.d.ts",
      "messages/**",
    ]),
  i18n: z
    .object({
      adapter: z.enum(["next-intl"]).default("next-intl"),
      messagesPath: z.string().default("messages"),
      namespaceStrategy: z
        .enum(["route-based", "file-based", "component-based", "flat"])
        .default("route-based"),
    })
    .default({}),
  llm: z
    .object({
      provider: z.string().default("mock"),
      model: z.string().optional(),
      baseUrl: z.string().optional(),
      apiKeyEnv: z.string().optional(),
      maxContextLength: z.number().default(500),
      enableContextSharing: z.boolean().default(true),
    })
    .optional(),
  validation: z
    .object({
      commands: z.array(z.string()).default([]),
    })
    .default({}),
});

export type SafeI18nConfig = z.infer<typeof SafeI18nConfigSchema>;

export interface StringCandidate {
  id: string;
  source: string;
  filePath: string;
  line: number;
  column: number;
  component: string | null;
  parentElement: string | null;
  propName: string | null;
  route: string | null;
  suggestedNamespace: string;
  suggestedKey: string;
  description: string;
  variables: string[];
  risk: RiskLevel;
  riskReason: string;
  componentType: ComponentType;
}

export interface ScanResult {
  candidates: StringCandidate[];
  summary: ScanSummary;
  scannedFiles: string[];
  skippedFiles: string[];
}

export interface ScanSummary {
  totalStrings: number;
  autoSafe: number;
  reviewRequired: number;
  skipNonUi: number;
  skipDangerous: number;
  filesScanned: number;
  filesSkipped: number;
}

export interface MigrationEntry {
  candidateId: string;
  candidate: StringCandidate;
  action: "apply" | "skip" | "review";
  translationKey: string;
  namespace: string;
  sourceValue: string;
  transformType: "jsx-text" | "jsx-attribute" | "template-literal";
  hookOrFunction: "useTranslations" | "getTranslations";
  importStatement: string;
}

export interface MigrationPlan {
  version: string;
  createdAt: string;
  config: SafeI18nConfig;
  entries: MigrationEntry[];
  summary: MigrationPlanSummary;
}

export interface MigrationPlanSummary {
  totalEntries: number;
  autoApply: number;
  reviewRequired: number;
  skipped: number;
  namespaces: string[];
  filesAffected: string[];
}

export interface FileBackup {
  filePath: string;
  originalContent: string;
  modifiedContent: string;
  timestamp: string;
}

export interface ManifestOperation {
  type: "migrate" | "sync";
  appliedAt: string;
  backups: FileBackup[];
  appliedEntries: string[];
  skippedEntries: string[];
  generatedFiles: string[];
}

export interface ApplyManifest {
  version: string;
  operations: ManifestOperation[];
}

export interface TranslationMessage {
  key: string;
  namespace: string;
  sourceText: string;
  translatedText: string;
  variables: string[];
  description: string;
}

export interface LocaleFile {
  locale: string;
  filePath: string;
  messages: Record<string, unknown>;
}

export interface ValidationIssue {
  type: "missing-key" | "unused-key" | "placeholder-mismatch" | "duplicate-key" | "syntax-error";
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
  commandResults?: CommandValidationResult[];
}

export interface CommandValidationResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  success: boolean;
}

export interface ProjectInfo {
  framework: Framework;
  hasTypeScript: boolean;
  hasAppRouter: boolean;
  hasPagesRouter: boolean;
  hasSrcDirectory: boolean;
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
  existingI18n: string | null;
  rootDir: string;
}
