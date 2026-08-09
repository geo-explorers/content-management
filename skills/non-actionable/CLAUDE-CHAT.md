# Running these skills in Claude (desktop app & claude.ai)

There are two "Claude Chat" surfaces and they install skills differently. Pick
the one you use.

---

## A) Desktop Claude app (and Claude Code / Codex) — on-disk hosts

These hosts load skills from a **deployed copy on disk**, not from your git
checkout. `git pull` refreshes the repo but **does not** update what the app
runs — you must redeploy and restart.

```bash
cd content-management
git pull
bash skill-dev/sync-skills.sh   # rsync repo skills -> ~/.claude/skills, Codex, desktop skills-plugin
# then fully quit and reopen the Claude app
```

`sync-skills.sh` deploys **every** skill under `skills/actionable` and
`skills/non-actionable` (raw skill folders — the app hosts read the frontmatter
as-is; no zip needed). Restarting the app is required for it to re-read them.

> Updating the skill is three steps — `git pull`, `sync-skills.sh`, restart.
> Skipping the sync or the restart leaves the app on the stale deployed copy.

---

## B) claude.ai in the browser — upload a zip

Browser skills are **not on disk**, so `sync-skills.sh` can't reach them — you
re-upload the packaged zip via the UI.

Build the bundles (one `.zip` per skill, single top-level folder, `SKILL.md` at
its root, frontmatter normalized to what the claude.ai uploader validates):

```bash
python3 skills/package_claude_chat.py non-actionable
# -> skills/dist/claude-chat/<skill>.zip
```

Then in the browser:

1. Enable the **Code execution** capability (the skill scripts run there).
2. **Settings → Capabilities → Skills → Upload skill**.
3. Upload one `.zip` per skill and enable it. Re-upload to update.

The packager (`skills/package_claude_chat.py`) folds non-standard frontmatter
keys (`version`/`authors`/`tools`/`compatibility`) into the `metadata` object and
drops dev-only files (`evals/`, caches, `.gitignore`). Re-run it any time.

---

## Per-skill compatibility (both surfaces)

| Skill | Works? | Notes |
|---|---|---|
| **ontology-advisor** | ✅ (with network egress) | Python stdlib only, no API key. Mode 1 (pure ONTOLOGY.md Q&A) works offline; Modes 2–5 need to reach the Geo GraphQL endpoint. |
| **geo-query** | ✅ | Plain GraphQL over HTTP — designed to run in the desktop app, Claude Code, and claude.ai. Needs network egress to the Geo endpoint. |
| **geo-press-review** | ✅ (best-effort) | Claude's built-in web search for the external half + Geo GraphQL for the coverage half. Needs web search + network egress. |
| **geo-describe** | ✅ (degrades) | Lexical copyright/accuracy gate is stdlib-only; the optional semantic check needs `sentence-transformers` and skips with a warning if absent. |
| **image-banner-recompose** | ✅ | Uses the claude.ai/Cowork paths (`/mnt/user-data/...`). Needs Pillow + numpy; AI outpainting is optional and needs `FAL_KEY` or `REPLICATE_API_TOKEN`. |
| **daily-report** | ⚠️ Claude Code only | Reads local Claude Code session files at `~/.claude/projects/`, absent in the desktop app and browser. It cannot capture a day's work outside Claude Code. |

**Network note:** the GraphQL-backed skills only reach the live graph if the host
permits outbound network to the Geo API (`api-testnet.geobrowser.io` /
`testnet-api.geobrowser.io`). If egress is blocked, `ontology-advisor` still
answers ontology questions from `ONTOLOGY.md`, but the live-graph modes won't
return data.
