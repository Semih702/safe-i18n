import { Command } from "commander";
import chalk from "chalk";
import { writeFile } from "node:fs/promises";
import { loadConfig } from "../../core/config.js";
import { scanProject } from "../../core/scanner.js";
import { logger, summary } from "../../utils/logger.js";
import { getProjectRoot } from "../../utils/paths.js";

export const scanCommand = new Command("scan")
  .description("Scan the project for translatable strings")
  .option("--json", "output results as JSON")
  .option("--output <file>", "save scan results to a file")
  .action(async (options: { json?: boolean; output?: string }) => {
    const root = getProjectRoot();
    const config = await loadConfig(root);

    logger.info("Scanning project for translatable strings...");

    const result = await scanProject(root, config);

    if (options.json) {
      const jsonOutput = JSON.stringify(result, null, 2);

      if (options.output) {
        await writeFile(options.output, jsonOutput, "utf-8");
        logger.success(`Results written to ${chalk.bold(options.output)}`);
      } else {
        console.log(jsonOutput);
      }
      return;
    }

    summary({
      "Files scanned": result.summary.filesScanned,
      "Files skipped": result.summary.filesSkipped,
      "Total strings": result.summary.totalStrings,
      "Auto-safe": result.summary.autoSafe,
      "Review required": result.summary.reviewRequired,
      "Skipped (non-UI)": result.summary.skipNonUi,
      "Skipped (dangerous)": result.summary.skipDangerous,
    });

    if (result.candidates.length > 0) {
      console.log(chalk.bold("Sample strings found:"));
      console.log("");

      const sampleSize = Math.min(result.candidates.length, 10);
      for (let i = 0; i < sampleSize; i++) {
        const candidate = result.candidates[i]!;
        const riskColor =
          candidate.risk === "AUTO_SAFE"
            ? chalk.green
            : candidate.risk === "REVIEW_REQUIRED"
              ? chalk.yellow
              : chalk.red;

        console.log(
          `  ${chalk.gray(candidate.filePath + ":" + String(candidate.line))}`,
        );
        console.log(
          `    ${chalk.white('"' + candidate.source + '"')} ${riskColor("[" + candidate.risk + "]")}`,
        );
        console.log("");
      }

      if (result.candidates.length > sampleSize) {
        logger.info(
          `...and ${result.candidates.length - sampleSize} more. Use --json for full output.`,
        );
      }
    }

    if (options.output) {
      const jsonOutput = JSON.stringify(result, null, 2);
      await writeFile(options.output, jsonOutput, "utf-8");
      logger.success(`Full results written to ${chalk.bold(options.output)}`);
    }

    console.log("");
    logger.info(
      `Next step: run ${chalk.bold("safe-i18n plan")} to create a migration plan.`,
    );
  });
