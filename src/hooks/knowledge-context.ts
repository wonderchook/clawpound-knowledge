import type { OpenClawPluginApi } from "openclaw/plugin-sdk/core";
import { listEntries } from "../lib/knowledge-store.js";
import { resolvePaths } from "../lib/paths.js";

/**
 * before_prompt_build hook that injects a brief knowledge base index
 * into the agent's system prompt context.
 */
export function createKnowledgeContextHook(
  api: OpenClawPluginApi,
  pluginConfig: Record<string, unknown>,
) {
  return async () => {
    const workspaceDir =
      api.config?.agents?.defaults?.workspace ?? "";
    if (!workspaceDir) return {};

    const { knowledgeDir } = resolvePaths(workspaceDir, pluginConfig);

    let entries;
    try {
      entries = await listEntries(knowledgeDir);
    } catch {
      return {};
    }

    if (entries.length === 0) return {};

    // Sort by updated date (newest first) and take top 5
    const sorted = entries.sort((a, b) =>
      (b.frontmatter.updated ?? "").localeCompare(
        a.frontmatter.updated ?? "",
      ),
    );
    const recent = sorted.slice(0, 5);

    const lines = [
      `## Knowledge Base (${entries.length} entries)`,
      "",
      "Recent learnings:",
      ...recent.map(
        (e) =>
          `- **${e.frontmatter.title}** (${e.frontmatter.type}) [${e.frontmatter.tags.join(", ")}]`,
      ),
      "",
      "Use `kw_knowledge_search` to search by tags/type, or `memory_search` for semantic search.",
      "Use `/kw:compound` to save new learnings after completing work.",
    ];

    return { prependContext: lines.join("\n") };
  };
}
