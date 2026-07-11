import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { discoverLocaleFiles, parseSimpleYaml } from "../src/core/locale-file-discovery.js";

const TMP = path.join(import.meta.dirname, "__tmp_discovery");

function setup(structure: Record<string, string>) {
  rmSync(TMP, { recursive: true, force: true });
  for (const [rel, content] of Object.entries(structure)) {
    const full = path.join(TMP, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content, "utf-8");
  }
}

function cleanup() {
  rmSync(TMP, { recursive: true, force: true });
}

describe("parseSimpleYaml", () => {
  it("parses flat key-value pairs", () => {
    const result = parseSimpleYaml("greeting: Hello\nfarewell: Goodbye");
    assert.deepEqual(result, { greeting: "Hello", farewell: "Goodbye" });
  });

  it("parses nested keys", () => {
    const result = parseSimpleYaml("nav:\n  home: Home\n  about: About");
    assert.deepEqual(result, { nav: { home: "Home", about: "About" } });
  });

  it("strips surrounding quotes", () => {
    const result = parseSimpleYaml('title: "Hello World"\nsubtitle: \'Hi\'');
    assert.deepEqual(result, { title: "Hello World", subtitle: "Hi" });
  });

  it("skips comment lines", () => {
    const result = parseSimpleYaml("# comment\nkey: value\n  # nested comment\n");
    assert.deepEqual(result, { key: "value" });
  });

  it("handles deep nesting", () => {
    const yaml = "a:\n  b:\n    c: deep";
    const result = parseSimpleYaml(yaml);
    assert.deepEqual(result, { a: { b: { c: "deep" } } });
  });

  it("returns empty object for empty input", () => {
    assert.deepEqual(parseSimpleYaml(""), {});
    assert.deepEqual(parseSimpleYaml("\n\n# only comments\n"), {});
  });
});

describe("discoverLocaleFiles", () => {
  it("discovers flat JSON locale files", () => {
    setup({
      "package.json": "{}",
      "messages/en.json": '{"hello": "Hello"}',
      "messages/fr.json": '{"hello": "Bonjour"}',
    });

    const result = discoverLocaleFiles(TMP);
    assert.equal(result.pattern, "flat-files");
    assert.equal(result.baseLocale, "en");
    assert.equal(result.locales.length, 2);
    assert.ok(result.locales.some((l) => l.locale === "en"));
    assert.ok(result.locales.some((l) => l.locale === "fr"));
    cleanup();
  });

  it("discovers flat YAML locale files", () => {
    setup({
      "package.json": "{}",
      "messages/en.yaml": "hello: Hello",
      "messages/fr.yaml": "hello: Bonjour",
    });

    const result = discoverLocaleFiles(TMP);
    assert.equal(result.pattern, "flat-files");
    assert.equal(result.baseLocale, "en");
    assert.equal(result.locales.length, 2);
    assert.ok(result.locales.every((l) => l.format === "yaml"));
    cleanup();
  });

  it("discovers locale directories", () => {
    setup({
      "package.json": "{}",
      "locales/en/common.json": '{"ok": "OK"}',
      "locales/en/auth.json": '{"login": "Login"}',
      "locales/de/common.json": '{"ok": "OK"}',
    });

    const result = discoverLocaleFiles(TMP);
    assert.equal(result.pattern, "locale-dirs");
    assert.equal(result.baseLocale, "en");
    assert.equal(result.locales.length, 2);
    cleanup();
  });

  it("returns unknown when no locale files found", () => {
    setup({ "package.json": "{}" });
    const result = discoverLocaleFiles(TMP);
    assert.equal(result.pattern, "unknown");
    assert.equal(result.locales.length, 0);
    cleanup();
  });

  it("counts keys in JSON files", () => {
    setup({
      "messages/en.json": '{"a": "1", "b": {"c": "2", "d": "3"}}',
    });

    const result = discoverLocaleFiles(TMP);
    const en = result.locales.find((l) => l.locale === "en");
    assert.equal(en?.keyCount, 3);
    cleanup();
  });

  it("counts keys in YAML files", () => {
    setup({
      "messages/en.yml": "a: one\nb:\n  c: two\n  d: three",
    });

    const result = discoverLocaleFiles(TMP);
    const en = result.locales.find((l) => l.locale === "en");
    assert.equal(en?.keyCount, 3);
    cleanup();
  });
});
