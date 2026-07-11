import { describe, it, expect } from "vitest";
import { scanProject } from "../../src/core/scanner.js";
import type { SafeI18nConfig } from "../../src/core/types.js";
import path from "node:path";

const fixtureRoot = path.resolve(__dirname, "../fixtures/next-basic");
const riskyFixtureRoot = path.resolve(__dirname, "../fixtures/next-with-risky-strings");

const defaultConfig: SafeI18nConfig = {
  sourceLocale: "en",
  targetLocales: ["tr"],
  include: ["app/**/*.tsx", "components/**/*.tsx"],
  exclude: [],
  i18n: {
    adapter: "next-intl",
    messagesPath: "messages",
    namespaceStrategy: "route-based",
  },
  validation: { commands: [] },
};

describe("scanner", () => {
  it("detects static JSX text in visible elements", async () => {
    const result = await scanProject(fixtureRoot, defaultConfig);

    const welcomeString = result.candidates.find((c) => c.source === "Welcome to our app");
    expect(welcomeString).toBeDefined();
    expect(welcomeString!.parentElement).toBe("h1");
    expect(welcomeString!.risk).toBe("AUTO_SAFE");
  });

  it("detects button text", async () => {
    const result = await scanProject(fixtureRoot, defaultConfig);

    const buttonString = result.candidates.find((c) => c.source === "Get started");
    expect(buttonString).toBeDefined();
    expect(buttonString!.parentElement).toBe("button");
    expect(buttonString!.risk).toBe("AUTO_SAFE");
  });

  it("detects placeholder attributes", async () => {
    const result = await scanProject(fixtureRoot, defaultConfig);

    const placeholder = result.candidates.find(
      (c) => c.source === "Enter your username" && c.propName === "placeholder",
    );
    expect(placeholder).toBeDefined();
    expect(placeholder!.risk).toBe("AUTO_SAFE");
  });

  it("detects aria-label attributes", async () => {
    const result = await scanProject(fixtureRoot, defaultConfig);

    const ariaLabel = result.candidates.find(
      (c) => c.propName === "aria-label" && c.source === "Open menu",
    );
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel!.risk).toBe("AUTO_SAFE");
  });

  it("detects UI strings stored in object constants", async () => {
    const result = await scanProject(fixtureRoot, defaultConfig);

    const placeholder = result.candidates.find(
      (c) => c.source === "Describe in plain English what should happen",
    );
    expect(placeholder).toBeDefined();
    expect(placeholder!.parentElement).toBe("ObjectExpression");
    expect(placeholder!.propName).toBe("prompt");
    expect(placeholder!.risk).toBe("REVIEW_REQUIRED");
  });

  it("detects alt attributes", async () => {
    const result = await scanProject(riskyFixtureRoot, defaultConfig);

    const alt = result.candidates.find((c) => c.propName === "alt" && c.source === "Company logo");
    expect(alt).toBeDefined();
    expect(alt!.risk).toBe("AUTO_SAFE");
  });

  it("marks conditional strings as REVIEW_REQUIRED", async () => {
    const result = await scanProject(riskyFixtureRoot, defaultConfig);

    const conditionals = result.candidates.filter((c) => c.risk === "REVIEW_REQUIRED");
    expect(conditionals.length).toBeGreaterThan(0);

    const pleaseWait = conditionals.find((c) => c.source === "Please wait...");
    expect(pleaseWait).toBeDefined();
  });

  it("generates correct summary counts", async () => {
    const result = await scanProject(fixtureRoot, defaultConfig);
    const { summary } = result;

    expect(summary.totalStrings).toBeGreaterThan(0);
    expect(summary.autoSafe).toBeGreaterThan(0);
    expect(summary.filesScanned).toBeGreaterThan(0);
    expect(summary.totalStrings).toBe(
      summary.autoSafe + summary.reviewRequired + summary.skipNonUi + summary.skipDangerous,
    );
  });

  it("infers route for app directory pages", async () => {
    const result = await scanProject(fixtureRoot, defaultConfig);

    const settingsString = result.candidates.find((c) => c.source === "Account settings");
    expect(settingsString).toBeDefined();
    expect(settingsString!.route).toBe("/settings");
  });

  it("detects component type from use client directive", async () => {
    const result = await scanProject(fixtureRoot, defaultConfig);

    const headerStrings = result.candidates.filter((c) => c.filePath.includes("Header"));
    expect(headerStrings.length).toBeGreaterThan(0);
    for (const s of headerStrings) {
      expect(s.componentType).toBe("client");
    }
  });

  it("detects component names", async () => {
    const result = await scanProject(fixtureRoot, defaultConfig);

    const settingsString = result.candidates.find((c) => c.source === "Account settings");
    expect(settingsString).toBeDefined();
    expect(settingsString!.component).toBe("SettingsPage");
  });
});
