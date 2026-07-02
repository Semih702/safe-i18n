import { describe, it, expect } from "vitest";
import { createMigrationPlan } from "../../src/core/planner.js";
import type { ScanResult, SafeI18nConfig, StringCandidate } from "../../src/core/types.js";

function makeScanResult(candidates: StringCandidate[]): ScanResult {
  return {
    candidates,
    scannedFiles: ["app/page.tsx"],
    skippedFiles: [],
    summary: {
      totalStrings: candidates.length,
      autoSafe: candidates.filter((c) => c.risk === "AUTO_SAFE").length,
      reviewRequired: candidates.filter((c) => c.risk === "REVIEW_REQUIRED").length,
      skipNonUi: candidates.filter((c) => c.risk === "SKIP_NON_UI").length,
      skipDangerous: candidates.filter((c) => c.risk === "SKIP_DANGEROUS").length,
      filesScanned: 1,
      filesSkipped: 0,
    },
  };
}

function makeCandidate(overrides: Partial<StringCandidate> = {}): StringCandidate {
  return {
    id: "str_1",
    source: "Save changes",
    filePath: "app/settings/page.tsx",
    line: 5,
    column: 10,
    component: "SettingsPage",
    parentElement: "button",
    propName: null,
    route: "/settings",
    suggestedNamespace: "settings",
    suggestedKey: "save.changes",
    description: "Button text in settings page",
    variables: [],
    risk: "AUTO_SAFE",
    riskReason: "Static JSX text",
    componentType: "unknown",
    ...overrides,
  };
}

const defaultConfig: SafeI18nConfig = {
  sourceLocale: "en",
  targetLocales: ["tr"],
  include: ["app/**/*.tsx"],
  exclude: [],
  i18n: {
    adapter: "next-intl",
    messagesPath: "messages",
    namespaceStrategy: "route-based",
  },
  validation: { commands: [] },
};

describe("planner", () => {
  it("creates a migration plan from scan results", () => {
    const candidate = makeCandidate();
    const scanResult = makeScanResult([candidate]);
    const plan = createMigrationPlan(scanResult, defaultConfig);

    expect(plan.version).toBe("1.0.0");
    expect(plan.entries).toHaveLength(1);
    expect(plan.entries[0]!.candidateId).toBe("str_1");
    expect(plan.entries[0]!.action).toBe("apply");
  });

  it("marks REVIEW_REQUIRED entries as review", () => {
    const candidate = makeCandidate({ risk: "REVIEW_REQUIRED" });
    const plan = createMigrationPlan(makeScanResult([candidate]), defaultConfig);

    expect(plan.entries[0]!.action).toBe("review");
  });

  it("marks SKIP_NON_UI entries as skip", () => {
    const candidate = makeCandidate({ risk: "SKIP_NON_UI" });
    const plan = createMigrationPlan(makeScanResult([candidate]), defaultConfig);

    expect(plan.entries[0]!.action).toBe("skip");
  });

  it("marks SKIP_DANGEROUS entries as skip", () => {
    const candidate = makeCandidate({ risk: "SKIP_DANGEROUS" });
    const plan = createMigrationPlan(makeScanResult([candidate]), defaultConfig);

    expect(plan.entries[0]!.action).toBe("skip");
  });

  it("uses useTranslations for client components", () => {
    const candidate = makeCandidate({ componentType: "client" });
    const plan = createMigrationPlan(makeScanResult([candidate]), defaultConfig);

    expect(plan.entries[0]!.hookOrFunction).toBe("useTranslations");
  });

  it("uses getTranslations for server components", () => {
    const candidate = makeCandidate({ componentType: "server" });
    const plan = createMigrationPlan(makeScanResult([candidate]), defaultConfig);

    expect(plan.entries[0]!.hookOrFunction).toBe("getTranslations");
  });

  it("deduplicates identical keys", () => {
    const candidates = [
      makeCandidate({ id: "str_1", suggestedKey: "save" }),
      makeCandidate({ id: "str_2", suggestedKey: "save" }),
    ];
    const plan = createMigrationPlan(makeScanResult(candidates), defaultConfig);

    const keys = plan.entries.map((e) => e.translationKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("provides correct summary", () => {
    const candidates = [
      makeCandidate({ id: "str_1", risk: "AUTO_SAFE" }),
      makeCandidate({ id: "str_2", risk: "REVIEW_REQUIRED" }),
      makeCandidate({ id: "str_3", risk: "SKIP_NON_UI" }),
    ];
    const plan = createMigrationPlan(makeScanResult(candidates), defaultConfig);

    expect(plan.summary.totalEntries).toBe(3);
    expect(plan.summary.autoApply).toBe(1);
    expect(plan.summary.reviewRequired).toBe(1);
    expect(plan.summary.skipped).toBe(1);
  });
});
