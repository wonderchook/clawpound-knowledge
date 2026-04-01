import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { createKnowledgeSaveTool } from "./src/tools/knowledge-save.js";
import { createKnowledgeSearchTool } from "./src/tools/knowledge-search.js";
import { createKnowledgeCheckStaleTool } from "./src/tools/knowledge-check-stale.js";
import { createKnowledgeContextHook } from "./src/hooks/knowledge-context.js";
import { createCompoundSuggestionHook } from "./src/hooks/compound-suggest.js";

const plugin = {
  id: "clawpound-knowledge",
  name: "Clawpound Knowledge",
  description:
    "Knowledge work loop for OpenClaw: brainstorm, plan, review, execute, and compound learnings into durable memory.",

  register(api: OpenClawPluginApi) {
    const pluginConfig = (api.pluginConfig ?? {}) as Record<string, unknown>;

    // Register tools (all optional — enabled via tools.enable config)
    api.registerTool(createKnowledgeSaveTool(api, pluginConfig), {
      optional: true,
    });
    api.registerTool(createKnowledgeSearchTool(api, pluginConfig), {
      optional: true,
    });
    api.registerTool(createKnowledgeCheckStaleTool(api, pluginConfig), {
      optional: true,
    });

    // Register hooks
    api.on(
      "before_prompt_build",
      createKnowledgeContextHook(api, pluginConfig),
    );
    api.on("agent_end", createCompoundSuggestionHook(api, pluginConfig));

    api.logger.info("clawpound-knowledge plugin loaded");
  },
};

export default plugin;
