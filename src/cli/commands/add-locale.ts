import { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import { loadConfig } from "../../core/config.js";
import { createProvider } from "../../llm/provider.js";
import type {
  TranslationProvider,
  TranslationRequest,
  TranslationResult,
} from "../../llm/provider.js";
import { readJsonFile, writeJsonFile, fileExists } from "../../utils/fs.js";
import { mergeMessages } from "../../adapters/next-intl/messages.js";
import { logger, summary } from "../../utils/logger.js";
import { getProjectRoot } from "../../utils/paths.js";

const DEFAULT_BATCH_SIZE = 50;

function flattenMessages(obj: Record<string, unknown>, prefix = ""): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result.set(fullKey, value);
    } else if (typeof value === "object" && value !== null) {
      const nested = flattenMessages(value as Record<string, unknown>, fullKey);
      for (const [k, v] of nested) {
        result.set(k, v);
      }
    }
  }
  return result;
}

function setNestedKey(obj: Record<string, unknown>, key: string, value: string): void {
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
  batchSize?: number;
}

interface TranslationWorkItem {
  key: string;
  request: TranslationRequest;
}

function parseBatchSize(value: string | undefined): number {
  if (value === undefined) return DEFAULT_BATCH_SIZE;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("--batch-size must be a positive integer");
  }

  return parsed;
}

async function translateBatch(
  provider: TranslationProvider,
  batch: TranslationWorkItem[],
): Promise<TranslationResult[]> {
  const requests = batch.map((item) => item.request);

  if (provider.translateBatch) {
    const results = await provider.translateBatch(requests);
    if (results.length === batch.length) {
      return results;
    }

    logger.warn(
      `Batch provider returned ${results.length} result(s) for ${batch.length} request(s); falling back to single translations.`,
    );
  }

  const results: TranslationResult[] = [];
  for (const request of requests) {
    results.push(await provider.translate(request));
  }

  return results;
}

export async function addLocales(
  options: AddLocaleOptions,
): Promise<{ totalTranslations: number; localesAdded: string[] }> {
  const { root, sourceLocale, targetLocales, messagesPath, provider } = options;
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const sourceFile = path.join(root, messagesPath, `${sourceLocale}.json`);

  if (!(await fileExists(sourceFile))) {
    throw new Error(`Source messages file not found: ${sourceFile}`);
  }

  const sourceMessages = await readJsonFile<Record<string, unknown>>(sourceFile);
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

    const toTranslate = [...sourceEntries].filter(([key]) => !existingFlat.has(key));

    if (toTranslate.length === 0) {
      logger.info(`  ${chalk.cyan(locale)}: already up to date`);
      continue;
    }

    logger.info(
      `  Translating ${chalk.bold(String(toTranslate.length))} keys to ${chalk.cyan(locale)}...`,
    );

    logger.info(`  Batch size: ${chalk.cyan(String(batchSize))} key(s) per request`);

    const translated: Record<string, unknown> = {};
    const workItems: TranslationWorkItem[] = toTranslate.map(([key, value]) => ({
      key,
      request: {
        sourceLocale,
        targetLocale: locale,
        sourceText: value,
        description: `Translation key: ${key}`,
        filePath: `${messagesPath}/${sourceLocale}.json`,
        variables: [],
        preserveTokens: [],
      },
    }));
    const totalBatches = Math.ceil(workItems.length / batchSize);

    for (let start = 0; start < workItems.length; start += batchSize) {
      const batch = workItems.slice(start, start + batchSize);
      const batchNumber = Math.floor(start / batchSize) + 1;
      logger.info(
        `    Batch ${batchNumber}/${totalBatches}: translating ${batch.length} key(s)...`,
      );

      const results = await translateBatch(provider, batch);

      for (let index = 0; index < batch.length; index++) {
        const item = batch[index];
        const result = results[index];
        if (!item || !result) {
          continue;
        }

        setNestedKey(translated, item.key, result.translatedText);
        totalTranslations++;
      }
    }

    const merged = mergeMessages(existing, translated);
    await writeJsonFile(targetFile, merged);
    localesAdded.push(locale);
    logger.success(`  ${chalk.cyan(locale)}: ${toTranslate.length} keys translated`);
  }

  return { totalTranslations, localesAdded };
}

