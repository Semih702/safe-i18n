import { describe, it, expect } from "vitest";
import { MockProvider } from "../../src/llm/mock-provider.js";

describe("mock-provider", () => {
  const provider = new MockProvider();

  it("has name mock", () => {
    expect(provider.name).toBe("mock");
  });

  it("translates with locale prefix for Turkish", async () => {
    const result = await provider.translate({
      sourceLocale: "en",
      targetLocale: "tr",
      sourceText: "Save changes",
      variables: [],
      preserveTokens: [],
    });

    expect(result.translatedText).toContain("[TR]");
    expect(result.translatedText).toContain("Save changes");
    expect(result.confidence).toBe(1);
  });

  it("translates with locale prefix for German", async () => {
    const result = await provider.translate({
      sourceLocale: "en",
      targetLocale: "de",
      sourceText: "Hello world",
      variables: [],
      preserveTokens: [],
    });

    expect(result.translatedText).toContain("[DE]");
  });

  it("translates with locale prefix for French", async () => {
    const result = await provider.translate({
      sourceLocale: "en",
      targetLocale: "fr",
      sourceText: "Hello world",
      variables: [],
      preserveTokens: [],
    });

    expect(result.translatedText).toContain("[FR]");
  });

  it("preserves variables in translation", async () => {
    const result = await provider.translate({
      sourceLocale: "en",
      targetLocale: "tr",
      sourceText: "Welcome, {name}!",
      variables: ["name"],
      preserveTokens: ["{name}"],
    });

    expect(result.translatedText).toContain("{name}");
  });

  it("suggests key from source text", async () => {
    const result = await provider.suggestKey!({
      sourceText: "Save changes",
      filePath: "app/settings/page.tsx",
    });

    expect(result.key).toBe("save.changes");
    expect(result.description).toBeTruthy();
  });

  it("returns confidence of 1", async () => {
    const result = await provider.translate({
      sourceLocale: "en",
      targetLocale: "tr",
      sourceText: "Test",
      variables: [],
      preserveTokens: [],
    });

    expect(result.confidence).toBe(1);
  });
});
