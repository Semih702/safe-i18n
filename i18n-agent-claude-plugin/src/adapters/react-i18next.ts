import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface ReactI18nextInfo {
  installed: boolean;
  version: string | null;
  i18nextVersion: string | null;
  configPath: string | null;
  localesDir: string | null;
}

export function detectReactI18next(root: string): ReactI18nextInfo {
  const result: ReactI18nextInfo = {
    installed: false, version: null, i18nextVersion: null,
    configPath: null, localesDir: null,
  };

  const pkgPath = path.join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      result.version = allDeps["react-i18next"] ?? null;
      result.i18nextVersion = allDeps["i18next"] ?? null;
      result.installed = result.version !== null || result.i18nextVersion !== null;
    } catch { /* skip */ }
  }

  for (const c of [
    "i18n.ts", "i18n.js", "src/i18n.ts", "src/i18n.js",
    "src/i18n/index.ts", "src/i18n/index.js",
    "src/i18n/config.ts", "src/i18n/config.js",
  ]) {
    if (existsSync(path.join(root, c))) { result.configPath = c; break; }
  }

  for (const d of ["locales", "src/locales", "public/locales", "translations", "src/translations"]) {
    if (existsSync(path.join(root, d))) { result.localesDir = d; break; }
  }

  return result;
}
