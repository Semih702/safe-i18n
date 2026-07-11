import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface VueI18nInfo {
  installed: boolean;
  version: string | null;
  configPath: string | null;
  localesDir: string | null;
  isNuxtI18n: boolean;
}

export function detectVueI18n(root: string): VueI18nInfo {
  const result: VueI18nInfo = {
    installed: false, version: null, configPath: null,
    localesDir: null, isNuxtI18n: false,
  };

  const pkgPath = path.join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      result.version = allDeps["vue-i18n"] ?? allDeps["@intlify/vue-i18n"] ?? null;
      result.installed = result.version !== null;
      if ("@nuxtjs/i18n" in allDeps) result.isNuxtI18n = true;
    } catch { /* skip */ }
  }

  for (const c of [
    "src/i18n.ts", "src/i18n.js",
    "src/i18n/index.ts", "src/i18n/index.js",
    "src/plugins/i18n.ts", "src/plugins/i18n.js",
    "i18n.config.ts", "i18n.config.js",
  ]) {
    if (existsSync(path.join(root, c))) { result.configPath = c; break; }
  }

  for (const d of ["locales", "src/locales", "assets/locales", "src/i18n/locales"]) {
    if (existsSync(path.join(root, d))) { result.localesDir = d; break; }
  }

  return result;
}
