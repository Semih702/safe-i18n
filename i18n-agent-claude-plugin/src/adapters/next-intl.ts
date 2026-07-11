import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface NextIntlInfo {
  installed: boolean;
  version: string | null;
  configPath: string | null;
  messagesDir: string | null;
  middlewareConfigured: boolean;
}

const CONFIG_CANDIDATES = [
  "i18n.ts", "i18n.js",
  "src/i18n.ts", "src/i18n.js",
  "src/i18n/request.ts", "src/i18n/request.js",
  "i18n/request.ts", "i18n/request.js",
];

export function detectNextIntl(root: string): NextIntlInfo {
  const result: NextIntlInfo = {
    installed: false, version: null, configPath: null,
    messagesDir: null, middlewareConfigured: false,
  };

  const pkgPath = path.join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const v = pkg.dependencies?.["next-intl"] ?? pkg.devDependencies?.["next-intl"] ?? null;
      if (v) { result.installed = true; result.version = v; }
    } catch { /* skip */ }
  }

  for (const c of CONFIG_CANDIDATES) {
    if (existsSync(path.join(root, c))) { result.configPath = c; break; }
  }

  for (const mw of ["middleware.ts", "middleware.js", "src/middleware.ts", "src/middleware.js"]) {
    const fp = path.join(root, mw);
    if (existsSync(fp)) {
      try {
        const content = readFileSync(fp, "utf-8");
        if (content.includes("next-intl") || content.includes("createMiddleware"))
          result.middlewareConfigured = true;
      } catch { /* skip */ }
      break;
    }
  }

  for (const d of ["messages", "src/messages", "locales", "src/locales"]) {
    if (existsSync(path.join(root, d))) { result.messagesDir = d; break; }
  }

  return result;
}
