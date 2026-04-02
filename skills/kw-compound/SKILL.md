---
name: kw:compound
description: Extract and save learnings from a completed knowledge work session. Saves to the knowledge base so future plans automatically find them.
---

# Compound

Close the loop. Extract what you learned and save it where future work will find it.

## When to Use

* After completing a plan, campaign, analysis, or strategy session

* "Compound this session", "Save what we learned", "What should we remember?"

* After a data correction, process fix, or strategic insight

* At the end of any meaningful work session

## Process

### Step 1: Identify learnings

Scan the current session for compoundable insights. Look for:

| Type           | Signals                                                               |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Insight**    | "We discovered...", surprising finding, counter-intuitive result      |
| **Playbook**   | Repeatable process that worked, step-by-step that others could follow |
| **Correction** | Wrong assumption fixed, data source clarified, definition updated     |
| **Pattern**    | Something that keeps recurring, systemic observation                  |

**Extract 1-3 learnings max.** Quality over quantity. If nothing is worth saving, say so:

> "Nothing from this session seems worth saving as a standalone learning. The work is captured in the plan/deliverables."

For each learning, draft:

```
**Learning:** [One sentence — what we now know]
**Type:** [insight | playbook | correction | pattern]
**Why it matters:** [One sentence — how this changes future work]
```

### Step 2: Get user approval

Present the drafted learnings and ask:

> "Found [N] learnings worth saving. Review and approve?"

Show each learning with its classification. User can:

* Approve as-is

* Edit the wording

* Skip individual learnings

* Add learnings you missed

**Do not save anything without approval.**

### Step 3: Check for duplicates

For each approved learning, search the existing knowledge base:

- Use the `kw_knowledge_search` tool to search by tags and content
- Also use `memory_search` for semantic matches

If a similar learning already exists:

* Show the existing entry

* Ask: "Update existing or save as new?"

* If updating, edit the existing entry

### Step 3.5: Check for stale knowledge

After identifying what to save, launch the stale knowledge checker:

Launch agent: `clawpound-knowledge:research:stale-knowledge-checker`
- Pass: the new learning(s) being saved
- Returns: existing entries that may be contradicted or superseded

If stale entries are found, present them to the user:

> "This new learning may conflict with existing knowledge:
> - **[existing entry]** says [X], but the new learning says [Y]
> - Recommendation: [Update / Remove / Keep both]
>
> Want me to update the old entry?"

<critical_requirement>
Only the orchestrating compound skill writes or updates entries — research agents return findings as text only.
</critical_requirement>

### Step 4: Save to the knowledge base

Use the `kw_knowledge_save` tool to save each learning. Each entry should include:

- **Type:** insight | playbook | correction | pattern
- **Tags:** relevant keywords for future search
- **Confidence:** high | medium | low
- **Source:** brief description of what triggered this

**Content structure** — each learning should cover:

```
[2-4 sentences explaining the learning. Be specific enough that someone 
reading this in 3 months understands what happened and why it matters.]

## Context
[What you were doing when you discovered this.]

## Implication
[How this should change future work. Be concrete: "When doing X, always check Y first."]
```

### Step 5: Confirm and offer next steps

```
## Compounded

**Saved:**
- [learning title 1]
- [learning title 2]

**These learnings will be surfaced by /kw:plan and knowledge search** when future work touches:
- [list the tags that would trigger retrieval]
```

Use AskUserQuestion:

**Question:** "Learnings saved. What next?"

**Options:**
1. **Run `/kw:plan`** — Start a new planning cycle (the learnings will be found)
2. **Done** — Session complete

## Important Rules

* **1-3 learnings max per session.** If you're saving 5 things, you're not filtering enough.

* **Approval required.** Never auto-save. The user decides what's worth remembering.

* **Be specific.** "Use the right data source" is useless. "Revenue metrics come from [specific dashboard], not [other source] which overcounts by ~$X" is useful.

* **Duplicates are waste.** Always check before creating. Update existing entries when possible.

* **Confidence matters.** Mark `low` if based on one data point. Mark `high` if verified across multiple sessions or with data.

* **Tags are for retrieval.** Choose tags that future searches would match on. Think: "What future question would this answer?"

* **Memory integration.** Saved learnings are automatically indexed by OpenClaw's `memory_search` tool, making them findable via both keyword and semantic search in future sessions.
