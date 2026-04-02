import { Type } from "@sinclair/typebox";
import { jsonResult } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/core";
import { findStaleEntries } from "../lib/knowledge-store.js";
import { resolvePaths } from "../lib/paths.js";

const KnowledgeCheckStaleSchema = Type.Object(
  {
    title: Type.String({
      description: "Title of the new learning being saved",
    }),
    content: Type.String({
      description: "Content of the new learning",
    }),
    tags: Type.Array(Type.String(), {
      description: "Tags of the new learning",
    }),
  },
  { additionalProperties: false },
);

export function createKnowledgeCheckStaleTool(
  api: OpenClawPluginApi,
  pluginConfig: Record<string, unknown>,
) {
  return {
    name: "kw_knowledge_check_stale",
    label: "Check Stale Knowledge",
    description:
      "Find existing knowledge entries that may conflict with or be superseded by a new learning. Use before saving a new learning via kw_knowledge_save to prevent contradictions in the knowledge base.",
    parameters: KnowledgeCheckStaleSchema,
    async execute(
      _toolCallId: string,
      params: { title: string; content: string; tags: string[] },
    ) {
      const workspaceDir =
        api.config?.agents?.defaults?.workspace ?? process.cwd();
      const { knowledgeDir } = resolvePaths(workspaceDir, pluginConfig);

      const { contradicted, superseded, complementary } =
        await findStaleEntries(knowledgeDir, {
          title: params.title,
          content: params.content,
          tags: params.tags,
        });

      const hasConflicts =
        contradicted.length > 0 || superseded.length > 0;

      const formatEntry = (e: { filename: string; frontmatter: { title: string; type: string; confidence: number | string } }) => ({
        filename: e.filename,
        title: e.frontmatter.title,
        type: e.frontmatter.type,
        confidence: e.frontmatter.confidence,
      });

      return jsonResult({
        hasConflicts,
        contradicted: contradicted.map(formatEntry),
        superseded: superseded.map(formatEntry),
        complementary: complementary.map(formatEntry),
        message: hasConflicts
          ? `Found ${contradicted.length} potentially contradicted and ${superseded.length} potentially superseded entries. Review before saving.`
          : "No conflicts found. Safe to save the new learning.",
      });
    },
  };
}
