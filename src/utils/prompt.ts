import { createInterface } from "node:readline";
import chalk from "chalk";

export async function confirmPrompt(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((resolve) => {
    rl.question(chalk.bold(`${message} (y/n): `), (ans) => {
      rl.close();
      resolve(ans.trim().toLowerCase());
    });
  });
  return answer === "y" || answer === "yes";
}
