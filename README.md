# Clawpound Knowledge

Knowledge work loop for [OpenClaw](https://github.com/openclaw/openclaw): brainstorm, plan, review, execute, and compound learnings into durable memory.

Inspired by [EveryInc/compound-knowledge-plugin](https://github.com/EveryInc/compound-knowledge-plugin) by Austin Tedesco at [Every](https://every.to). Adapted for OpenClaw's plugin system, memory architecture, and chat-native interaction model.

## What It Does

Clawpound Knowledge gives your OpenClaw agent six knowledge work skills that form a compounding loop. Just ask naturally — "help me think through this", "plan the Q3 campaign", "review this brief" — and the agent picks the right workflow:

1. **Brainstorm** -- Get everything out of your head. Paste meeting notes, talk through a problem, dump your thinking. It'll organize, find related past work, and surface the real questions.
2. **Plan** -- Turn a brainstorm into a structured plan. Searches what you've done before, pulls in data, and writes a plan you can actually share.
3. **Confidence** -- Pause and honestly assess what you know vs. don't know. Useful before committing to a direction.
4. **Review** -- Two reviewers check your work: one for strategic alignment, one for data accuracy. Findings come back as P1/P2/P3 severity.
5. **Work** -- Execute a plan. Breaks it into tasks, works through them in batches, tracks what happened.
6. **Compound** -- After a session, extract what you learned and save it so the next cycle starts smarter.

Each cycle produces learnings saved to the knowledge base, which OpenClaw's `memory_search` automatically indexes. Future planning cycles find these learnings, closing the loop.

Skills are designed to work naturally in chat (Slack, Discord, etc.). Artifacts like brainstorms, plans, and deliverables are published to [Proof](https://proofeditor.ai) by default for easy viewing and sharing, with local file persistence as a fallback.

## Installation

```bash
openclaw plugins install -l /path/to/clawpound-knowledge
```

Or via npm (once published):

```bash
openclaw plugins install @wonderchook/clawpound-knowledge
```

**Note:** Requires OpenClaw v2026.4.1+ (uses scoped plugin SDK subpath imports).

## Configuration

Enable the tools in your OpenClaw config:

```json
{
  "plugins": {
    "entries": {
      "clawpound-knowledge": {
        "enabled": true,
        "config": {
          "knowledgeSubdir": "knowledge",
          "plansDir": "plans",
          "autoSuggestCompound": true
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "tools": {
        "enable": ["clawpound-knowledge"]
      }
    }
  }
}
```

For chat-based usage (Slack, Discord), you may also want:

- `tools.exec.ask: "off"` and `tools.exec.security: "full"` if you trust the agent to run commands without approval
- `channels.slack.execApprovals.enabled: true` with `approvers: ["YOUR_SLACK_USER_ID"]` if you prefer interactive approval buttons

## Memory Integration

Knowledge entries are stored in `memory/knowledge/` within the OpenClaw workspace directory. This means:

- `memory_search` automatically indexes and finds knowledge entries via hybrid BM25 + vector search
- Knowledge entries are "evergreen" (no temporal decay since filenames aren't date-based)
- The `kw_knowledge_search` tool adds structured search by tags, type, and confidence

Plans are stored in `plans/` at the workspace root -- they're working documents, not durable knowledge.

## Tools

Three opt-in tools complement the skills:

- `kw_knowledge_save` -- Save learnings with YAML frontmatter to the knowledge base
- `kw_knowledge_search` -- Search knowledge entries by tags, type, or content
- `kw_knowledge_check_stale` -- Find entries that conflict with or are superseded by new learnings

## Hooks

Two hooks run automatically:

- **knowledge-context** (`before_prompt_build`) -- Injects a brief knowledge base index into the agent's context so it knows what learnings are available
- **compound-suggest** (`agent_end`) -- After substantive sessions, suggests running `/kw:compound` to extract learnings

## License

MIT -- see [LICENSE](LICENSE).

## Credits

This project is inspired by the [compound-knowledge-plugin](https://github.com/EveryInc/compound-knowledge-plugin) created by Austin Tedesco at [Every, Inc](https://every.to). The original plugin provides the same knowledge work loop for Claude Code. Clawpound Knowledge adapts the concept for OpenClaw's plugin system, integrating with OpenClaw's memory architecture and chat-native delivery.
