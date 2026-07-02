import { describe, it, expect } from "vitest";
import { transformFileSource } from "../../src/codemod/transforms.js";
import type { MigrationEntry, StringCandidate } from "../../src/core/types.js";

function makeEntry(overrides: Partial<MigrationEntry> = {}): MigrationEntry {
  const candidate: StringCandidate = {
    id: "str_1",
    source: "Save changes",
    filePath: "app/page.tsx",
    line: 4,
    column: 10,
    component: "Page",
    parentElement: "button",
    propName: null,
    route: "/",
    suggestedNamespace: "common",
    suggestedKey: "save.changes",
    description: "Button text",
    variables: [],
    risk: "AUTO_SAFE",
    riskReason: "Static JSX text",
    componentType: "client",
    ...(overrides.candidate ?? {}),
  };

  return {
    candidateId: candidate.id,
    candidate,
    action: "apply",
    translationKey: "save.changes",
    namespace: "common",
    sourceValue: "Save changes",
    transformType: "jsx-text",
    hookOrFunction: "useTranslations",
    importStatement: 'import { useTranslations } from "next-intl";',
    ...overrides,
  };
}

describe("transforms", () => {
  it("skips entries that are not AUTO_SAFE in safe-only mode", () => {
    const source = `"use client";\nexport function Page() {\n  return <button>Save changes</button>;\n}`;
    const entry = makeEntry({
      candidate: {
        id: "str_1",
        source: "Save changes",
        filePath: "app/page.tsx",
        line: 3,
        column: 17,
        component: "Page",
        parentElement: "button",
        propName: null,
        route: "/",
        suggestedNamespace: "common",
        suggestedKey: "save.changes",
        description: "Button text",
        variables: [],
        risk: "REVIEW_REQUIRED",
        riskReason: "Conditional",
        componentType: "client",
      },
      action: "review",
    });

    const result = transformFileSource(source, [entry], true);
    expect(result.applied).toHaveLength(0);
    expect(result.skipped.length).toBeGreaterThan(0);
    expect(result.code).toBe(source);
  });

  it("adds use client directive and useTranslations for client components without directive", () => {
    const source = `export function Page() {\n  return <button>Save changes</button>;\n}`;
    const entry = makeEntry({
      candidate: {
        id: "str_1",
        source: "Save changes",
        filePath: "components/page.tsx",
        line: 2,
        column: 17,
        component: "Page",
        parentElement: "button",
        propName: null,
        route: null,
        suggestedNamespace: "common",
        suggestedKey: "saveChanges",
        description: "Button text",
        variables: [],
        risk: "AUTO_SAFE",
        riskReason: "Static",
        componentType: "client",
      },
    });

    const result = transformFileSource(source, [entry], true);
    expect(result.applied.length).toBe(1);
    expect(result.code).toContain('"use client"');
    expect(result.code).toContain('useTranslations');
  });

  it("handles empty entries array", () => {
    const source = `export function Page() { return <div>Hello</div>; }`;
    const result = transformFileSource(source, [], true);
    expect(result.code).toBe(source);
    expect(result.applied).toHaveLength(0);
  });
});
