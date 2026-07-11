import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { detectProject } from "../src/core/project-detector.js";

const TMP = path.join(import.meta.dirname, "__tmp_project");

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

describe("detectProject", () => {
  it("detects Next.js app router", () => {
    setup({
      "package.json": JSON.stringify({ dependencies: { next: "14.0.0" } }),
      "next.config.js": "module.exports = {}",
      "app/layout.tsx": "export default function Layout() {}",
      "tsconfig.json": "{}",
    });
    const result = detectProject(TMP);
    assert.equal(result.framework, "next-app-router");
    assert.equal(result.hasTypeScript, true);
    assert.equal(result.hasAppRouter, true);
    cleanup();
  });

  it("detects Next.js pages router", () => {
    setup({
      "package.json": JSON.stringify({ dependencies: { next: "13.0.0" } }),
      "next.config.js": "module.exports = {}",
      "pages/index.js": "",
    });
    const result = detectProject(TMP);
    assert.equal(result.framework, "next-pages-router");
    assert.equal(result.hasPagesRouter, true);
    cleanup();
  });

  it("detects React with Vite", () => {
    setup({
      "package.json": JSON.stringify({ dependencies: { react: "18.0.0" }, devDependencies: { vite: "5.0.0" } }),
    });
    const result = detectProject(TMP);
    assert.equal(result.framework, "react-vite");
    cleanup();
  });

  it("detects Vue with Vite", () => {
    setup({
      "package.json": JSON.stringify({ dependencies: { vue: "3.0.0" }, devDependencies: { vite: "5.0.0" } }),
    });
    const result = detectProject(TMP);
    assert.equal(result.framework, "vue-vite");
    cleanup();
  });

  it("detects package manager from lock file", () => {
    setup({
      "package.json": "{}",
      "pnpm-lock.yaml": "",
    });
    const result = detectProject(TMP);
    assert.equal(result.packageManager, "pnpm");
    cleanup();
  });

  it("detects existing i18n library", () => {
    setup({
      "package.json": JSON.stringify({ dependencies: { "next-intl": "3.0.0" } }),
    });
    const result = detectProject(TMP);
    assert.equal(result.existingI18n, "next-intl");
    cleanup();
  });

  it("returns unknown for bare project", () => {
    setup({ "package.json": "{}" });
    const result = detectProject(TMP);
    assert.equal(result.framework, "unknown");
    assert.equal(result.packageManager, "npm");
    cleanup();
  });
});
