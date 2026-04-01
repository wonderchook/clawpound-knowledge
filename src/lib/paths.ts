import path from "node:path";

const DEFAULT_KNOWLEDGE_SUBDIR = "knowledge";
const DEFAULT_PLANS_DIR = "plans";

export interface PluginPaths {
  knowledgeDir: string;
  plansDir: string;
}

/**
 * Resolve the knowledge and plans directories from workspace root and plugin config.
 */
export function resolvePaths(
  workspaceDir: string,
  pluginConfig?: Record<string, unknown>,
): PluginPaths {
  const knowledgeSubdir =
    typeof pluginConfig?.knowledgeSubdir === "string"
      ? pluginConfig.knowledgeSubdir
      : DEFAULT_KNOWLEDGE_SUBDIR;

  const plansDir =
    typeof pluginConfig?.plansDir === "string"
      ? pluginConfig.plansDir
      : DEFAULT_PLANS_DIR;

  return {
    knowledgeDir: path.join(workspaceDir, "memory", knowledgeSubdir),
    plansDir: path.join(workspaceDir, plansDir),
  };
}

/**
 * Generate a URL-safe slug from a title string.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
