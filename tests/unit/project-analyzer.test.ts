import { describe, it, expect } from "vitest";
import { analyzeProject } from "../../src/core/project-analyzer.js";
import path from "node:path";

const nextBasicFixture = path.resolve(__dirname, "../fixtures/next-basic");
const reactBasicFixture = path.resolve(__dirname, "../fixtures/react-basic");

describe("project-analyzer", () => {
  it("detects Next.js App Router project", async () => {
    const info = await analyzeProject(nextBasicFixture);
    expect(info.framework).toBe("next-app-router");
    expect(info.hasAppRouter).toBe(true);
    expect(info.hasTypeScript).toBe(true);
  });

  it("detects React Vite project", async () => {
    const info = await analyzeProject(reactBasicFixture);
    expect(info.framework).toBe("react-vite");
  });

  it("detects npm package manager by default", async () => {
    const info = await analyzeProject(nextBasicFixture);
    expect(info.packageManager).toBe("npm");
  });

  it("reports no existing i18n", async () => {
    const info = await analyzeProject(nextBasicFixture);
    expect(info.existingI18n).toBeNull();
  });
});
