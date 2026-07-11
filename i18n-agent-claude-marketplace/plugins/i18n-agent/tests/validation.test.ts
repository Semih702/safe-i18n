import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { validateLocales } from "../src/core/validation.js";
import type { LocaleDiscoveryResult } from "../src/types.js";

const TMP = path.join(import.meta.dirname, "__tmp_validation");

function cleanup() {
  rmSync(TMP, { recursive: true, force: true });
}

function makeDiscovery(files: Array<{ locale: string; name: string; format?: string }>): LocaleDiscoveryResult {
  return {
    localeDir: "messages",
    baseLocale: "en",
    pattern: "flat-files",
    locales: files.map((f) => ({
      locale: f.locale,
      filePath: path.join(TMP, "messages", f.name),
      relativePath: `messages/${f.name}`,
      format: (f.format ?? "json") as any,
      keyCount: 0,
    })),
  };
}

describe("validateLocales", () => {
  it("passes when all keys match", () => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(path.join(TMP, "messages"), { recursive: true });
    writeFileSync(path.join(TMP, "messages/en.json"), JSON.stringify({ a: "A", b: "B" }));
    writeFileSync(path.join(TMP, "messages/fr.json"), JSON.stringify({ a: "A-fr", b: "B-fr" }));

    const result = validateLocales(TMP, makeDiscovery([
      { locale: "en", name: "en.json" },
      { locale: "fr", name: "fr.json" },
    ]));

    assert.equal(result.valid, true);
    assert.equal(result.issues.length, 0);
    cleanup();
  });

  it("detects missing keys", () => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(path.join(TMP, "messages"), { recursive: true });
    writeFileSync(path.join(TMP, "messages/en.json"), JSON.stringify({ a: "A", b: "B" }));
    writeFileSync(path.join(TMP, "messages/fr.json"), JSON.stringify({ a: "A-fr" }));

    const result = validateLocales(TMP, makeDiscovery([
      { locale: "en", name: "en.json" },
      { locale: "fr", name: "fr.json" },
    ]));

    assert.equal(result.valid, false);
    const missing = result.issues.filter((i) => i.type === "missing-key");
    assert.equal(missing.length, 1);
    assert.equal(missing[0]!.key, "b");
    cleanup();
  });

  it("detects unused keys", () => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(path.join(TMP, "messages"), { recursive: true });
    writeFileSync(path.join(TMP, "messages/en.json"), JSON.stringify({ a: "A" }));
    writeFileSync(path.join(TMP, "messages/fr.json"), JSON.stringify({ a: "A-fr", extra: "X" }));

    const result = validateLocales(TMP, makeDiscovery([
      { locale: "en", name: "en.json" },
      { locale: "fr", name: "fr.json" },
    ]));

    const unused = result.issues.filter((i) => i.type === "unused-key");
    assert.equal(unused.length, 1);
    assert.equal(unused[0]!.key, "extra");
    assert.equal(unused[0]!.severity, "warning");
    cleanup();
  });

  it("detects placeholder mismatches", () => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(path.join(TMP, "messages"), { recursive: true });
    writeFileSync(path.join(TMP, "messages/en.json"), JSON.stringify({ msg: "Hello {name}" }));
    writeFileSync(path.join(TMP, "messages/fr.json"), JSON.stringify({ msg: "Bonjour" }));

    const result = validateLocales(TMP, makeDiscovery([
      { locale: "en", name: "en.json" },
      { locale: "fr", name: "fr.json" },
    ]));

    const ph = result.issues.filter((i) => i.type === "placeholder-mismatch");
    assert.equal(ph.length, 1);
    cleanup();
  });

  it("detects unbalanced braces", () => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(path.join(TMP, "messages"), { recursive: true });
    writeFileSync(path.join(TMP, "messages/en.json"), JSON.stringify({ msg: "{unclosed" }));

    const result = validateLocales(TMP, makeDiscovery([
      { locale: "en", name: "en.json" },
    ]));

    const syntax = result.issues.filter((i) => i.type === "syntax-error");
    assert.equal(syntax.length, 1);
    cleanup();
  });

  it("validates YAML locale files", () => {
    rmSync(TMP, { recursive: true, force: true });
    mkdirSync(path.join(TMP, "messages"), { recursive: true });
    writeFileSync(path.join(TMP, "messages/en.yaml"), "greeting: Hello\nfarewell: Bye");
    writeFileSync(path.join(TMP, "messages/fr.yaml"), "greeting: Bonjour");

    const result = validateLocales(TMP, makeDiscovery([
      { locale: "en", name: "en.yaml", format: "yaml" },
      { locale: "fr", name: "fr.yaml", format: "yaml" },
    ]));

    assert.equal(result.valid, false);
    const missing = result.issues.filter((i) => i.type === "missing-key");
    assert.equal(missing.length, 1);
    assert.equal(missing[0]!.key, "farewell");
    cleanup();
  });

  it("returns valid for empty discovery", () => {
    const result = validateLocales(TMP, {
      localeDir: null,
      baseLocale: null,
      pattern: "unknown",
      locales: [],
    });
    assert.equal(result.valid, true);
    assert.equal(result.issues.length, 0);
  });
});
