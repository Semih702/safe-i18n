import { describe, it, expect } from "vitest";
import { loadConfig, writeConfig } from "../../src/core/config.js";
import path from "node:path";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";

describe("config", () => {
  it("returns default config when no config file exists", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "safe-i18n-test-"));
    try {
      const config = await loadConfig(tempDir);
      expect(config.sourceLocale).toBe("en");
      expect(config.targetLocales).toEqual([]);
      expect(config.i18n.adapter).toBe("next-intl");
      expect(config.i18n.namespaceStrategy).toBe("route-based");
    } finally {
      await rm(tempDir, { recursive: true });
    }
  });

  it("writes and reads config file", async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), "safe-i18n-test-"));
    try {
      const config = await loadConfig(tempDir);
      config.sourceLocale = "de";
      config.targetLocales = ["en", "fr"];
      await writeConfig(tempDir, config);

      const raw = await readFile(path.join(tempDir, "safe-i18n.config.json"), "utf-8");
      const parsed = JSON.parse(raw);
      expect(parsed.sourceLocale).toBe("de");
      expect(parsed.targetLocales).toEqual(["en", "fr"]);

      const loaded = await loadConfig(tempDir);
      expect(loaded.sourceLocale).toBe("de");
      expect(loaded.targetLocales).toEqual(["en", "fr"]);
    } finally {
      await rm(tempDir, { recursive: true });
    }
  });
});
