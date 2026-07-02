import { describe, it, expect } from "vitest";
import { setNestedKey, mergeMessages, generateMessageFiles } from "../../src/adapters/next-intl/messages.js";
import type { MigrationEntry, StringCandidate } from "../../src/core/types.js";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

describe("setNestedKey", () => {
  it("sets a simple key", () => {
    const obj: Record<string, unknown> = {};
    setNestedKey(obj, "save", "Save");
    expect(obj).toEqual({ save: "Save" });
  });

  it("sets a nested key", () => {
    const obj: Record<string, unknown> = {};
    setNestedKey(obj, "actions.save", "Save");
    expect(obj).toEqual({ actions: { save: "Save" } });
  });

  it("sets deeply nested key", () => {
    const obj: Record<string, unknown> = {};
    setNestedKey(obj, "a.b.c", "value");
    expect(obj).toEqual({ a: { b: { c: "value" } } });
  });
});

describe("mergeMessages", () => {
  it("merges flat objects", () => {
    const result = mergeMessages({ a: "1" }, { b: "2" });
    expect(result).toEqual({ a: "1", b: "2" });
  });

  it("incoming overrides existing", () => {
    const result = mergeMessages({ a: "1" }, { a: "2" });
    expect(result).toEqual({ a: "2" });
  });

  it("deep merges nested objects", () => {
    const result = mergeMessages(
      { x: { a: "1", b: "2" } },
      { x: { b: "3", c: "4" } },
    );
    expect(result).toEqual({ x: { a: "1", b: "3", c: "4" } });
  });
});

describe("generateMessageFiles", () => {
  it("generates source locale file", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "safe-i18n-msg-"));
    try {
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
      };

      const entry: MigrationEntry = {
        candidateId: "str_1",
        candidate,
        action: "apply",
        translationKey: "save",
        namespace: "common",
        sourceValue: "Save",
        transformType: "jsx-text",
        hookOrFunction: "useTranslations",
        importStatement: "",
      };

      const result = await generateMessageFiles({
        root: tempDir,
        messagesPath: "messages",
        sourceLocale: "en",
        entries: [entry],
      });

      expect(result.files.length).toBe(1);
      expect(result.keyCount).toBe(1);

      const content = await readFile(path.join(tempDir, "messages", "en.json"), "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed.common.save).toBe("Save");
    } finally {
      await rm(tempDir, { recursive: true });
    }
  });
});
