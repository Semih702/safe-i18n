import { Command } from "commander";
import chalk from "chalk";
import path from "node:path";
import { loadConfig } from "../../core/config.js";
import { scanProject } from "../../core/scanner.js";
import { createMigrationPlan } from "../../core/planner.js";
import { groupByFile, transformFileSource } from "../../codemod/transforms.js";
import {
  readFileContent,
  writeFileContent,
  fileExists,
  readJsonFile,
} from "../../utils/fs.js";
import { createProvider } from "../../llm/provider.js";
import type { TranslationRequest } from "../../llm/provider.js";
import { generateMessageFiles, mergeMessages } from "../../adapters/next-intl/messages.js";
import { loadManifest, saveManifest } from "../../core/manifest.js";
import { logger, summary } from "../../utils/logger.js";
import { getProjectRoot, getManifestPath, resolveFromRoot } from "../../utils/paths.js";
import type { MigrationEntry, ApplyManifest, ManifestOperation, FileBackup } from "../../core/types.js";
import type { FilterEntry } from "../../llm/provider.js";

export const syncCommand = new Command("sync")
  .description(
    "Scan for new untranslated strings added after initial migration, transform them, and translate to all existing locales",
  )
  .option("--api-key-env <name>", "environment variable name that holds the API key")
  .option("--provider <name>", "LLM provider")
  .option("--model <model>", "LLM model name")
  .option("--base-url <url>", "LLM API base URL")
  .option("--dry-run", "preview changes without writing files")
  .action(
    async (options: {
      apiKeyEnv?: string;
      provider?: string;
      model?: string;
      baseUrl?: string;
      dryRun?: boolean;
    }) => {
      const root = getProjectRoot();
      const config = await loadConfig(root);

      const messagesDir = path.join(root, config.i18n.messagesPath);
      const sourceFile = path.join(messagesDir, `${config.sourceLocale}.json`);

      if (!(await fileExists(sourceFile))) {
        logger.error(
          `Source messages file not found: ${sourceFile}\nRun ${chalk.bold("safe-i18n migrate")} first.`,
        );
        process.exit(1);
      }

      const existingLocales: string[] = [];
      for (const locale of config.targetLocales) {
        const localeFile = path.join(messagesDir, `${locale}.json`);
        if (await fileExists(localeFile)) {
          existingLocales.push(locale);
        }
      }

      if (existingLocales.length === 0) {
        logger.error(
          `No translated locale files found.\nRun ${chalk.bold("safe-i18n migrate --to <locales>")} first.`,
        );
        process.exit(1);
      }

      // ── Step 1: Scan ─────────────────────────────────────────────
      console.log("");
      logger.info(chalk.bold("Step 1/5: Scanning for new untranslated strings..."));

      const scanResult = await scanProject(root, config);

      if (scanResult.candidates.length === 0) {
        console.log("");
        logger.success("Everything is up to date — no new strings found.");
        return;
      }

      logger.success(
        `Found ${chalk.bold(String(scanResult.candidates.length))} new untranslated string(s).`,
      );

      // ── Step 2: LLM Pre-filter ──────────────────────────────────
      console.log("");
      logger.info(chalk.bold("Step 2/5: Pre-filtering strings with LLM..."));

      const plan = createMigrationPlan(scanResult, config);

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

      if (provider.filterTranslatable) {
        const filterEntries: FilterEntry[] = plan.entries
          .filter((e) => e.action !== "skip")
          .map((e) => ({
            id: e.candidateId,
            text: e.sourceValue,
            filePath: e.candidate.filePath,
            component: e.candidate.component ?? undefined,
            parentElement: e.candidate.parentElement ?? undefined,
          }));

        const filterResults = await provider.filterTranslatable(filterEntries);
        let skippedByLlm = 0;

        for (const result of filterResults) {
          if (!result.shouldTranslate) {
            const entry = plan.entries.find((e) => e.candidateId === result.id);
            if (entry && entry.action !== "skip") {
              entry.action = "skip";
              skippedByLlm++;
              logger.info(`  Skip: ${chalk.dim(entry.sourceValue)}${result.reason ? ` (${result.reason})` : ""}`);
            }
          }
        }

        if (skippedByLlm > 0) {
          logger.success(`LLM pre-filter skipped ${chalk.bold(String(skippedByLlm))} non-translatable string(s).`);
        } else {
          logger.success("All strings confirmed as translatable.");
        }
      } else {
        logger.info("Provider does not support pre-filtering, skipping.");
      }

      // ── Step 3: Transform ────────────────────────────────────────
      console.log("");
      logger.info(chalk.bold("Step 3/5: Applying code transforms..."));

      for (const entry of plan.entries) {
        if (entry.action === "review") {
          entry.action = "apply";
        }
      }

      const fileGroups = groupByFile(plan.entries);
      let totalApplied = 0;
      const backups: FileBackup[] = [];

      for (const group of fileGroups) {
        const filePath = resolveFromRoot(root, group.filePath);
        let source: string;
        try {
          source = await readFileContent(filePath);
        } catch {
          continue;
        }

        const result = transformFileSource(source, group.entries, false);
        totalApplied += result.applied.length;

        if (result.applied.length > 0) {
          backups.push({
            filePath: group.filePath,
            originalContent: source,
            modifiedContent: result.code,
            timestamp: new Date().toISOString(),
          });

          if (!options.dryRun) {
            await writeFileContent(filePath, result.code);
            logger.success(`  ${chalk.bold(group.filePath)}: ${result.applied.length} applied`);
          }
        }
      }

      // Push sync operation onto manifest stack
      if (backups.length > 0 && !options.dryRun) {
        const existingManifest = await loadManifest(root);
        const operation: ManifestOperation = {
          type: "sync",
          appliedAt: new Date().toISOString(),
          backups,
          appliedEntries: backups.flatMap((b) =>
            plan.entries
              .filter((e) => e.candidate.filePath === b.filePath && e.action === "apply")
              .map((e) => e.candidateId),
          ),
          skippedEntries: plan.entries
            .filter((e) => e.action !== "apply")
            .map((e) => e.candidateId),
          generatedFiles: [],
        };
        const manifest: ApplyManifest = {
          version: "1.0.0",
          operations: [...(existingManifest?.operations ?? []), operation],
        };
        await saveManifest(root, manifest);
      }

      logger.success(`Applied ${chalk.bold(String(totalApplied))} new transform(s).`);

      // ── Step 4: Update source messages ───────────────────────────
      console.log("");
      logger.info(chalk.bold("Step 4/5: Updating source messages..."));

      const existingSource = await readJsonFile<Record<string, unknown>>(sourceFile);

      const newMessagesResult = await generateMessageFiles({
        root,
        messagesPath: config.i18n.messagesPath,
        sourceLocale: config.sourceLocale,
        entries: plan.entries,
      });

      const newSource = await readJsonFile<Record<string, unknown>>(sourceFile);
      const mergedSource = mergeMessages(existingSource, newSource);

      if (!options.dryRun) {
        const content = JSON.stringify(mergedSource, null, 2) + "\n";
        await writeFileContent(sourceFile, content);
      }

      logger.success(`Updated ${config.sourceLocale}.json with ${newMessagesResult.keyCount} new key(s).`);

      // ── Step 5: Translate ────────────────────────────────────────
      console.log("");
      logger.info(chalk.bold("Step 5/5: Translating new strings..."));
      logger.info(`Provider: ${chalk.cyan(provider.name)}`);

      const translatableEntries = plan.entries.filter((e) => e.action !== "skip");
      let totalTranslations = 0;

      for (const locale of existingLocales) {
        logger.info(`  Translating to ${chalk.cyan(locale)}...`);
        const existingLocaleFile = path.join(messagesDir, `${locale}.json`);
        const existingMessages = await readJsonFile<Record<string, unknown>>(existingLocaleFile);

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
          translatedEntries.push({ ...entry, sourceValue: result.translatedText });
        }

        const allEntries: MigrationEntry[] = plan.entries.map((entry) => {
          const translated = translatedEntries.find(
            (te) => te.candidateId === entry.candidateId,
          );
          return translated ?? entry;
        });

        await generateMessageFiles({
          root,
          messagesPath: config.i18n.messagesPath,
          sourceLocale: locale,
          entries: allEntries,
        });

        const newLocaleMessages = await readJsonFile<Record<string, unknown>>(existingLocaleFile);
        const mergedLocale = mergeMessages(existingMessages, newLocaleMessages);

        if (!options.dryRun) {
          const content = JSON.stringify(mergedLocale, null, 2) + "\n";
          await writeFileContent(existingLocaleFile, content);
        }

        logger.success(`  ${chalk.cyan(locale)}: ${translatedEntries.length} key(s) translated`);
      }

      // ── Summary ──────────────────────────────────────────────────
      console.log("");
      console.log(chalk.bold.green("✓ Sync complete!"));
      console.log("");

      summary({
        "New strings found": scanResult.candidates.length,
        "Transforms applied": totalApplied,
        "Translations generated": totalTranslations,
        "Locales updated": existingLocales.join(", "),
      });

      if (options.dryRun) {
        console.log("");
        logger.info(chalk.yellow("DRY RUN — no files were written."));
      }
    },
  );
