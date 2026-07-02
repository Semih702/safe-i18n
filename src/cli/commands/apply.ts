import { Command } from "commander";
import chalk from "chalk";
import { loadMigrationPlan, saveManifest } from "../../core/manifest.js";
import { groupByFile, transformFileSource } from "../../codemod/transforms.js";
import { isGitRepo, isWorkingTreeDirty } from "../../utils/git.js";
import { readFileContent, writeFileContent } from "../../utils/fs.js";
import { logger, summary } from "../../utils/logger.js";
import { getProjectRoot, getMigrationPlanPath, resolveFromRoot } from "../../utils/paths.js";
import type { ApplyManifest, ManifestOperation, FileBackup } from "../../core/types.js";

export const applyCommand = new Command("apply")
  .description("Apply migration plan transformations to source files")
  .option("--safe-only", "apply only auto-safe entries (default: true)", true)
  .option("--all", "apply all entries including review-required")
  .option("--allow-dirty", "skip git working tree check")
  .option("--dry-run", "preview changes without writing files")
  .action(
    async (options: { safeOnly: boolean; all?: boolean; allowDirty?: boolean; dryRun?: boolean }) => {
      if (options.all) options.safeOnly = false;
      const root = getProjectRoot();

      // Check git working tree
      if (!options.allowDirty) {
        const isRepo = await isGitRepo(root);
        if (isRepo) {
          const isDirty = await isWorkingTreeDirty(root);
          if (isDirty) {
            logger.warn(
              "Git working tree has uncommitted changes.",
            );
            logger.warn(
              `Commit or stash your changes first, or use ${chalk.bold("--allow-dirty")} to skip this check.`,
            );
            process.exit(1);
          }
        }
      }

      // Load migration plan
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

      const fileGroups = groupByFile(plan.entries);
      const backups: FileBackup[] = [];
      let totalApplied = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      logger.info(
        `Applying migration plan to ${chalk.bold(String(fileGroups.length))} file(s)...`,
      );

      if (options.dryRun) {
        logger.info(chalk.yellow("DRY RUN — no files will be written."));
      }

      for (const group of fileGroups) {
        const filePath = resolveFromRoot(root, group.filePath);
        let source: string;

        try {
          source = await readFileContent(filePath);
        } catch {
          logger.error(`Could not read file: ${chalk.bold(group.filePath)}`);
          totalErrors += group.entries.length;
          continue;
        }

        const result = transformFileSource(source, group.entries, options.safeOnly);

        totalApplied += result.applied.length;
        totalSkipped += result.skipped.length;
        totalErrors += result.errors.length;

        if (result.applied.length > 0) {
          backups.push({
            filePath: group.filePath,
            originalContent: source,
            modifiedContent: result.code,
            timestamp: new Date().toISOString(),
          });
        }

        for (const err of result.errors) {
          logger.error(`  ${group.filePath}: ${err}`);
        }

        if (result.applied.length > 0) {
          logger.success(
            `${chalk.bold(group.filePath)}: ${result.applied.length} applied, ${result.skipped.length} skipped`,
          );
        }
      }

      // Save manifest with backups before writing
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

      // Write transformed files
      if (!options.dryRun) {
        for (const backup of backups) {
          const filePath = resolveFromRoot(root, backup.filePath);
          await writeFileContent(filePath, backup.modifiedContent);
        }
      }

      summary({
        Applied: totalApplied,
        Skipped: totalSkipped,
        Errors: totalErrors,
        "Files modified": backups.length,
      });

      if (options.dryRun) {
        logger.info(
          chalk.yellow("No files were modified (dry run)."),
        );
      } else {
        logger.success("Transformations applied successfully.");
        console.log("");
        logger.info(
          `Next step: run ${chalk.bold("safe-i18n translate --to <locales>")} to generate translations.`,
        );
        logger.info(
          `To undo, run ${chalk.bold("safe-i18n rollback")}.`,
        );
      }
    },
  );
