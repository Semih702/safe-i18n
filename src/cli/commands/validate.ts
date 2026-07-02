import { Command } from "commander";
import chalk from "chalk";
import { loadConfig } from "../../core/config.js";
import { validateProject } from "../../validators/project-validator.js";
import { logger } from "../../utils/logger.js";
import { getProjectRoot } from "../../utils/paths.js";

export const validateCommand = new Command("validate")
  .description("Validate locale files and run configured validation commands")
  .option("--ci", "exit with code 1 if any errors are found")
  .action(async (options: { ci?: boolean }) => {
    const root = getProjectRoot();
    const config = await loadConfig(root);

    logger.info("Validating project...");

    const result = await validateProject({ root, config });

    // Print locale validation results
    if (result.issues.length === 0) {
      logger.success("No locale validation issues found.");
    } else {
      const errors = result.issues.filter((i) => i.severity === "error");
      const warnings = result.issues.filter((i) => i.severity === "warning");

      if (errors.length > 0) {
        console.log("");
        console.log(chalk.red.bold(`${errors.length} error(s):`));
        for (const issue of errors) {
          console.log(
            `  ${chalk.red("x")} [${issue.locale}] ${issue.type}: ${issue.message}`,
          );
        }
      }

      if (warnings.length > 0) {
        console.log("");
        console.log(chalk.yellow.bold(`${warnings.length} warning(s):`));
        for (const issue of warnings) {
          console.log(
            `  ${chalk.yellow("!")} [${issue.locale}] ${issue.type}: ${issue.message}`,
          );
        }
      }
    }

    // Print command validation results
    if (result.commandResults && result.commandResults.length > 0) {
      console.log("");
      console.log(chalk.bold("Validation commands:"));

      for (const cmd of result.commandResults) {
        if (cmd.success) {
          logger.success(`${chalk.bold(cmd.command)} passed`);
        } else {
          logger.error(
            `${chalk.bold(cmd.command)} failed (exit code ${cmd.exitCode})`,
          );
          if (cmd.stderr) {
            console.log(chalk.gray(`    ${cmd.stderr}`));
          }
        }
      }
    }

    console.log("");
    console.log(
      chalk.bold("Locales checked:"),
      result.localesChecked.join(", "),
    );

    if (result.valid) {
      logger.success("Validation passed.");
    } else {
      logger.error("Validation failed.");

      if (options.ci) {
        process.exit(1);
      }
    }
  });
