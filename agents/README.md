# Geo Agents

> **Looking for a specific document?** [`MD-FILES.md`](MD-FILES.md) lists every Markdown file in this repo, what it contains, who reads it and when it loads.

> **Start here: [`AGENT-WORKFLOW.md`](AGENT-WORKFLOW.md)** — the operating contract for any agent working in the **Agents flow** Notion teamspace: where to work, the mandatory task lifecycle (log → In progress → do → result + link → Done), the Work tracker and QA issue tracker schemas, the hard rules, and the known traps. Read it before doing anything in that teamspace.

Claude Code subagent definitions for Geo. Each agent is one markdown file with `name` / `description` / `tools` frontmatter — the format Claude Code loads from a `.claude/agents/` directory.

This folder is the **canonical copy** (like `skills/` is for skills). To use an agent, install it where Claude Code looks:

```bash
# from the repo root — one agent, or all of them
mkdir -p ~/.claude/agents && cp agents/geo-mirror-refresh.md ~/.claude/agents/   # user-level: every project
mkdir -p .claude/agents  && cp agents/*.md .claude/agents/                        # project-level: this checkout
```

**Then start a new session** — agents are loaded at startup, so an agent copied into a running session is not visible to it.

Run the session **from the repo root**: agents that call scripts need `.env` and `skills/` to resolve.

Invoke one by asking for the job in plain words ("refresh the mirrors", "research this entity") or by name ("use the geo-research agent to …"). Re-copy after editing — installed copies drift the same way skill copies do (see `sync-skills.sh`; agents should be added there too).

## Index

| Agent | What it does | Writes to Geo? |
|---|---|---|
| **geo-mirror-refresh** | Thin front door to geo-mirror Part 1: refreshes the "- new" Notion mirrors (or mirrors a named space into a Notion page) and reports previous → added → updated → now. Dry run first, never deletes rows, never touches `Proposed …` / `… new` / `Publish status` columns. | No — reads Geo, writes Notion |
| **geo-research** | The Basic Agent MVP researcher: researches a question with web search under the trusted-sources allowlist + source policy (`documentation/research-agent-allowlist.md`, `documentation/research-agent-source-policy.md`), returns a fully cited draft with per-fact sources for editor review. Spec: `documentation/research-agent-mvp.md`. | No — read-only; editor publishes via geo-publish |
