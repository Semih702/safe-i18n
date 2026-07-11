import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface I18nextInfo {
  installed: boolean;
  version: string | null;
  configPath: string | null;
  localesDir: string | null;
  backends: string[];
}

export function detectI18next(root: string): I18nextInfo {
  const result: I18nextInfo = {
    installed: false, version: null, configPath: null,
    localesDir: null, backends: [],
  };

  const pkgPath = path.join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      result.version = allDeps["i18next"] ?? null;
      result.installed = result.version !== null;
      for (const b of ["i18next-http-backend", "i18next-fs-backend", "i18next-resources-to-backend"]) {
        if (b in allDeps) result.backends.push(b);
      }
    } catch { /* skip */ }
  }

  for (const c of ["i18next.config.ts", "i18next.config.js", "i18n.ts", "i18n.js", "src/i18n.ts", "src/i18n.js"]) {
    if (existsSync(path.join(root, c))) { result.configPath = c; break; }
  }

  for (const d of ["locales", "public/locales", "src/locales", "translations"]) {
    if (existsSync(path.join(root, d))) { result.localesDir = d; break; }
  }

  return result;
}
