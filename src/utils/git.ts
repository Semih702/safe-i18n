import { execSync } from "node:child_process";

export function isGitRepo(cwd: string): Promise<boolean> {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd,
      stdio: "pipe",
    });
    return Promise.resolve(true);
  } catch {
    return Promise.resolve(false);
  }
}

export function isWorkingTreeDirty(cwd: string): Promise<boolean> {
  try {
    const output = execSync("git status --porcelain", {
      cwd,
      stdio: "pipe",
      encoding: "utf-8",
    });
    return Promise.resolve(output.trim().length > 0);
  } catch {
    return Promise.resolve(false);
  }
}

export function getGitRoot(cwd: string): Promise<string | null> {
  try {
    const output = execSync("git rev-parse --show-toplevel", {
      cwd,
      stdio: "pipe",
      encoding: "utf-8",
    });
    return Promise.resolve(output.trim());
  } catch {
    return Promise.resolve(null);
  }
}
