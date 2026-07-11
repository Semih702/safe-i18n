import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { analyzeKeys, flattenMessages } from "../src/core/key-analysis.js";
import type { LocaleDiscoveryResult } from "../src/types.js";

const TMP = path.join(import.meta.dirname, "__tmp_analysis");

function cleanup() {
  rmSync(TMP, { recursive: true, force: true });
}

describe("flattenMessages", () => {
  it("flattens nested objects with dot notation", () => {
    const result = flattenMessages({ a: { b: "val", c: { d: "deep" } } });
    assert.deepEqual(result, { "a.b": "val", "a.c.d": "deep" });
  });

  it("handles flat objects", () => {
    const result = flattenMessages({ hello: "Hello", bye: "Bye" });
    assert.deepEqual(result, { hello: "Hello", bye: "Bye" });
  });

  it("skips arrays and non-string non-object values", () => {
    const result = flattenMessages({ a: "str", b: [1, 2], c: 42 } as any);
    assert.deepEqual(result, { a: "str" });
  });

  it("returns empty for empty input", () => {
    assert.deepEqual(flattenMessages({}), {});
  });
});

describe("analyzeKeys", () => {
  it("detects missing and extra keys", () => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(path.join(TMP, "messages"), { recursive: true });
    writeFileSync(
      path.join(TMP, "messages/en.json"),
      JSON.stringify({ greeting: "Hello", farewell: "Bye", title: "Title" }),
    );
    writeFileSync(
      path.join(TMP, "messages/fr.json"),
      JSON.stringify({ greeting: "Bonjour", extra: "Supplémentaire" }),
    );

    const discovery: LocaleDiscoveryResult = {
      localeDir: "messages",
      baseLocale: "en",
      pattern: "flat-files",
      locales: [
        { locale: "en", filePath: path.join(TMP, "messages/en.json"), relativePath: "messages/en.json", format: "json", keyCount: 3 },
        { locale: "fr", filePath: path.join(TMP, "messages/fr.json"), relativePath: "messages/fr.json", format: "json", keyCount: 2 },
      ],
    };

    const result = analyzeKeys(TMP, discovery);
    assert.ok(result);
    assert.equal(result.totalKeysInBase, 3);
    assert.equal(result.coverage["fr"]?.missingKeys, 2);
    assert.equal(result.coverage["fr"]?.extraKeys, 1);
    assert.equal(result.coverage["fr"]?.coveragePercent, 33);
    assert.deepEqual(result.missingKeys["fr"]?.sort(), ["farewell", "title"]);
    assert.deepEqual(result.extraKeys["fr"], ["extra"]);
    cleanup();
  });

  it("returns null when no locales", () => {
    const result = analyzeKeys(TMP, {
      localeDir: null,
      baseLocale: null,
      pattern: "unknown",
      locales: [],
    });
    assert.equal(result, null);
  });

  it("handles 100% coverage", () => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(path.join(TMP, "messages"), { recursive: true });
    writeFileSync(path.join(TMP, "messages/en.json"), JSON.stringify({ a: "A" }));
    writeFileSync(path.join(TMP, "messages/de.json"), JSON.stringify({ a: "A-de" }));

    const discovery: LocaleDiscoveryResult = {
      localeDir: "messages",
      baseLocale: "en",
      pattern: "flat-files",
      locales: [
        { locale: "en", filePath: path.join(TMP, "messages/en.json"), relativePath: "messages/en.json", format: "json", keyCount: 1 },
        { locale: "de", filePath: path.join(TMP, "messages/de.json"), relativePath: "messages/de.json", format: "json", keyCount: 1 },
      ],
    };

    const result = analyzeKeys(TMP, discovery);
    assert.ok(result);
    assert.equal(result.coverage["de"]?.coveragePercent, 100);
    assert.equal(result.coverage["de"]?.missingKeys, 0);
    cleanup();
  });

  it("analyzes YAML locale files", () => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(path.join(TMP, "messages"), { recursive: true });
    writeFileSync(path.join(TMP, "messages/en.yaml"), "a: Apple\nb: Banana");
    writeFileSync(path.join(TMP, "messages/fr.yaml"), "a: Pomme");

    const discovery: LocaleDiscoveryResult = {
      localeDir: "messages",
      baseLocale: "en",
      pattern: "flat-files",
      locales: [
        { locale: "en", filePath: path.join(TMP, "messages/en.yaml"), relativePath: "messages/en.yaml", format: "yaml", keyCount: 2 },
        { locale: "fr", filePath: path.join(TMP, "messages/fr.yaml"), relativePath: "messages/fr.yaml", format: "yaml", keyCount: 1 },
      ],
    };

    const result = analyzeKeys(TMP, discovery);
    assert.ok(result);
    assert.equal(result.totalKeysInBase, 2);
    assert.equal(result.coverage["fr"]?.missingKeys, 1);
    cleanup();
  });
});