export const addLocaleCommand = new Command("add-locale")
  .description("Add new target locale(s) to an already-migrated project")
  .requiredOption("--to <locales>", "comma-separated target locale codes (e.g. fr,es,ja)")
  .option("--api-key-env <name>", "environment variable name that holds the API key")
  .option("--provider <name>", "LLM provider")
  .option("--model <model>", "LLM model name")
  .option("--base-url <url>", "LLM API base URL")
  .option(
    "--batch-size <size>",
    `number of keys per translation request (default: ${DEFAULT_BATCH_SIZE})`,
  )
  .action(
    async (options: {
      to: string;
      apiKeyEnv?: string;
      provider?: string;
      model?: string;
      baseUrl?: string;
      batchSize?: string;
    }) => {
      const root = getProjectRoot();
      const config = await loadConfig(root);
      let batchSize: number;

      try {
        batchSize = parseBatchSize(options.batchSize);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }

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

      const sourceFile = path.join(root, config.i18n.messagesPath, `${config.sourceLocale}.json`);

      if (!(await fileExists(sourceFile))) {
        logger.error(`Source messages file not found: ${chalk.bold(sourceFile)}`);
        logger.error(`Run ${chalk.bold("safe-i18n migrate")} first to create the source messages.`);
        process.exit(1);
      }

      const sourceMessages = await readJsonFile<Record<string, unknown>>(sourceFile);
      const sourceKeys = flattenMessages(sourceMessages);

      const alreadyComplete: string[] = [];
      const hasPartial: string[] = [];
      const brandNew: string[] = [];

      for (const locale of targetLocales) {
        if (locale === config.sourceLocale) {
          logger.error(`Cannot add source locale ${chalk.bold(locale)} as a target locale.`);
          process.exit(1);
        }

        const targetFile = path.join(root, config.i18n.messagesPath, `${locale}.json`);

        if (await fileExists(targetFile)) {
          const existing = await readJsonFile<Record<string, unknown>>(targetFile);
          const existingKeys = flattenMessages(existing);
          const missingKeys = [...sourceKeys].filter(([key]) => !existingKeys.has(key));

          if (missingKeys.length === 0) {
            alreadyComplete.push(locale);
          } else {
            hasPartial.push(locale);
          }
        } else {
          brandNew.push(locale);
        }
      }

      if (alreadyComplete.length > 0) {
        logger.warn(
          `Locale(s) already fully translated: ${chalk.bold(alreadyComplete.join(", "))}`,
        );
      }
      if (hasPartial.length > 0) {
        logger.info(
          `Locale(s) with partial translations (missing keys will be added): ${chalk.cyan(hasPartial.join(", "))}`,
        );
      }
      if (brandNew.length > 0) {
        logger.info(`New locale(s) to translate: ${chalk.cyan(brandNew.join(", "))}`);
      }

      if (alreadyComplete.length === targetLocales.length) {
        logger.success("All requested locales are already fully translated. Nothing to do.");
        logger.info(`To re-translate, delete the locale file(s) and run this command again.`);
        return;
      }

      const localesToProcess = [...hasPartial, ...brandNew];

      if (alreadyComplete.length > 0 && localesToProcess.length > 0) {
        logger.info(
          `Skipping fully translated locale(s): ${chalk.dim(alreadyComplete.join(", "))}`,
        );
        console.log("");
      }

      logger.info(chalk.bold(`Adding locale(s): ${localesToProcess.join(", ")}`));
      logger.info(`Provider: ${chalk.cyan(provider.name)}`);

      const result = await addLocales({
        root,
        sourceLocale: config.sourceLocale,
        targetLocales: localesToProcess,
        messagesPath: config.i18n.messagesPath,
        provider,
        batchSize,
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
