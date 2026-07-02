#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { initCommand } from "./commands/init.js";
import { scanCommand } from "./commands/scan.js";
import { planCommand } from "./commands/plan.js";
import { applyCommand } from "./commands/apply.js";
import { translateCommand } from "./commands/translate.js";
import { validateCommand } from "./commands/validate.js";
import { rollbackCommand } from "./commands/rollback.js";
import { migrateCommand } from "./commands/migrate.js";
import { addLocaleCommand } from "./commands/add-locale.js";
import { syncCommand } from "./commands/sync.js";
import { resetCommand } from "./commands/reset.js";

const program = new Command();

program
  .name("safe-i18n")
  .description("AI-assisted i18n migration CLI — safe, review-first, semantic internationalization")
  .version("0.1.0")
  .addHelpText("after", `
${chalk.bold("Usage:")}
  ${chalk.cyan("safe-i18n migrate --to tr,de --api-key-env OPENAI_API_KEY")}   First-time migration
  ${chalk.cyan("safe-i18n sync --api-key-env OPENAI_API_KEY")}                 Catch up new strings
  ${chalk.cyan("safe-i18n add-locale --to fr --api-key-env OPENAI_API_KEY")}   Add a new language

Run ${chalk.cyan("safe-i18n <command> --help")} for command-specific options.
`);

program.addCommand(migrateCommand);
program.addCommand(syncCommand);
program.addCommand(addLocaleCommand);
program.addCommand(initCommand);
program.addCommand(scanCommand);
program.addCommand(planCommand);
program.addCommand(applyCommand);
program.addCommand(translateCommand);
program.addCommand(validateCommand);
program.addCommand(rollbackCommand);
program.addCommand(resetCommand);

program.parse();
