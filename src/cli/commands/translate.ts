import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../../core/config.js";
import { loadMigrationPlan } from "../../core/manifest.js";
import { createProvider } from "../../llm/provider.js";
import type { TranslationRequest } from "../../llm/provider.js";
import { generateMessageFiles } from "../../adapters/next-intl/messages.js";
import { logger, summary } from "../../utils/logger.js";
import { getProjectRoot, getMigrationPlanPath } from "../../utils/paths.js";
import type { MigrationEntry } from "../../core/types.js";

export const translateCommand = new Command("translate")
  .description("Generate translations for target locales using an LLM provider")
  .requiredOption("--to <locales>", "comma-separated target locales")
  .option("--provider <name>", "LLM provider to use")
  .action(async (options: { to: string; provider?: string }) => {
    const root = getProjectRoot();
    const config = await loadConfig(root);

    const plan = await loadMigrationPlan(root);
    if (!plan) {
      logger.error(
        `No migration plan found at ${chalk.bold(getMigrationPlanPath(root))}`,
      );
      logger.error(
        `Run ${chalk.bold("safe-i18n plan")} first to create a migration plan.`,
      );
      process.exit(1);
    }

    const targetLocales = options.to.split(/[\s,]+/).map((l) => l.trim()).filter(Boolean);
    if (targetLocales.length === 0) {
      logger.error("No target locales specified. Use --to <locales>.");
      process.exit(1);
    }

    const providerName = options.provider ?? config.llm?.provider ?? "mock";
    const provider = createProvider({
      provider: providerName,
      model: config.llm?.model,
      baseUrl: config.llm?.baseUrl,
      apiKeyEnv: config.llm?.apiKeyEnv,
    });

    logger.info(`Using translation provider: ${chalk.cyan(provider.name)}`);

    const translatableEntries = plan.entries.filter(
      (entry) => entry.action !== "skip",
    );

    if (translatableEntries.length === 0) {
      logger.warn("No translatable entries found in the migration plan.");
      return;
    }

    // Generate source locale message file
    logger.info(`Generating source locale file (${chalk.cyan(config.sourceLocale)})...`);
    const sourceResult = await generateMessageFiles({
      root,
      messagesPath: config.i18n.messagesPath,
      sourceLocale: config.sourceLocale,
      entries: plan.entries,
    });

    const allGeneratedFiles = [...sourceResult.files];
    let totalTranslations = 0;

    // Translate and generate files for each target locale
    for (const locale of targetLocales) {
      logger.info(`Translating to ${chalk.cyan(locale)}...`);

      const translatedEntries: MigrationEntry[] = [];

      for (const entry of translatableEntries) {
        const request: TranslationRequest = {
          sourceLocale: config.sourceLocale,
          targetLocale: locale,
          sourceText: entry.sourceValue,
          description: entry.candidate.description,
          component: entry.candidate.component ?? undefined,
          filePath: entry.candidate.filePath,
          variables: entry.candidate.variables,
          preserveTokens: entry.candidate.variables.map((v) => `{${v}}`),
        };

        const result = await provider.translate(request);
        totalTranslations++;

        translatedEntries.push({
          ...entry,
          sourceValue: result.translatedText,
        });
      }

      // Also include skipped entries as-is so file structure is complete
      const allEntries: MigrationEntry[] = plan.entries.map((entry) => {
        const translated = translatedEntries.find(
          (te) => te.candidateId === entry.candidateId,
        );
        return translated ?? entry;
      });

      const localeResult = await generateMessageFiles({
        root,
        messagesPath: config.i18n.messagesPath,
        sourceLocale: locale,
        entries: allEntries,
      });

      allGeneratedFiles.push(...localeResult.files);
    }

    summary({
      "Source locale": config.sourceLocale,
      "Target locales": targetLocales.join(", "),
      "Entries translated": totalTranslations,
      "Files generated": allGeneratedFiles.length,
    });

    for (const file of allGeneratedFiles) {
      logger.success(`Generated ${chalk.bold(file)}`);
    }

    console.log("");
    logger.info(
      `Next step: run ${chalk.bold("safe-i18n validate")} to check for issues.`,
    );
  });
