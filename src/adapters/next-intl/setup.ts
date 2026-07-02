import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { ensureDir, fileExists } from "../../utils/fs.js";

export interface SetupOptions {
  root: string;
  sourceLocale: string;
  packageManager?: "npm" | "yarn" | "pnpm" | "bun";
}

export async function setupNextIntl(options: SetupOptions): Promise<string[]> {
  const { root, sourceLocale, packageManager = "npm" } = options;
  const createdFiles: string[] = [];

  const installed = await installNextIntl(root, packageManager);
  if (installed) createdFiles.push("next-intl (installed)");

  const i18nDir = path.join(root, "i18n");
  await ensureDir(i18nDir);

  const requestTsPath = path.join(i18nDir, "request.ts");
  const requestTs = [
    'import { getRequestConfig } from "next-intl/server";',
    "",
    "export default getRequestConfig(async () => {",
    `  const locale = "${sourceLocale}";`,
    "  return {",
    "    locale,",
    "    messages: (await import(`../messages/${locale}.json`)).default,",
    "  };",
    "});",
    "",
  ].join("\n");

  await writeFile(requestTsPath, requestTs, "utf-8");
  createdFiles.push("i18n/request.ts");

  const configUpdated = await updateNextConfig(root);
  if (configUpdated) createdFiles.push("next.config (updated)");

  const layoutUpdated = await updateRootLayout(root);
  if (layoutUpdated) createdFiles.push("app/layout.tsx (updated)");

  return createdFiles;
}

async function updateNextConfig(root: string): Promise<boolean> {
  const configNames = ["next.config.ts", "next.config.mjs", "next.config.js"];

  for (const name of configNames) {
    const configPath = path.join(root, name);
    let content: string;
    try {
      content = await readFile(configPath, "utf-8");
    } catch {
      continue;
    }

    if (content.includes("next-intl")) return false;

    const isESM = name.endsWith(".mjs") || name.endsWith(".ts");

    if (isESM) {
      const importLine = 'import createNextIntlPlugin from "next-intl/plugin";\n\n' +
        'const withNextIntl = createNextIntlPlugin("./i18n/request.ts");\n\n';

      const simpleExport = content.match(/export\s+default\s+(\w+)\s*;?\s*$/m);
      let updated: string;
      if (simpleExport) {
        updated = importLine + content.replace(
          /export\s+default\s+(\w+)\s*;?\s*$/m,
          "export default withNextIntl($1);",
        );
      } else {
        updated = importLine + content.replace(
          /export\s+default\s+/m,
          "const _nextConfig = ",
        ) + "\nexport default withNextIntl(_nextConfig);\n";
      }
      await writeFile(configPath, updated, "utf-8");
    } else {
      const requireLine = 'const createNextIntlPlugin = require("next-intl/plugin");\n\n' +
        'const withNextIntl = createNextIntlPlugin("./i18n/request.ts");\n\n';

      const simpleExport = content.match(/module\.exports\s*=\s*(\w+)\s*;?\s*$/m);
      let updated: string;
      if (simpleExport) {
        updated = requireLine + content.replace(
          /module\.exports\s*=\s*(\w+)\s*;?\s*$/m,
          "module.exports = withNextIntl($1);",
        );
      } else {
        updated = requireLine + content.replace(
          /module\.exports\s*=\s*/m,
          "const _nextConfig = ",
        ) + "\nmodule.exports = withNextIntl(_nextConfig);\n";
      }
      await writeFile(configPath, updated, "utf-8");
    }
    return true;
  }

  return false;
}

async function updateRootLayout(root: string): Promise<boolean> {
  const extensions = ["tsx", "jsx", "ts", "js"];

  for (const ext of extensions) {
    const layoutPath = path.join(root, "app", `layout.${ext}`);
    let content: string;
    try {
      content = await readFile(layoutPath, "utf-8");
    } catch {
      continue;
    }

    if (content.includes("getLocale")) return false;

    const serverImport = 'import { getLocale, getMessages } from "next-intl/server";';
    const clientImport = 'import { NextIntlClientProvider } from "next-intl";';
    const importRegex = /^(import\s+.+)$/gm;
    const imports = [...content.matchAll(importRegex)];

    if (imports.length > 0) {
      const lastImport = imports[imports.length - 1]![0];
      content = content.replace(
        lastImport,
        lastImport + "\n" + clientImport + "\n" + serverImport,
      );
    } else {
      content = clientImport + "\n" + serverImport + "\n" + content;
    }

    content = content.replace(
      /export\s+default\s+(async\s+)?function\s+(\w+)\s*\(/,
      "export default async function $2(",
    );

    content = content.replace(
      /(export\s+default\s+async\s+function\s+\w+\s*\([^)]*\)\s*\{)/,
      "$1\n  const locale = await getLocale();\n  const messages = await getMessages();\n",
    );

    content = content.replace(/lang="[^"]*"/, "lang={locale}");

    content = content.replace(
      /(<body[^>]*>)([\s\S]*?)(<\/body>)/,
      "$1\n        <NextIntlClientProvider messages={messages}>$2</NextIntlClientProvider>\n      $3",
    );

    await writeFile(layoutPath, content, "utf-8");
    return true;
  }

  return false;
}

async function installNextIntl(
  root: string,
  packageManager: string,
): Promise<boolean> {
  const pkgPath = path.join(root, "package.json");
  if (!(await fileExists(pkgPath))) return false;

  const pkgContent = await readFile(pkgPath, "utf-8");
  if (pkgContent.includes('"next-intl"')) return false;

  const commands: Record<string, string> = {
    npm: "npm install next-intl",
    yarn: "yarn add next-intl",
    pnpm: "pnpm add next-intl",
    bun: "bun add next-intl",
  };

  const cmd = commands[packageManager] ?? commands["npm"]!;
  try {
    execSync(cmd, { cwd: root, stdio: "pipe" });
  } catch {
    if (packageManager !== "npm") {
      execSync(commands["npm"]!, { cwd: root, stdio: "pipe" });
    } else {
      throw new Error(`Failed to install next-intl with ${packageManager}`);
    }
  }
  return true;
}
