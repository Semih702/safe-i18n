import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface ReactI18nextInfo {
  installed: boolean;
  version: string | null;
  i18nextVersion: string | null;
  configPath: string | null;
  localesDir: string | null;
}

const CONFIG_CANDIDATES = [
  "i18n.ts",
  "i18n.js",
  "src/i18n.ts",
  "src/i18n.js",
  "src/i18n/index.ts",
  "src/i18n/index.js",
  "src/i18n/config.ts",
  "src/i18n/config.js",
];

const LOCALE_DIR_CANDIDATES = [
  "locales",
  "src/locales",
  "public/locales",
  "translations",
  "src/translations",
  "lang",
  "src/lang",
];

export function detectReactI18next(root: string): ReactI18nextInfo {
  const result: ReactI18nextInfo = {
    installed: false,
    version: null,
    i18nextVersion: null,
    configPath: null,
    localesDir: null,
  };

  const pkgPath = path.join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const raw = readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(raw) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      result.version = allDeps["react-i18next"] ?? null;
      result.i18nextVersion = allDeps["i18next"] ?? null;
      result.installed = result.version !== null || result.i18nextVersion !== null;
    } catch {
      // Skip
    }
  }

  for (const candidate of CONFIG_CANDIDATES) {
    if (existsSync(path.join(root, candidate))) {
      result.configPath = candidate;
      break;
    }
  }

  for (const candidate of LOCALE_DIR_CANDIDATES) {
    if (existsSync(path.join(root, candidate))) {
      result.localesDir = candidate;
      break;
    }
  }

  return result;
}
