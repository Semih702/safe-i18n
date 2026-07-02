import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileExists } from "../../utils/fs.js";

interface NextIntlDetection {
  installed: boolean;
  version: string | null;
  configExists: boolean;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const CONFIG_CANDIDATES = [
  "i18n.ts",
  "i18n.js",
  "src/i18n.ts",
  "src/i18n.js",
  "src/i18n/request.ts",
  "src/i18n/request.js",
] as const;

export async function detectNextIntl(root: string): Promise<NextIntlDetection> {
  const result: NextIntlDetection = {
    installed: false,
    version: null,
    configExists: false,
  };

  const pkgPath = path.join(root, "package.json");
  const pkgExists = await fileExists(pkgPath);

  if (pkgExists) {
    const raw = await readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(raw) as PackageJson;

    const depVersion = pkg.dependencies?.["next-intl"];
    const devDepVersion = pkg.devDependencies?.["next-intl"];
    const version = depVersion ?? devDepVersion ?? null;

    if (version !== null) {
      result.installed = true;
      result.version = version;
    }
  }

  for (const candidate of CONFIG_CANDIDATES) {
    const fullPath = path.join(root, candidate);
    const exists = await fileExists(fullPath);
    if (exists) {
      result.configExists = true;
      break;
    }
  }

  return result;
}
