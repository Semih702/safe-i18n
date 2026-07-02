import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";

function toPosix(p: string): string {
  return p.split(path.sep).join(path.posix.sep);
}

export async function readFileContent(filePath: string): Promise<string> {
  const normalized = toPosix(filePath);
  return readFile(normalized, "utf-8");
}

export async function writeFileContent(
  filePath: string,
  content: string,
): Promise<void> {
  const normalized = toPosix(filePath);
  await writeFile(normalized, content, "utf-8");
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(toPosix(filePath));
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  const normalized = toPosix(dirPath);
  await mkdir(normalized, { recursive: true });
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFileContent(filePath);
  return JSON.parse(content) as T;
}

export async function writeJsonFile(
  filePath: string,
  data: unknown,
): Promise<void> {
  const content = JSON.stringify(data, null, 2) + "\n";
  await writeFileContent(filePath, content);
}
