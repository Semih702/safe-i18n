import { describe, it, expect } from "vitest";
import { isInsideProject, getConfigDir, getMigrationPlanPath } from "../../src/utils/paths.js";

describe("paths", () => {
  it("detects paths inside project", () => {
    expect(isInsideProject("/project", "/project/src/file.ts")).toBe(true);
  });

  it("rejects paths outside project", () => {
    expect(isInsideProject("/project", "/other/file.ts")).toBe(false);
  });

  it("rejects path traversal", () => {
    expect(isInsideProject("/project", "/project/../etc/passwd")).toBe(false);
  });

  it("returns correct config dir", () => {
    const dir = getConfigDir("/project");
    expect(dir).toContain(".safe-i18n");
  });

  it("returns correct migration plan path", () => {
    const planPath = getMigrationPlanPath("/project");
    expect(planPath).toContain("migration-plan.json");
  });
});
