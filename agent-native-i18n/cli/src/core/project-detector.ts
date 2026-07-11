import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ProjectInfo, Framework, PackageManager } from "../types.js";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const I18N_LIBRARIES = [
  "next-intl",
  "react-intl",
  "i18next",
  "react-i18next",
  "lingui",
  "@lingui/core",
] as const;

export function detectProject(root: string): ProjectInfo {
  const pkgJson = readPackageJson(root);
  const isNextJs = detectNextJs(root);
  const hasAppRouter = existsSync(path.join(root, "app"));
  const hasPagesRouter = existsSync(path.join(root, "pages"));
  const hasTypeScript = existsSync(path.join(root, "tsconfig.json"));
  const hasSrcDir = existsSync(path.join(root, "src"));
  const packageManager = detectPackageManager(root);
  const existingI18n = detectExistingI18n(pkgJson);
  const framework = detectFramework(isNextJs, hasAppRouter, hasPagesRouter, pkgJson);

  return {
    framework,
    hasTypeScript,
    hasAppRouter,
    hasPagesRouter,
    hasSrcDirectory: hasSrcDir,
    packageManager,
    existingI18n,
    rootDir: root,
  };
}

function detectNextJs(root: string): boolean {
  return ["next.config.js", "next.config.ts", "next.config.mjs"].some((f) =>
    existsSync(path.join(root, f)),
  );
}

function readPackageJson(root: string): PackageJson {
  const pkgPath = path.join(root, "package.json");
  if (existsSync(pkgPath)) {
    const raw = readFileSync(pkgPath, "utf-8");
    return JSON.parse(raw) as PackageJson;
  }
  return {};
}

function detectPackageManager(root: string): PackageManager {
  const lockFiles: Array<{ file: string; manager: PackageManager }> = [
    { file: "pnpm-lock.yaml", manager: "pnpm" },
    { file: "yarn.lock", manager: "yarn" },
    { file: "bun.lockb", manager: "bun" },
    { file: "package-lock.json", manager: "npm" },
  ];

  for (const { file, manager } of lockFiles) {
    if (existsSync(path.join(root, file))) {
      return manager;
    }
  }
  return "npm";
}

function detectExistingI18n(pkgJson: PackageJson): string | null {
  const allDeps: Record<string, string> = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
  };

  for (const lib of I18N_LIBRARIES) {
    if (lib in allDeps) {
      return lib;
    }
  }
  return null;
}

function detectFramework(
  isNextJs: boolean,
  hasAppRouter: boolean,
  hasPagesRouter: boolean,
  pkgJson: PackageJson,
): Framework {
  const allDeps: Record<string, string> = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
  };

  if (isNextJs) {
    if (hasAppRouter) return "next-app-router";
    if (hasPagesRouter) return "next-pages-router";
    return "next-app-router";
  }

  if ("react" in allDeps) {
    if ("react-scripts" in allDeps) return "react-cra";
    if ("vite" in allDeps) return "react-vite";
    return "react-generic";
  }

  return "unknown";
}
