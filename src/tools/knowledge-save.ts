import { Type } from "@sinclair/typebox";
import { stringEnum, jsonResult } from "../lib/schema-helpers.js";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { saveEntry } from "../lib/knowledge-store.js";
import { resolvePaths } from "../lib/paths.js";

const LEARNING_TYPES = [
  "decision",
  "pattern",
  "principle",
  "technique",
  "insight",
  "correction",
] as const;

const KnowledgeSaveSchema = Type.Object(
  {
    title: Type.String({
      description: "Short title for the learning",
    }),
    content: Type.String({
      description:
        "The learning content — what was discovered, decided, or proven. Include context and implications.",
    }),
    type: stringEnum(LEARNING_TYPES, {
      description: "Type of learning",
    }),
    tags: Type.Array(Type.String(), {
      description: "Tags for future retrieval via memory_search and kw_knowledge_search",
    }),
    confidence: Type.Optional(
      Type.Number({
        description: "Confidence level 0-1. Default: 0.7",
      }),
    ),
    source: Type.Optional(
      Type.String({
        description:
          "Where this learning came from (e.g. session date, plan name)",
      }),
    ),
  },
  { additionalProperties: false },
);

export function createKnowledgeSaveTool(
  api: OpenClawPluginApi,
  pluginConfig: Record<string, unknown>,
) {
  return {
    name: "kw_knowledge_save",
    label: "Save Knowledge Entry",
    description:
      "Save a learning to memory/knowledge/ with YAML frontmatter. The entry is automatically indexed by memory_search for future retrieval. Use after /kw:compound identifies learnings worth saving.",
    parameters: KnowledgeSaveSchema,
    async execute(
      _toolCallId: string,
      params: {
        title: string;
        content: string;
        type: string;
        tags: string[];
        confidence?: number;
        source?: string;
      },
    ) {
      const workspaceDir =
        api.config?.agents?.defaults?.workspace ?? process.cwd();
      const { knowledgeDir } = resolvePaths(workspaceDir, pluginConfig);

      const result = await saveEntry(knowledgeDir, {
        title: params.title,
        content: params.content,
        type: params.type,
        tags: params.tags,
        confidence: params.confidence,
        source: params.source,
      });

      if (result.isDuplicate) {
        return jsonResult({
          saved: false,
          reason: "duplicate",
          existingPath: result.existingPath,
          message: `A knowledge entry already exists at ${result.existingPath}. Update the existing entry or use a different title.`,
        });
      }

      return jsonResult({
        saved: true,
        filePath: result.filePath,
        message: `Learning saved to ${result.filePath}. It will be findable via memory_search and kw_knowledge_search.`,
        tags: params.tags,
      });
    },
  };
}
