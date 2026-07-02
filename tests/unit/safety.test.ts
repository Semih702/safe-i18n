import { describe, it, expect } from "vitest";
import { checkTransformSafety, canUseHookInFile, shouldAddUseClient } from "../../src/codemod/safety.js";
import type { MigrationEntry, StringCandidate } from "../../src/core/types.js";

function makeEntry(overrides: Partial<MigrationEntry & { candidate: Partial<StringCandidate> }> = {}): MigrationEntry {
  const candidate: StringCandidate = {
    id: "str_1",
    source: "Save",
    filePath: "app/page.tsx",
    line: 1,
    column: 0,
    component: "Page",
    parentElement: "button",
    propName: null,
    route: "/",
    suggestedNamespace: "common",
    suggestedKey: "save",
    description: "",
    variables: [],
    risk: "AUTO_SAFE",
    riskReason: "",
    componentType: "client",
    ...(overrides.candidate ?? {}),
  };
  return {
    candidateId: candidate.id,
    candidate,
    action: "apply",
    translationKey: "save",
    namespace: "common",
    sourceValue: "Save",
    transformType: "jsx-text",
    hookOrFunction: "useTranslations",
    importStatement: "",
    ...overrides,
    candidate,
  };
}

describe("safety", () => {
  describe("checkTransformSafety", () => {
    it("allows AUTO_SAFE entries with apply action", () => {
      const result = checkTransformSafety(makeEntry());
      expect(result.safe).toBe(true);
    });

    it("rejects non-apply action", () => {
      const result = checkTransformSafety(makeEntry({ action: "review" }));
      expect(result.safe).toBe(false);
    });

    it("rejects non-AUTO_SAFE risk", () => {
      const result = checkTransformSafety(
        makeEntry({ candidate: { risk: "REVIEW_REQUIRED", riskReason: "conditional" } }),
      );
      expect(result.safe).toBe(false);
    });

    it("allows server components with getTranslations", () => {
      const result = checkTransformSafety(
        makeEntry({
          candidate: { componentType: "server" },
          hookOrFunction: "getTranslations",
        }),
      );
      expect(result.safe).toBe(true);
    });

    it("rejects template literal transforms", () => {
      const result = checkTransformSafety(
        makeEntry({ transformType: "template-literal" }),
      );
      expect(result.safe).toBe(false);
    });
  });

  describe("shouldAddUseClient", () => {
    it("never returns true (safety principle)", () => {
      expect(shouldAddUseClient("unknown", true)).toBe(false);
      expect(shouldAddUseClient("server", true)).toBe(false);
      expect(shouldAddUseClient("client", true)).toBe(false);
    });
  });

  describe("canUseHookInFile", () => {
    it("returns false for server components", () => {
      expect(canUseHookInFile('"use server";', "server")).toBe(false);
    });

    it("returns true for client components", () => {
      expect(canUseHookInFile('"use client";', "client")).toBe(true);
    });

    it("returns true for unknown components with existing hooks", () => {
      expect(canUseHookInFile("const [x, y] = useState(0);", "unknown")).toBe(true);
    });

    it("returns false for unknown components without hooks", () => {
      expect(canUseHookInFile("export default function Page() {}", "unknown")).toBe(false);
    });
  });
});
