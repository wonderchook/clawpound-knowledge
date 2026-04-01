# Clawpound Knowledge

Knowledge work loop for [OpenClaw](https://github.com/openclaw/openclaw): brainstorm, plan, review, execute, and compound learnings into durable memory.

Inspired by [EveryInc/compound-knowledge-plugin](https://github.com/EveryInc/compound-knowledge-plugin) by Austin Tedesco at [Every](https://every.to). Adapted for OpenClaw's plugin system and memory architecture.

## What It Does

Clawpound Knowledge provides six workflow skills that form a compounding loop:

1. `/kw:brainstorm` -- Brain dump capture, extract decisions/questions/constraints, search knowledge base
2. `/kw:plan` -- Research past work, structure plans grounded in data and past learnings
3. `/kw:confidence` -- Epistemic gut-check before proceeding
4. `/kw:review` -- Parallel strategic alignment and data accuracy review
5. `/kw:work` -- Execute plans batch-by-batch with progress tracking
6. `/kw:compound` -- Extract and save learnings so the next cycle starts smarter

Each cycle produces learnings saved to `memory/knowledge/`, which OpenClaw's `memory_search` automatically indexes. Future planning cycles find these learnings, closing the loop.

## Installation

```bash
openclaw plugins install -l /path/to/clawpound-knowledge
```

Or via npm (once published):

```bash
openclaw plugins install @wonderchook/clawpound-knowledge
```

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

## Memory Integration

Knowledge entries are stored in `memory/knowledge/` within the OpenClaw workspace directory. This means:

- `memory_search` automatically indexes and finds knowledge entries via hybrid BM25 + vector search
- Knowledge entries are "evergreen" (no temporal decay since filenames aren't date-based)
- The `kw_knowledge_search` tool adds structured search by tags, type, and confidence

Plans are stored in `plans/` at the workspace root -- they're working documents, not durable knowledge.

## Tools

Three opt-in tools complement the skills:

- `kw_knowledge_save` -- Save learnings with YAML frontmatter to `memory/knowledge/`
- `kw_knowledge_search` -- Search knowledge entries by tags, type, or content
- `kw_knowledge_check_stale` -- Find entries that conflict with or are superseded by new learnings

## License

MIT -- see [LICENSE](LICENSE).

## Credits

This project is inspired by the [compound-knowledge-plugin](https://github.com/EveryInc/compound-knowledge-plugin) created by Austin Tedesco at [Every, Inc](https://every.to). The original plugin provides the same knowledge work loop for Claude Code. Clawpound Knowledge adapts the concept for OpenClaw's plugin system, integrating with OpenClaw's memory architecture.
