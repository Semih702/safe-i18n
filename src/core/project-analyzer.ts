import path from "node:path";

import type { ProjectInfo, Framework } from "./types.js";
import { Framework as FrameworkEnum } from "./types.js";
import { fileExists, readJsonFile } from "../utils/fs.js";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const I18N_LIBRARIES = [
  "next-intl",
  "react-intl",
  "i18next",
  "react-i18next",
] as const;

export async function analyzeProject(root: string): Promise<ProjectInfo> {
  const [isNextJs, hasAppRouter, hasPagesRouter, hasTypeScript, hasSrcDir, pkgJson] =
    await Promise.all([
      detectNextJs(root),
      fileExists(path.join(root, "app")),
      fileExists(path.join(root, "pages")),
      fileExists(path.join(root, "tsconfig.json")),
      fileExists(path.join(root, "src")),
      readPackageJson(root),
    ]);

  const packageManager = await detectPackageManager(root);
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

async function detectNextJs(root: string): Promise<boolean> {
  const configFiles = [
    "next.config.js",
    "next.config.ts",
    "next.config.mjs",
  ];

  const results = await Promise.all(
    configFiles.map((f) => fileExists(path.join(root, f))),
  );

  return results.some(Boolean);
}

async function readPackageJson(root: string): Promise<PackageJson> {
  const pkgPath = path.join(root, "package.json");
  if (await fileExists(pkgPath)) {
    return readJsonFile<PackageJson>(pkgPath);
  }
  return {};
}

async function detectPackageManager(
  root: string,
): Promise<"npm" | "yarn" | "pnpm" | "bun"> {
  const lockFiles: Array<{ file: string; manager: "npm" | "yarn" | "pnpm" | "bun" }> = [
    { file: "pnpm-lock.yaml", manager: "pnpm" },
    { file: "yarn.lock", manager: "yarn" },
    { file: "bun.lockb", manager: "bun" },
    { file: "package-lock.json", manager: "npm" },
  ];

  for (const { file, manager } of lockFiles) {
    if (await fileExists(path.join(root, file))) {
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
    if (hasAppRouter) {
      return FrameworkEnum.NEXT_APP_ROUTER;
    }
    if (hasPagesRouter) {
      return FrameworkEnum.NEXT_PAGES_ROUTER;
    }
    // Default to app router for Next.js projects without clear routing dir
    return FrameworkEnum.NEXT_APP_ROUTER;
  }

  const hasReact = "react" in allDeps;
  if (hasReact) {
    if ("react-scripts" in allDeps) {
      return FrameworkEnum.REACT_CRA;
    }
    if ("vite" in allDeps) {
      return FrameworkEnum.REACT_VITE;
    }
    return FrameworkEnum.REACT_GENERIC;
  }

  return FrameworkEnum.REACT_GENERIC;
}
