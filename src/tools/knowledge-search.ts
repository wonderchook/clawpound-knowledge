import { Type } from "@sinclair/typebox";
import { optionalStringEnum, jsonResult } from "../lib/schema-helpers.js";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { searchEntries } from "../lib/knowledge-store.js";
import { resolvePaths } from "../lib/paths.js";

const LEARNING_TYPES = [
  "decision",
  "pattern",
  "principle",
  "technique",
  "insight",
  "correction",
] as const;

const KnowledgeSearchSchema = Type.Object(
  {
    query: Type.Optional(
      Type.String({
        description: "Text search query to match against titles, content, and tags",
      }),
    ),
    tags: Type.Optional(
      Type.Array(Type.String(), {
        description: "Filter by tags — returns entries matching any of these tags",
      }),
    ),
    type: optionalStringEnum(LEARNING_TYPES, {
      description: "Filter by learning type",
    }),
    max_results: Type.Optional(
      Type.Number({
        description: "Maximum number of results to return. Default: 10",
      }),
    ),
  },
  { additionalProperties: false },
);

export function createKnowledgeSearchTool(
  api: OpenClawPluginApi,
  pluginConfig: Record<string, unknown>,
) {
  return {
    name: "kw_knowledge_search",
    label: "Search Knowledge Base",
    description:
      "Search knowledge entries in memory/knowledge/ by tags, type, or content text. More targeted than memory_search — filters on YAML frontmatter metadata. Use when you need specific learnings by type (corrections, patterns, etc.) or by tag.",
    parameters: KnowledgeSearchSchema,
    async execute(
      _toolCallId: string,
      params: {
        query?: string;
        tags?: string[];
        type?: string;
        max_results?: number;
      },
    ) {
      const workspaceDir =
        api.config?.agents?.defaults?.workspace ?? process.cwd();
      const { knowledgeDir } = resolvePaths(workspaceDir, pluginConfig);

      const results = await searchEntries(knowledgeDir, {
        query: params.query,
        tags: params.tags,
        type: params.type,
        maxResults: params.max_results,
      });

      if (results.length === 0) {
        return jsonResult({
          results: [],
          message: "No knowledge entries found matching the search criteria.",
          knowledgeDir,
        });
      }

      const formatted = results.map((entry) => ({
        filename: entry.filename,
        title: entry.frontmatter.title,
        type: entry.frontmatter.type,
        tags: entry.frontmatter.tags,
        confidence: entry.frontmatter.confidence,
        created: entry.frontmatter.created,
        snippet:
          entry.content.length > 300
            ? entry.content.slice(0, 300) + "..."
            : entry.content,
      }));

      return jsonResult({
        results: formatted,
        count: formatted.length,
        message: `Found ${formatted.length} knowledge entries.`,
      });
    },
  };
}
