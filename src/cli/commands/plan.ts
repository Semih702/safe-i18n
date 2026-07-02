import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../../core/config.js";
import { scanProject } from "../../core/scanner.js";
import { createMigrationPlan } from "../../core/planner.js";
import { saveMigrationPlan } from "../../core/manifest.js";
import { logger, summary } from "../../utils/logger.js";
import { getProjectRoot, getMigrationPlanPath } from "../../utils/paths.js";

export const planCommand = new Command("plan")
  .description("Create a migration plan from scanned strings (does not modify source files)")
  .option("--source <locale>", "override source locale")
  .option("--locales <locales>", "override comma-separated target locales")
  .action(async (options: { source?: string; locales?: string }) => {
    const root = getProjectRoot();
    const config = await loadConfig(root);

    if (options.source) {
      config.sourceLocale = options.source;
    }
    if (options.locales) {
      config.targetLocales = options.locales.split(",").map((l) => l.trim()).filter(Boolean);
    }

    logger.info("Scanning project...");
    const scanResult = await scanProject(root, config);

    logger.info("Creating migration plan...");
    const plan = createMigrationPlan(scanResult, config);

    const planPath = getMigrationPlanPath(root);
    await saveMigrationPlan(root, plan);

    summary({
      "Total entries": plan.summary.totalEntries,
      "Auto-apply": plan.summary.autoApply,
      "Review required": plan.summary.reviewRequired,
      Skipped: plan.summary.skipped,
      Namespaces: plan.summary.namespaces.length,
      "Files affected": plan.summary.filesAffected.length,
    });

    if (plan.summary.namespaces.length > 0) {
      console.log(chalk.bold("Namespaces:"));
      for (const ns of plan.summary.namespaces) {
        console.log(`  ${chalk.cyan(ns)}`);
      }
      console.log("");
    }

    logger.success(`Migration plan saved to ${chalk.bold(planPath)}`);
    logger.info("This plan does NOT modify any source files.");

    console.log("");
    logger.info(
      `Next step: run ${chalk.bold("safe-i18n apply")} to apply transformations.`,
    );
  });
