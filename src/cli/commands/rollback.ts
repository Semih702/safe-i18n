import { Command } from "commander";
import chalk from "chalk";
import { createInterface } from "node:readline";
import { loadManifest, saveManifest } from "../../core/manifest.js";
import { writeFileContent } from "../../utils/fs.js";
import { logger, summary } from "../../utils/logger.js";
import {
  getProjectRoot,
  getManifestPath,
  resolveFromRoot,
} from "../../utils/paths.js";

export const rollbackCommand = new Command("rollback")
  .description("Undo the last migration or sync operation")
  .option("--yes", "skip confirmation prompt")
  .action(async (options: { yes?: boolean }) => {
    const root = getProjectRoot();

    const manifest = await loadManifest(root);
    if (!manifest || manifest.operations.length === 0) {
      logger.error(
        `No operations found in manifest at ${chalk.bold(getManifestPath(root))}`,
      );
      logger.error("Nothing to rollback.");
      process.exit(1);
    }

    const lastOp = manifest.operations[manifest.operations.length - 1]!;

    logger.info(
      `Last operation: ${chalk.bold(lastOp.type)} (${lastOp.appliedAt})`,
    );
    logger.info(
      `This will restore ${chalk.bold(String(lastOp.backups.length))} file(s) to their pre-${lastOp.type} state.`,
    );

    if (!options.yes) {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise<string>((resolve) => {
        rl.question(
          chalk.bold("Are you sure you want to rollback? (y/n): "),
          (ans) => { rl.close(); resolve(ans.trim().toLowerCase()); },
        );
      });

      if (answer !== "y" && answer !== "yes") {
        logger.info("Cancelled.");
        return;
      }
    }

    let filesRestored = 0;

    for (const backup of lastOp.backups) {
      const filePath = resolveFromRoot(root, backup.filePath);
      try {
        await writeFileContent(filePath, backup.originalContent);
        filesRestored++;
        logger.success(`Restored ${chalk.bold(backup.filePath)}`);
      } catch (err) {
        logger.error(
          `Failed to restore ${chalk.bold(backup.filePath)}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Pop the last operation from the stack
    const remaining = manifest.operations.slice(0, -1);

    if (remaining.length === 0) {
      // Remove manifest entirely
      const { unlink } = await import("node:fs/promises");
      const { fileExists } = await import("../../utils/fs.js");
      const manifestPath = getManifestPath(root);
      if (await fileExists(manifestPath)) {
        await unlink(manifestPath);
      }
    } else {
      await saveManifest(root, { ...manifest, operations: remaining });
    }

    summary({
      Operation: lastOp.type,
      "Files restored": filesRestored,
      "Remaining operations": remaining.length,
    });

    logger.success("Rollback complete.");

    if (remaining.length > 0) {
      logger.info(
        `Run ${chalk.bold("safe-i18n rollback")} again to undo the previous ${remaining[remaining.length - 1]!.type}.`,
      );
    }
  });
