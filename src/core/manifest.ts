import type { ApplyManifest, MigrationPlan } from "./types.js";
import {
  fileExists,
  readJsonFile,
  writeJsonFile,
  ensureDir,
} from "../utils/fs.js";
import {
  getConfigDir,
  getManifestPath,
  getMigrationPlanPath,
} from "../utils/paths.js";

export async function saveManifest(
  root: string,
  manifest: ApplyManifest,
): Promise<void> {
  await ensureDir(getConfigDir(root));
  await writeJsonFile(getManifestPath(root), manifest);
}

export async function loadManifest(
  root: string,
): Promise<ApplyManifest | null> {
  const manifestPath = getManifestPath(root);
  if (await fileExists(manifestPath)) {
    return readJsonFile<ApplyManifest>(manifestPath);
  }
  return null;
}

export async function saveMigrationPlan(
  root: string,
  plan: MigrationPlan,
): Promise<void> {
  await ensureDir(getConfigDir(root));
  await writeJsonFile(getMigrationPlanPath(root), plan);
}

export async function loadMigrationPlan(
  root: string,
): Promise<MigrationPlan | null> {
  const planPath = getMigrationPlanPath(root);
  if (await fileExists(planPath)) {
    return readJsonFile<MigrationPlan>(planPath);
  }
  return null;
}
