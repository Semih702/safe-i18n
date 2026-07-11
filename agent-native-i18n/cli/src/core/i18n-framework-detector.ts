import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { I18nFrameworkInfo, I18nFramework } from "../types.js";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface FrameworkSpec {
  name: I18nFramework;
  packages: string[];
  configCandidates: string[];
}

const FRAMEWORKS: FrameworkSpec[] = [
  {
    name: "next-intl",
    packages: ["next-intl"],
    configCandidates: [
      "i18n.ts",
      "i18n.js",
      "src/i18n.ts",
      "src/i18n.js",
      "src/i18n/request.ts",
      "src/i18n/request.js",
      "i18n/request.ts",
      "i18n/request.js",
    ],
  },
  {
    name: "react-i18next",
    packages: ["react-i18next", "i18next"],
    configCandidates: [
      "i18n.ts",
      "i18n.js",
      "src/i18n.ts",
      "src/i18n.js",
      "src/i18n/index.ts",
      "src/i18n/index.js",
      "src/i18n/config.ts",
      "src/i18n/config.js",
    ],
  },
  {
    name: "react-intl",
    packages: ["react-intl"],
    configCandidates: [
      "src/i18n.ts",
      "src/i18n.js",
      "src/intl.ts",
      "src/intl.js",
    ],
  },
  {
    name: "i18next",
    packages: ["i18next"],
    configCandidates: [
      "i18n.ts",
      "i18n.js",
      "src/i18n.ts",
      "src/i18n.js",
      "i18next.config.ts",
      "i18next.config.js",
    ],
  },
  {
    name: "lingui",
    packages: ["@lingui/core", "@lingui/react"],
    configCandidates: [
      "lingui.config.ts",
      "lingui.config.js",
      ".linguirc",
    ],
  },
];

export function detectI18nFramework(root: string): I18nFrameworkInfo {
  const pkgJson = readPackageJson(root);
  const allDeps: Record<string, string> = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
  };

  for (const fw of FRAMEWORKS) {
    const installedPkg = fw.packages.find((pkg) => pkg in allDeps);
    if (!installedPkg) continue;

    const version = allDeps[installedPkg] ?? null;
    let configPath: string | null = null;

    for (const candidate of fw.configCandidates) {
      const fullPath = path.join(root, candidate);
      if (existsSync(fullPath)) {
        configPath = candidate;
        break;
      }
    }

    return {
      name: fw.name,
      version,
      configExists: configPath !== null,
      configPath,
    };
  }

  return {
    name: null,
    version: null,
    configExists: false,
    configPath: null,
  };
}

function readPackageJson(root: string): PackageJson {
  const pkgPath = path.join(root, "package.json");
  if (existsSync(pkgPath)) {
    const raw = readFileSync(pkgPath, "utf-8");
    return JSON.parse(raw) as PackageJson;
  }
  return {};
}
