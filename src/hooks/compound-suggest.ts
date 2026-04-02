import type { OpenClawPluginApi } from "openclaw/plugin-sdk/core";

/**
 * agent_end hook that logs a suggestion to compound learnings
 * after substantive work sessions.
 */
export function createCompoundSuggestionHook(
  _api: OpenClawPluginApi,
  pluginConfig: Record<string, unknown>,
) {
  const autoSuggest = pluginConfig?.autoSuggestCompound !== false;

  return async (event: { messages?: unknown[]; success?: boolean }) => {
    if (!autoSuggest) return;
    if (!event.success) return;

    // Only suggest if session had substantive work
    const messageCount = Array.isArray(event.messages)
      ? event.messages.length
      : 0;
    if (messageCount < 5) return;

    // Log suggestion — agent_end hooks can't inject into conversation
    // since the session is ending. This is informational.
    _api.logger.info(
      "Session had substantive work. Consider running /kw:compound to extract learnings.",
    );
  };
}
