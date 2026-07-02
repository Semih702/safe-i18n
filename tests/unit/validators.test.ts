import { describe, it, expect } from "vitest";
import { validateLocaleFiles } from "../../src/validators/locale-validator.js";
import { validatePlaceholders } from "../../src/validators/placeholder-validator.js";
import path from "node:path";

const fixtureRoot = path.resolve(__dirname, "../fixtures/locale-validation");

describe("locale-validator", () => {
  it("detects missing keys in target locale", async () => {
    const issues = await validateLocaleFiles({
      root: fixtureRoot,
      messagesPath: "messages",
      sourceLocale: "en",
      targetLocales: ["tr"],
    });

    const missingKeys = issues.filter((i) => i.type === "missing-key");
    expect(missingKeys.length).toBeGreaterThan(0);

    const missingDelete = missingKeys.find((i) => i.key === "common.delete");
    expect(missingDelete).toBeDefined();
    expect(missingDelete!.locale).toBe("tr");
  });
});

describe("placeholder-validator", () => {
  it("detects placeholder mismatches", async () => {
    const issues = await validatePlaceholders({
      root: fixtureRoot,
      messagesPath: "messages",
      sourceLocale: "en",
      targetLocales: ["tr"],
    });

    const mismatches = issues.filter((i) => i.type === "placeholder-mismatch");
    expect(mismatches.length).toBeGreaterThan(0);

    const greetingMismatch = mismatches.find((i) => i.key === "greeting");
    expect(greetingMismatch).toBeDefined();
  });
});
