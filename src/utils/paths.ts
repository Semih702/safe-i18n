import path from "node:path";

export function getProjectRoot(): string {
  return process.cwd();
}

export function getConfigDir(root: string): string {
  return path.join(root, ".safe-i18n");
}

export function getMigrationPlanPath(root: string): string {
  return path.join(getConfigDir(root), "migration-plan.json");
}

export function getManifestPath(root: string): string {
  return path.join(getConfigDir(root), "apply-manifest.json");
}

export function resolveFromRoot(root: string, ...parts: string[]): string {
  return path.normalize(path.join(root, ...parts));
}

export function getRelativePath(root: string, filePath: string): string {
  return path.relative(root, filePath);
}

export function isInsideProject(root: string, filePath: string): boolean {
  const resolved = path.resolve(root, filePath);
  const resolvedRoot = path.resolve(root);
  return resolved.startsWith(resolvedRoot + path.sep) || resolved === resolvedRoot;
}
