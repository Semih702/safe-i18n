import { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import { loadConfig } from "../../core/config.js";
import { createProvider } from "../../llm/provider.js";
import type { TranslationRequest } from "../../llm/provider.js";
import { readJsonFile, writeJsonFile, fileExists } from "../../utils/fs.js";
import { mergeMessages } from "../../adapters/next-intl/messages.js";
import { logger, summary } from "../../utils/logger.js";
import { getProjectRoot } from "../../utils/paths.js";

function flattenMessages(
  obj: Record<string, unknown>,
  prefix = "",
): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result.set(fullKey, value);
    } else if (typeof value === "object" && value !== null) {
      const nested = flattenMessages(
        value as Record<string, unknown>,
        fullKey,
      );
      for (const [k, v] of nested) {
        result.set(k, v);
      }
    }
  }
  return result;
}

function setNestedKey(
  obj: Record<string, unknown>,
  key: string,
  value: string,
): void {
  const parts = key.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (current[part] === undefined || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]!] = value;
}

export interface AddLocaleOptions {
  root: string;
  sourceLocale: string;
  targetLocales: string[];
  messagesPath: string;
  provider: ReturnType<typeof createProvider>;
}

export async function addLocales(
  options: AddLocaleOptions,
): Promise<{ totalTranslations: number; localesAdded: string[] }> {
  const { root, sourceLocale, targetLocales, messagesPath, provider } = options;
  const sourceFile = path.join(root, messagesPath, `${sourceLocale}.json`);

  if (!(await fileExists(sourceFile))) {
    throw new Error(
      `Source messages file not found: ${sourceFile}`,
    );
  }

  const sourceMessages = await readJsonFile<Record<string, unknown>>(
    sourceFile,
  );
  const sourceEntries = flattenMessages(sourceMessages);

  let totalTranslations = 0;
  const localesAdded: string[] = [];

  for (const locale of targetLocales) {
    const targetFile = path.join(root, messagesPath, `${locale}.json`);
    let existing: Record<string, unknown> = {};
    let existingFlat = new Map<string, string>();

    if (await fileExists(targetFile)) {
      existing = await readJsonFile<Record<string, unknown>>(targetFile);
      existingFlat = flattenMessages(existing);
    }

    const toTranslate = [...sourceEntries].filter(
      ([key]) => !existingFlat.has(key),
    );

    if (toTranslate.length === 0) {
      logger.info(`  ${chalk.cyan(locale)}: already up to date`);
      continue;
    }

    logger.info(
      `  Translating ${chalk.bold(String(toTranslate.length))} keys to ${chalk.cyan(locale)}...`,
    );

    const translated: Record<string, unknown> = {};

    for (const [key, value] of toTranslate) {
      const request: TranslationRequest = {
        sourceLocale,
        targetLocale: locale,
        sourceText: value,
        description: `Translation key: ${key}`,
        filePath: `messages/${sourceLocale}.json`,
        variables: [],
        preserveTokens: [],
      };
      const result = await provider.translate(request);
      setNestedKey(translated, key, result.translatedText);
      totalTranslations++;
    }

    const merged = mergeMessages(existing, translated);
    await writeJsonFile(targetFile, merged);
    localesAdded.push(locale);
    logger.success(`  ${chalk.cyan(locale)}: ${toTranslate.length} keys translated`);
  }

  return { totalTranslations, localesAdded };
}

export const addLocaleCommand = new Command("add-locale")
  .description(
    "Add new target locale(s) to an already-migrated project",
  )
  .requiredOption(
    "--to <locales>",
    "comma-separated target locale codes (e.g. fr,es,ja)",
  )
  .option(
    "--api-key-env <name>",
    "environment variable name that holds the API key",
  )
  .option("--provider <name>", "LLM provider")
  .option("--model <model>", "LLM model name")
  .option("--base-url <url>", "LLM API base URL")
  .action(
    async (options: {
      to: string;
      apiKeyEnv?: string;
      provider?: string;
      model?: string;
      baseUrl?: string;
    }) => {
      const root = getProjectRoot();
      const config = await loadConfig(root);

      const targetLocales = options.to
        .split(/[\s,]+/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (targetLocales.length === 0) {
        logger.error("No target locales specified. Use --to <locales>.");
        process.exit(1);
      }

      const providerName =
        options.provider ??
        config.llm?.provider ??
        (options.apiKeyEnv ? "openai-compatible" : "mock");

      const provider = createProvider({
        provider: providerName,
        model: options.model ?? config.llm?.model,
        baseUrl: options.baseUrl ?? config.llm?.baseUrl ?? "https://api.openai.com/v1",
        apiKeyEnv: options.apiKeyEnv ?? config.llm?.apiKeyEnv,
      });

      console.log("");
      logger.info(
        chalk.bold(`Adding locale(s): ${targetLocales.join(", ")}`),
      );
      logger.info(`Provider: ${chalk.cyan(provider.name)}`);

      const result = await addLocales({
        root,
        sourceLocale: config.sourceLocale,
        targetLocales,
        messagesPath: config.i18n.messagesPath,
        provider,
      });

      console.log("");
      if (result.localesAdded.length > 0) {
        summary({
          "Locales added": result.localesAdded.join(", "),
          "Keys translated": result.totalTranslations,
        });
      } else {
        logger.info("All target locales are already up to date.");
      }
    },
  );
