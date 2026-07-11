import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ProjectInfo, Framework } from "../types.js";
import { detectPackageManager } from "./package-manager-detector.js";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const I18N_LIBRARIES = [
  "next-intl",
  "react-intl",
  "i18next",
  "react-i18next",
  "@lingui/core",
  "vue-i18n",
] as const;

export function detectProject(root: string): ProjectInfo {
  const pkgJson = readPackageJson(root);
  const isNextJs = hasConfigFile(root, ["next.config.js", "next.config.ts", "next.config.mjs"]);
  const isNuxt = hasConfigFile(root, ["nuxt.config.js", "nuxt.config.ts"]);
  const hasAppRouter = existsSync(path.join(root, "app"));
  const hasPagesRouter = existsSync(path.join(root, "pages"));
  const hasTypeScript = existsSync(path.join(root, "tsconfig.json"));
  const hasSrcDir = existsSync(path.join(root, "src"));
  const packageManager = detectPackageManager(root);
  const existingI18n = detectExistingI18n(pkgJson);
  const framework = detectFramework(isNextJs, isNuxt, hasAppRouter, hasPagesRouter, pkgJson);

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

function readPackageJson(root: string): PackageJson {
  const pkgPath = path.join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      return JSON.parse(readFileSync(pkgPath, "utf-8")) as PackageJson;
    } catch {
      return {};
    }
  }
  return {};
}

function hasConfigFile(root: string, candidates: string[]): boolean {
  return candidates.some((f) => existsSync(path.join(root, f)));
}

function detectExistingI18n(pkgJson: PackageJson): string | null {
  const allDeps: Record<string, string> = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
  };
  for (const lib of I18N_LIBRARIES) {
    if (lib in allDeps) return lib;
  }
  return null;
}

function detectFramework(
  isNextJs: boolean,
  isNuxt: boolean,
  hasAppRouter: boolean,
  hasPagesRouter: boolean,
  pkgJson: PackageJson,
): Framework {
  const allDeps: Record<string, string> = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
  };

  if (isNuxt) return "nuxt";

  if (isNextJs) {
    if (hasAppRouter) return "next-app-router";
    if (hasPagesRouter) return "next-pages-router";
    return "next-app-router";
  }

  if ("vue" in allDeps) {
    if ("@vue/cli-service" in allDeps) return "vue-cli";
    if ("vite" in allDeps) return "vue-vite";
  }

  if ("react" in allDeps) {
    if ("react-scripts" in allDeps) return "react-cra";
    if ("vite" in allDeps) return "react-vite";
    return "react-generic";
  }

  return "unknown";
}
