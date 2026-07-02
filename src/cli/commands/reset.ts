import { Command } from "commander";
import chalk from "chalk";
import { createInterface } from "node:readline";
import { loadManifest } from "../../core/manifest.js";
import {
  writeFileContent,
  fileExists,
} from "../../utils/fs.js";
import { logger, summary } from "../../utils/logger.js";
import {
  getProjectRoot,
  getConfigDir,
  resolveFromRoot,
} from "../../utils/paths.js";
import { rm, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const resetCommand = new Command("reset")
  .description("Completely remove all i18n artifacts and restore original source files")
  .option("--yes", "skip confirmation prompt")
  .action(async (options: { yes?: boolean }) => {
    const root = getProjectRoot();

    if (!options.yes) {
      console.log("");
      logger.warn("This will:");
      logger.warn("  1. Restore ALL source files to their original pre-migration state");
      logger.warn("  2. Delete messages/, i18n/, .safe-i18n/ directories");
      logger.warn("  3. Delete safe-i18n.config.json");
      logger.warn("  4. Remove next-intl setup from layout.tsx and next.config.ts");
      console.log("");

      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise<string>((resolve) => {
        rl.question(
          chalk.bold.red("Are you sure you want to reset everything? (y/n): "),
          (ans) => { rl.close(); resolve(ans.trim().toLowerCase()); },
        );
      });

      if (answer !== "y" && answer !== "yes") {
        logger.info("Cancelled.");
        return;
      }
    }

    let filesRestored = 0;
    let artifactsRemoved = 0;

    // Step 1: Restore files from manifest (earliest backup per file = original)
    const manifest = await loadManifest(root);
    if (manifest && manifest.operations.length > 0) {
      const originalByFile = new Map<string, string>();

      // Walk operations in order — the first backup per file has the true original
      for (const op of manifest.operations) {
        for (const backup of op.backups) {
          if (!originalByFile.has(backup.filePath)) {
            originalByFile.set(backup.filePath, backup.originalContent);
          }
        }
      }

      for (const [filePath, originalContent] of originalByFile) {
        const absPath = resolveFromRoot(root, filePath);
        try {
          await writeFileContent(absPath, originalContent);
          filesRestored++;
          logger.success(`Restored ${chalk.bold(filePath)}`);
        } catch (err) {
          logger.error(
            `Failed to restore ${chalk.bold(filePath)}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    } else {
      logger.warn("No manifest found — skipping file restoration.");
      logger.warn("If files were already transformed, you may need to restore them manually.");
    }

    // Step 2: Reset layout.tsx (remove next-intl wiring)
    const layoutPath = resolveFromRoot(root, "app/layout.tsx");
    if (await fileExists(layoutPath)) {
      let layout = await readFile(layoutPath, "utf8");
      const origLayout = layout;

      layout = layout.replace(/import \{ NextIntlClientProvider \} from "next-intl";\n?/g, "");
      layout = layout.replace(/import \{ getLocale, getMessages \} from "next-intl\/server";\n?/g, "");
      layout = layout.replace(/\s*const locale = await getLocale\(\);\n?/g, "\n");
      layout = layout.replace(/\s*const messages = await getMessages\(\);\n?/g, "");
      layout = layout.replace(/<NextIntlClientProvider messages=\{messages\}>\n?\s*/g, "");
      layout = layout.replace(/\s*<\/NextIntlClientProvider>/g, "");
      layout = layout.replace(/ lang=\{locale\}/g, "");

      const otherAwaits = layout.match(/await\s+/g);
      if (!otherAwaits || otherAwaits.length === 0) {
        layout = layout.replace(/export default async function/g, "export default function");
      }

      if (layout !== origLayout) {
        await writeFile(layoutPath, layout, "utf8");
        logger.success("Reset app/layout.tsx");
      }
    }

    // Step 3: Reset next.config.ts (remove next-intl plugin)
    const nextConfigPath = resolveFromRoot(root, "next.config.ts");
    if (await fileExists(nextConfigPath)) {
      let config = await readFile(nextConfigPath, "utf8");
      const origConfig = config;

      config = config.replace(/import createNextIntlPlugin from ["']next-intl\/plugin["'];?\n?/g, "");
      config = config.replace(/const withNextIntl = createNextIntlPlugin\([^)]*\);?\n?/g, "");
      config = config.replace(/export default withNextIntl\((\w+)\)/g, "export default $1");

      if (config !== origConfig) {
        await writeFile(nextConfigPath, config, "utf8");
        logger.success("Reset next.config.ts");
      }
    }

    // Step 4: Delete generated directories and files
    const toDelete = [
      "messages",
      "i18n",
      ".safe-i18n",
      "safe-i18n.config.json",
    ];

    for (const item of toDelete) {
      const full = resolveFromRoot(root, item);
      if (await fileExists(full)) {
        await rm(full, { recursive: true, force: true });
        artifactsRemoved++;
        logger.success(`Deleted ${chalk.bold(item)}`);
      }
    }

    console.log("");
    summary({
      "Files restored": filesRestored,
      "Artifacts removed": artifactsRemoved,
    });

    logger.success("Reset complete. Project is back to pre-migration state.");
  });
