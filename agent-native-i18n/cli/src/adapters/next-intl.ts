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
  "i18n.ts",
  "i18n.js",
  "src/i18n.ts",
  "src/i18n.js",
  "src/i18n/request.ts",
  "src/i18n/request.js",
  "i18n/request.ts",
  "i18n/request.js",
];

const MIDDLEWARE_CANDIDATES = [
  "middleware.ts",
  "middleware.js",
  "src/middleware.ts",
  "src/middleware.js",
];

const MESSAGES_DIR_CANDIDATES = [
  "messages",
  "src/messages",
  "locales",
  "src/locales",
];

export function detectNextIntl(root: string): NextIntlInfo {
  const result: NextIntlInfo = {
    installed: false,
    version: null,
    configPath: null,
    messagesDir: null,
    middlewareConfigured: false,
  };

  const pkgPath = path.join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const raw = readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(raw) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
      const version = pkg.dependencies?.["next-intl"] ?? pkg.devDependencies?.["next-intl"] ?? null;
      if (version) {
        result.installed = true;
        result.version = version;
      }
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

  for (const candidate of MIDDLEWARE_CANDIDATES) {
    const fullPath = path.join(root, candidate);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, "utf-8");
        if (content.includes("next-intl") || content.includes("createMiddleware")) {
          result.middlewareConfigured = true;
        }
      } catch {
        // Skip
      }
      break;
    }
  }

  for (const candidate of MESSAGES_DIR_CANDIDATES) {
    if (existsSync(path.join(root, candidate))) {
      result.messagesDir = candidate;
      break;
    }
  }

  return result;
}
