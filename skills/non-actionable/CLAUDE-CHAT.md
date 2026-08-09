# Running these skills in Claude Chat (claude.ai)

Claude Chat (the web/desktop app) installs a skill from a **`.zip`** that holds a
single top-level folder — named exactly like the skill — with `SKILL.md` at its
root. This directory ships upload-ready bundles for every skill under
`non-actionable/`.

## Build the upload bundles

```bash
python3 skills/package_claude_chat.py non-actionable
# -> skills/dist/claude-chat/<skill>.zip  (one per skill)
```

The packager (`skills/package_claude_chat.py`) stages each skill, normalizes its
frontmatter to what the claude.ai uploader validates (`name`, `description`, and
the open `metadata` object — folding `version`/`authors`/`tools`/`compatibility`
into `metadata`), drops dev-only files (`evals/`, caches, `.gitignore`), and
zips one folder per skill. Re-run it any time to rebuild.

## Install in Claude Chat

1. Enable the **Code execution** capability (the skill scripts run there).
2. Go to **Settings → Capabilities → Skills** → **Upload skill**.
3. Upload one `.zip` per skill and enable it.
4. Start a chat — the skill triggers on the phrases in its description, or invoke
   it by name.

## Per-skill compatibility

| Skill | Works in Claude Chat? | Notes |
|---|---|---|
| **ontology-advisor** | ✅ (with network egress) | Python stdlib only, no API key. Mode 1 (pure ONTOLOGY.md Q&A) works offline; Modes 2–5 need the sandbox to reach the Geo GraphQL endpoint. |
| **geo-query** | ✅ | Plain GraphQL over HTTP — the skill itself states it runs in claude.ai in the browser. Needs sandbox network egress to the Geo endpoint. |
| **geo-press-review** | ✅ (best-effort) | Uses Claude's built-in web search for the external half + Geo GraphQL for the coverage half. Needs web search + network egress. |
| **geo-describe** | ✅ (degrades) | Lexical copyright/accuracy gate is stdlib-only; the optional semantic check needs `sentence-transformers` and skips with a warning if absent. Accuracy research uses web search. |
| **image-banner-recompose** | ✅ | Designed for the claude.ai/Cowork paths (`/mnt/user-data/...`). Needs Pillow + numpy (installable in the sandbox); AI outpainting is optional and needs `FAL_KEY` or `REPLICATE_API_TOKEN`. |
| **daily-report** | ⚠️ Claude Code only | Reads local Claude Code session files at `~/.claude/projects/`, which do not exist in Claude Chat. Bundled for completeness, but it cannot capture a day's work from the chat app. |

**Network note:** the GraphQL-backed skills only reach the live graph if your
workspace's code-execution sandbox permits outbound network to the Geo API
(`api-testnet.geobrowser.io` / `testnet-api.geobrowser.io`). If egress is
blocked, `ontology-advisor` still answers ontology questions from `ONTOLOGY.md`,
but the live-graph modes won't return data.
