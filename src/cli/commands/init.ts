import { Command } from "commander";
import chalk from "chalk";
import { analyzeProject } from "../../core/project-analyzer.js";
import { writeConfig } from "../../core/config.js";
import type { SafeI18nConfig } from "../../core/types.js";
import { logger } from "../../utils/logger.js";
import { getProjectRoot } from "../../utils/paths.js";

export const initCommand = new Command("init")
  .description("Initialize safe-i18n configuration for this project")
  .option("--source <locale>", "source locale code", "en")
  .option("--locales <locales>", "comma-separated target locale codes")
  .option("--adapter <adapter>", "i18n adapter to use", "next-intl")
  .action(async (options: { source: string; locales?: string; adapter: string }) => {
    const root = getProjectRoot();

    logger.info("Analyzing project...");
    const projectInfo = await analyzeProject(root);

    console.log("");
    console.log(chalk.bold("Project detected:"));
    console.log(`  Framework:       ${chalk.cyan(projectInfo.framework)}`);
    console.log(`  TypeScript:      ${projectInfo.hasTypeScript ? chalk.green("yes") : chalk.yellow("no")}`);
    console.log(`  App Router:      ${projectInfo.hasAppRouter ? chalk.green("yes") : chalk.gray("no")}`);
    console.log(`  Pages Router:    ${projectInfo.hasPagesRouter ? chalk.green("yes") : chalk.gray("no")}`);
    console.log(`  src/ directory:  ${projectInfo.hasSrcDirectory ? chalk.green("yes") : chalk.gray("no")}`);
    console.log(`  Package manager: ${chalk.cyan(projectInfo.packageManager)}`);

    if (projectInfo.existingI18n) {
      console.log(`  Existing i18n:   ${chalk.yellow(projectInfo.existingI18n)}`);
    }

    const targetLocales = options.locales
      ? options.locales.split(",").map((l) => l.trim()).filter(Boolean)
      : [];

    const config: SafeI18nConfig = {
      sourceLocale: options.source,
      targetLocales,
      include: ["src/**/*.{ts,tsx,js,jsx}", "app/**/*.{ts,tsx,js,jsx}"],
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
      ],
      i18n: {
        adapter: options.adapter as "next-intl",
        messagesPath: "messages",
        namespaceStrategy: "route-based",
      },
      validation: {
        commands: [],
      },
    };

    await writeConfig(root, config);

    console.log("");
    logger.success(`Configuration written to ${chalk.bold("safe-i18n.config.json")}`);
    logger.info(`Source locale: ${chalk.cyan(options.source)}`);

    if (targetLocales.length > 0) {
      logger.info(`Target locales: ${chalk.cyan(targetLocales.join(", "))}`);
    } else {
      logger.info("No target locales configured. Use --locales to specify them.");
    }

    console.log("");
    logger.info(`Next step: run ${chalk.bold("safe-i18n scan")} to find translatable strings.`);
  });
