import { Command } from "commander";
import chalk from "chalk";
import { analyzeProject } from "../../core/project-analyzer.js";
import { writeConfig } from "../../core/config.js";
import { scanProject } from "../../core/scanner.js";
import { createMigrationPlan } from "../../core/planner.js";
import { saveMigrationPlan, saveManifest } from "../../core/manifest.js";
import { groupByFile, transformFileSource } from "../../codemod/transforms.js";
import { readFileContent, writeFileContent, fileExists } from "../../utils/fs.js";
import { createProvider } from "../../llm/provider.js";
import type { TranslationRequest } from "../../llm/provider.js";
import { addLocales } from "./add-locale.js";
import { createInterface } from "node:readline";
import { generateMessageFiles } from "../../adapters/next-intl/messages.js";
import { setupNextIntl } from "../../adapters/next-intl/setup.js";
import { validateProject } from "../../validators/project-validator.js";
import { logger, summary } from "../../utils/logger.js";
import { getProjectRoot, resolveFromRoot, getMigrationPlanPath } from "../../utils/paths.js";
import type { SafeI18nConfig, ApplyManifest, ManifestOperation, FileBackup, MigrationEntry } from "../../core/types.js";
import type { FilterEntry } from "../../llm/provider.js";

export const migrateCommand = new Command("migrate")
  .description(
    "Run the full i18n migration pipeline in one command (init → scan → plan → pre-filter → apply → translate → setup → validate)",
  )
  .requiredOption("--to <locales>", "comma-separated target locale codes (e.g. tr,de,fr)")
  .option("--source <locale>", "source locale code", "en")
  .option("--provider <name>", "LLM provider (auto-detected from --api-key-env, or mock)")
  .option("--api-key-env <name>", "environment variable name that holds the API key (e.g. OPENAI_API_KEY)")
  .option("--model <model>", "LLM model name (default: gpt-4o-mini)")
  .option("--base-url <url>", "LLM API base URL (default: https://api.openai.com/v1)")
  .option("--dry-run", "preview changes without writing files")
  .option("--allow-dirty", "skip git working tree check")
  .action(
    async (options: {
      to: string;
      source: string;
      provider?: string;
      apiKeyEnv?: string;
      model?: string;
      baseUrl?: string;
      dryRun?: boolean;
      allowDirty?: boolean;
    }) => {
      const root = getProjectRoot();
      const targetLocales = options.to
        .split(/[\s,]+/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (targetLocales.length === 0) {
        logger.error("No target locales specified. Use --to <locales>.");
        process.exit(1);
      }

      const providerName = options.provider
        ?? (options.apiKeyEnv ? "openai-compatible" : "mock");

      // ── Step 1: Init ─────────────────────────────────────────────
      console.log("");
      logger.info(chalk.bold("Step 1/8: Initializing project..."));

      const projectInfo = await analyzeProject(root);
      console.log(`  Framework: ${chalk.cyan(projectInfo.framework)}`);

      const config: SafeI18nConfig = {
        sourceLocale: options.source,
        targetLocales,
        include: [
          "src/**/*.{ts,tsx,js,jsx}",
          "app/**/*.{ts,tsx,js,jsx}",
          "components/**/*.{ts,tsx,js,jsx}",
          "pages/**/*.{ts,tsx,js,jsx}",
          "lib/**/*.{ts,tsx,js,jsx}",
        ],
        exclude: [
          "node_modules/**",
          ".next/**",
          "dist/**",
          "build/**",
          "coverage/**",
          "**/*.test.*",
          "**/*.spec.*",
          "**/*.d.ts",
          "messages/**",
          "app/api/**",
        ],
        i18n: {
          adapter: "next-intl",
          messagesPath: "messages",
          namespaceStrategy: "route-based",
        },
        validation: { commands: [] },
      };

      if (providerName !== "mock") {
        config.llm = {
          provider: providerName,
          model: options.model,
          baseUrl: options.baseUrl || "https://api.openai.com/v1",
          apiKeyEnv: options.apiKeyEnv,
          maxContextLength: 500,
          enableContextSharing: true,
        };
      }

      await writeConfig(root, config);
      logger.success("Configuration created.");

      // ── Step 2: Scan ─────────────────────────────────────────────
      console.log("");
      logger.info(chalk.bold("Step 2/8: Scanning for translatable strings..."));

      const scanResult = await scanProject(root, config);
      logger.success(
        `Found ${chalk.bold(String(scanResult.summary.totalStrings))} strings ` +
          `(${scanResult.summary.autoSafe} auto-safe, ` +
          `${scanResult.summary.reviewRequired} review, ` +
          `${scanResult.summary.skipNonUi + scanResult.summary.skipDangerous} skipped).`,
      );

      if (scanResult.candidates.length === 0) {
        const sourceMessagesFile = resolveFromRoot(root, `${config.i18n.messagesPath}/${options.source}.json`);
        if (await fileExists(sourceMessagesFile)) {
          logger.info("Project is already migrated.");

          const existingLocales: string[] = [];
          const newLocales: string[] = [];
          for (const locale of targetLocales) {
            const localeFile = resolveFromRoot(root, `${config.i18n.messagesPath}/${locale}.json`);
            if (await fileExists(localeFile)) {
              existingLocales.push(locale);
            } else {
              newLocales.push(locale);
            }
          }

          if (newLocales.length === 0) {
            console.log("");
            logger.info(
              `Existing translations found: ${chalk.cyan(existingLocales.join(", "))}`,
            );
            logger.success("All requested locales already exist. Nothing to do.");
            logger.info(
              `To add a new locale, run: ${chalk.bold("safe-i18n add-locale --to <locale>")}`,
            );
            return;
          }

          if (existingLocales.length > 0) {
            console.log("");
            logger.info(
              `Existing translations: ${chalk.cyan(existingLocales.join(", "))} (will be kept)`,
            );
          }
          logger.info(
            `New locale(s) to add: ${chalk.cyan(newLocales.join(", "))}`,
          );

          const rl = createInterface({ input: process.stdin, output: process.stdout });
          const answer = await new Promise<string>((resolve) => {
            rl.question(
              chalk.bold(`Add ${newLocales.join(", ")}? (y/n): `),
              (ans) => { rl.close(); resolve(ans.trim().toLowerCase()); },
            );
          });

          if (answer !== "y" && answer !== "yes") {
            logger.info("Cancelled.");
            return;
          }

          const provider = createProvider({
            provider: providerName,
            model: config.llm?.model,
            baseUrl: config.llm?.baseUrl ?? "https://api.openai.com/v1",
            apiKeyEnv: config.llm?.apiKeyEnv,
          });

          logger.info(`Provider: ${chalk.cyan(provider.name)}`);
          console.log("");
          const result = await addLocales({
            root,
            sourceLocale: config.sourceLocale,
            targetLocales: newLocales,
            messagesPath: config.i18n.messagesPath,
            provider,
          });

          console.log("");
          if (result.localesAdded.length > 0) {
            summary({
              "Locales added": result.localesAdded.join(", "),
              "Keys translated": result.totalTranslations,
            });
          }
          return;
        }

        logger.warn("No translatable strings found. Nothing to do.");
        return;
      }

      // ── Step 3: Plan ─────────────────────────────────────────────
      console.log("");
      logger.info(chalk.bold("Step 3/8: Creating migration plan..."));

      const plan = createMigrationPlan(scanResult, config);
      await saveMigrationPlan(root, plan);
      logger.success(
        `Plan: ${plan.summary.autoApply} apply, ${plan.summary.reviewRequired} review, ${plan.summary.skipped} skip.`,
      );

      // ── Step 4: LLM Pre-filter ──────────────────────────────────
      console.log("");
      logger.info(chalk.bold("Step 4/8: Pre-filtering strings with LLM..."));

      const provider = createProvider({
        provider: providerName,
        model: config.llm?.model,
        baseUrl: config.llm?.baseUrl,
        apiKeyEnv: config.llm?.apiKeyEnv,
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

      // ── Step 5: Apply transforms ─────────────────────────────────
      console.log("");
      logger.info(chalk.bold("Step 5/8: Applying code transforms..."));

      for (const entry of plan.entries) {
        if (entry.action === "review") {
          entry.action = "apply";
        }
      }

      const fileGroups = groupByFile(plan.entries);
      const backups: FileBackup[] = [];
      let totalApplied = 0;
      let totalSkipped = 0;

      for (const group of fileGroups) {
        const filePath = resolveFromRoot(root, group.filePath);
        let source: string;
        try {
          source = await readFileContent(filePath);
        } catch {
          totalSkipped += group.entries.length;
          continue;
        }

        const result = transformFileSource(source, group.entries, false);
        totalApplied += result.applied.length;
        totalSkipped += result.skipped.length;

        if (result.applied.length > 0) {
          backups.push({
            filePath: group.filePath,
            originalContent: source,
            modifiedContent: result.code,
            timestamp: new Date().toISOString(),
          });
          logger.success(
            `  ${chalk.bold(group.filePath)}: ${result.applied.length} applied`,
          );
        }
      }

      const operation: ManifestOperation = {
        type: "migrate",
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
        operations: [operation],
      };
      await saveManifest(root, manifest);

      if (!options.dryRun) {
        for (const backup of backups) {
          const filePath = resolveFromRoot(root, backup.filePath);
          await writeFileContent(filePath, backup.modifiedContent);
        }
      }

      logger.success(
        `Applied ${chalk.bold(String(totalApplied))} transforms to ` +
          `${chalk.bold(String(backups.length))} file(s). Skipped ${totalSkipped}.`,
      );

      // ── Step 6: Translate ────────────────────────────────────────
      console.log("");
      logger.info(chalk.bold("Step 6/8: Translating..."));
      logger.info(`  Provider: ${chalk.cyan(provider.name)}`);

      const translatableEntries = plan.entries.filter((e) => e.action !== "skip");

      await generateMessageFiles({
        root,
        messagesPath: config.i18n.messagesPath,
        sourceLocale: config.sourceLocale,
        entries: plan.entries,
      });

      let totalTranslations = 0;

      for (const locale of targetLocales) {
        logger.info(`  Translating to ${chalk.cyan(locale)}...`);
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
      }

      logger.success(
        `Generated ${chalk.bold(String(totalTranslations))} translations across ` +
          `${chalk.bold(String(targetLocales.length))} locale(s).`,
      );

      // ── Step 7: Setup i18n infrastructure ────────────────────────
      console.log("");
      logger.info(chalk.bold("Step 7/8: Setting up next-intl infrastructure..."));

      if (!options.dryRun) {
        const setupFiles = await setupNextIntl({
          root,
          sourceLocale: config.sourceLocale,
          packageManager: projectInfo.packageManager,
        });
        for (const f of setupFiles) {
          logger.success(`  Created ${f}`);
        }
      } else {
        logger.info(chalk.yellow("  Skipped (dry run)."));
      }

      // ── Step 8: Validate ─────────────────────────────────────────
      console.log("");
      logger.info(chalk.bold("Step 8/8: Validating..."));

      const validationResult = await validateProject({ root, config });

      if (validationResult.valid) {
        logger.success("Validation passed.");
      } else {
        const errorCount = validationResult.issues.filter(
          (i) => i.severity === "error",
        ).length;
        logger.warn(`Validation completed with ${errorCount} issue(s).`);
      }

      // ── Summary ──────────────────────────────────────────────────
      console.log("");
      console.log(chalk.bold.green("✓ Migration complete!"));
      console.log("");

      summary({
        "Source locale": config.sourceLocale,
        "Target locales": targetLocales.join(", "),
        "Strings found": scanResult.summary.totalStrings,
        "Transforms applied": totalApplied,
        "Translations generated": totalTranslations,
        "Files modified": backups.length,
      });

      if (options.dryRun) {
        console.log("");
        logger.info(chalk.yellow("DRY RUN — no files were written."));
      }

      console.log("");
      logger.info(
        `Default language: ${chalk.cyan(config.sourceLocale)}. Edit ${chalk.bold("i18n/request.ts")} to change it.`,
      );
      logger.info(
        `To undo all changes: ${chalk.bold("safe-i18n rollback")}`,
      );
    },
  );
