import { existsSync } from "node:fs";
import path from "node:path";
import type { PackageManager } from "../types.js";

const LOCK_FILES: Array<{ file: string; manager: PackageManager }> = [
  { file: "pnpm-lock.yaml", manager: "pnpm" },
  { file: "yarn.lock", manager: "yarn" },
  { file: "bun.lockb", manager: "bun" },
  { file: "bun.lock", manager: "bun" },
  { file: "package-lock.json", manager: "npm" },
];

export function detectPackageManager(root: string): PackageManager {
  for (const { file, manager } of LOCK_FILES) {
    if (existsSync(path.join(root, file))) {
      return manager;
    }
  }
  return "npm";
}
