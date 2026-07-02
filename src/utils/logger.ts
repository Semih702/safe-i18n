import chalk from "chalk";

function formatArgs(args: unknown[]): string {
  if (args.length === 0) return "";
  return " " + args.map((a) => String(a)).join(" ");
}

export const logger = {
  info(message: string, ...args: unknown[]): void {
    console.log(chalk.blue("info") + "  " + message + formatArgs(args));
  },

  warn(message: string, ...args: unknown[]): void {
    console.log(chalk.yellow("warn") + "  " + message + formatArgs(args));
  },

  error(message: string, ...args: unknown[]): void {
    console.error(chalk.red("error") + " " + message + formatArgs(args));
  },

  success(message: string, ...args: unknown[]): void {
    console.log(chalk.green("ok") + "    " + message + formatArgs(args));
  },

  debug(message: string, ...args: unknown[]): void {
    if (process.env["SAFE_I18N_DEBUG"]) {
      console.log(chalk.gray("debug") + " " + message + formatArgs(args));
    }
  },
};

export function summary(data: Record<string, string | number>): void {
  const entries = Object.entries(data);
  if (entries.length === 0) return;

  const maxKeyLen = Math.max(...entries.map(([key]) => key.length));

  console.log("");
  console.log(chalk.bold("Summary"));
  console.log(chalk.gray("-".repeat(maxKeyLen + 10)));

  for (const [key, value] of entries) {
    const paddedKey = key.padEnd(maxKeyLen);
    console.log(`  ${chalk.cyan(paddedKey)}  ${value}`);
  }

  console.log("");
}
