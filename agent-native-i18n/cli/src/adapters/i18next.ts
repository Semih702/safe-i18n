import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface I18nextInfo {
  installed: boolean;
  version: string | null;
  configPath: string | null;
  localesDir: string | null;
  backends: string[];
}

const BACKEND_PACKAGES = [
  "i18next-http-backend",
  "i18next-fs-backend",
  "i18next-resources-to-backend",
  "i18next-locize-backend",
];

export function detectI18next(root: string): I18nextInfo {
  const result: I18nextInfo = {
    installed: false,
    version: null,
    configPath: null,
    localesDir: null,
    backends: [],
  };

  const pkgPath = path.join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const raw = readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(raw) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      result.version = allDeps["i18next"] ?? null;
      result.installed = result.version !== null;

      for (const backend of BACKEND_PACKAGES) {
        if (backend in allDeps) {
          result.backends.push(backend);
        }
      }
    } catch {
      // Skip
    }
  }

  const configCandidates = [
    "i18next.config.ts",
    "i18next.config.js",
    "i18n.ts",
    "i18n.js",
    "src/i18n.ts",
    "src/i18n.js",
  ];

  for (const candidate of configCandidates) {
    if (existsSync(path.join(root, candidate))) {
      result.configPath = candidate;
      break;
    }
  }

  const localeDirCandidates = [
    "locales",
    "public/locales",
    "src/locales",
    "translations",
  ];

  for (const candidate of localeDirCandidates) {
    if (existsSync(path.join(root, candidate))) {
      result.localesDir = candidate;
      break;
    }
  }

  return result;
}
