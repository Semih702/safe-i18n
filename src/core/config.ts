import path from "node:path";

import type { SafeI18nConfig } from "./types.js";
import { SafeI18nConfigSchema } from "./types.js";
import {
  fileExists,
  readFileContent,
  writeFileContent,
} from "../utils/fs.js";

const CONFIG_FILENAME = "safe-i18n.config.json";

function getConfigPath(root: string): string {
  return path.join(root, CONFIG_FILENAME);
}

export async function loadConfig(root: string): Promise<SafeI18nConfig> {
  const configPath = getConfigPath(root);

  if (await fileExists(configPath)) {
    const raw = await readFileContent(configPath);
    const parsed: unknown = JSON.parse(raw);
    return SafeI18nConfigSchema.parse(parsed);
  }

  return SafeI18nConfigSchema.parse({});
}

export async function writeConfig(
  root: string,
  config: SafeI18nConfig,
): Promise<void> {
  const configPath = getConfigPath(root);
  const content = JSON.stringify(config, null, 2) + "\n";
  await writeFileContent(configPath, content);
}
