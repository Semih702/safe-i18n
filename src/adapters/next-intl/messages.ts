import path from "node:path";
import { ensureDir, writeJsonFile } from "../../utils/fs.js";
import type { MigrationEntry } from "../../core/types.js";

interface GenerateOptions {
  root: string;
  messagesPath: string;
  sourceLocale: string;
  entries: MigrationEntry[];
}

interface GenerateResult {
  files: string[];
  keyCount: number;
}

export function setNestedKey(
  obj: Record<string, unknown>,
  key: string,
  value: string,
): void {
  const parts = key.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    const next = current[part];

    if (next === undefined || next === null || typeof next !== "object") {
      const child: Record<string, unknown> = {};
      current[part] = child;
      current = child;
    } else {
      current = next as Record<string, unknown>;
    }
  }

  const lastPart = parts[parts.length - 1]!;
  current[lastPart] = value;
}

export function mergeMessages(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...existing };

  for (const key of Object.keys(incoming)) {
    const incomingValue = incoming[key];
    const existingValue = result[key];

    if (
      incomingValue !== null &&
      incomingValue !== undefined &&
      typeof incomingValue === "object" &&
      !Array.isArray(incomingValue) &&
      existingValue !== null &&
      existingValue !== undefined &&
      typeof existingValue === "object" &&
      !Array.isArray(existingValue)
    ) {
      result[key] = mergeMessages(
        existingValue as Record<string, unknown>,
        incomingValue as Record<string, unknown>,
      );
    } else {
      result[key] = incomingValue;
    }
  }

  return result;
}

export async function generateMessageFiles(
  options: GenerateOptions,
): Promise<GenerateResult> {
  const { root, messagesPath, sourceLocale, entries } = options;
  const messagesDir = path.join(root, messagesPath);

  await ensureDir(messagesDir);

  const messages: Record<string, unknown> = {};
  let keyCount = 0;

  for (const entry of entries) {
    if (entry.action === "skip") {
      continue;
    }

    const fullKey = entry.namespace
      ? `${entry.namespace}.${entry.translationKey}`
      : entry.translationKey;

    setNestedKey(messages, fullKey, entry.sourceValue);
    keyCount++;
  }

  const filePath = path.join(messagesDir, `${sourceLocale}.json`);
  await writeJsonFile(filePath, messages);

  return {
    files: [filePath],
    keyCount,
  };
}
