# Geo Agents

Claude Code subagent definitions for Geo. Each agent is one markdown file with `name` / `description` / `tools` frontmatter — the format Claude Code loads from a `.claude/agents/` directory.

This folder is the **canonical copy** (like `skills/` is for skills). To use an agent, install it where Claude Code looks:

```bash
# project-level (this repo checkout)
mkdir -p .claude/agents && cp agents/geo-research.md .claude/agents/

# or user-level (all projects on this machine)
mkdir -p ~/.claude/agents && cp agents/geo-research.md ~/.claude/agents/
```

Then invoke it in Claude Code by asking for it by name (e.g. "use the geo-research agent to enrich …"). Re-copy after editing — installed copies drift the same way skill copies do (see `sync-skills.sh`; agents should be added there too).

## Index

| Agent | What it does | Writes to Geo? |
|---|---|---|
| **geo-research** | The Basic Agent MVP researcher: researches a question with web search under the trusted-sources allowlist + source policy (`documentation/research-agent-allowlist.md`, `documentation/research-agent-source-policy.md`), returns a fully cited draft with per-fact sources for editor review. Spec: `documentation/research-agent-mvp.md`. | No — read-only; editor publishes via geo-publish |
