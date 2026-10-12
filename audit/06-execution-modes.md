# 06 — Execution modes: Claude Max session mode vs Claude API mode (and the hosted path)

Both modes run the SAME scripts, rubric, schema and thresholds (DD1). The only swap is the judge adapter. Everything below assumes the agents repo is cloned, `node ≥ 22`, `NOTION_TOKEN` in `.env`, and the editor runs from the repo root (WSL on Windows).

## Mode A — Session mode (Claude Max subscription, Claude Code CLI)
**Who/when:** an editor, on demand, from `claude` in the agents repo. Default for the first weeks.
**Shape:**
1. Editor: "tag claims in <Notion DB link>, limit 50". The `claim-tagger` subagent (orchestrator, `.claude/agents/claim-tagger.md`) loads the `claim-verification` skill and runs steps 1–5 as Bash commands (`node scripts/run.mjs --mode session --until judge`). Nothing model-judged yet.
2. The orchestrator spawns up to 5 `claim-judge` subagents in parallel (`.claude/agents/claim-judge.md`; tools: Read, Write only; model configurable, default `sonnet`), one per `batches/batch-NNN.json`. Each judge reads its batch file and the rubric, and writes one `judgments/<geoId>.json` per claim. It never calls the network (evidence is already in the batch file) and never touches Notion.
3. Orchestrator runs `node scripts/run.mjs --mode session --from calibrate` → validates judgment files (invalid → re-dispatch that claim once), prints the dry-run report, asks the editor for the literal `publish`, then writes, reads back, prints the ledger summary.
**Why subagents here:** context isolation (10 claims × 2 sources ≈ 10k tokens per judge; the orchestrator never sees page text), parallelism, and model choice per role (judge on Sonnet 5.5, orchestrator on the session's model). The orchestrator's context stays small enough to survive a 50-claim run without compaction.
**Constraints:** Max plan usage = a five-hour window + a weekly cap shared across Claude and Claude Code (exact numbers not published); subagent requests draw on it → batch default 50 (≈ 5 judge runs ≈ 60–120k tokens). Unattended options on the subscription: (a) `claude -p` headless with `--allowedTools`, `--permission-mode dontAsk`, `--max-turns`, authenticated by `claude setup-token` (`CLAUDE_CODE_OAUTH_TOKEN`, valid one year, meant for scripts) with `ANTHROPIC_API_KEY` unset — note the docs say `--bare` (which ignores OAuth) may become the `-p` default later; (b) **Routines**: Anthropic-cloud scheduled runs for Pro/Max (min 1 h cadence, counts against subscription usage, clones the repo fresh, no permission prompts). In both, `--publish` must be explicit and the dry-run report is read afterwards by a human. Judge output format drifts more than the API's structured outputs → schema validation + retry is mandatory (DD2).
**Setup cost:** zero beyond the repo clone. No API key, no spend outside the subscription.

## Mode B — API mode (Claude API, `@anthropic-ai/sdk`)
**Who/when:** backlog runs (hundreds to thousands of claims), eval-harness runs (repeatable), later unattended/scheduled runs.
**Shape:** `node scripts/run.mjs --mode api [--batch] --limit 500 --model claude-opus-5-5 --publish`
- `judge-api.mjs` builds one request per claim: `system = [rubric block with cache_control {type: ephemeral, ttl: "1h"}]`, user turn = claim + evidence, `output_config.format` = judgment JSON schema (structured outputs; no prefill, no forced tool), `output_config.effort = "medium"`, `max_tokens = 2000`, concurrency 4, SDK retries on 429/5xx, `fallbacks: "default"` for refusals.
- `--batch`: the same requests go to the Message Batches API (50% price; most batches finish within an hour; max 24 h; up to 100k requests); the run waits/polls and resumes from `batches/<id>.state.json` if interrupted. Results are keyed by `custom_id = geoId`, never by position.
- Everything else identical to Mode A.
**Constraints:** needs `ANTHROPIC_API_KEY` (or `ant auth login` profile) and a budget owner; the prompt cache only pays off inside its TTL window (keep concurrency ≥ 2 so the cached rubric is reused).

## Cost model (per claim; tokens: rubric ≈ 3,500 cached · claim+meta ≈ 300 · evidence ≈ 4,000 (2 sources × 2,000 chars ≈ 1,000 tok each… budget 4,000) · output ≈ 500)
Prices (platform.claude.com pricing page, checked 2026-10-09; per MTok): Opus 5.5 $4 / $20, cache read $0.20, 1h cache write $8; Sonnet 5.5 $2 / $10, cache read $0.10, 1h write $4; Haiku 5.5 (≤100k prompt) $0.10 / $0.50, cache read $0.01. Batch = 50% of input and output. Uncached input per claim ≈ 4,300 tok; cached ≈ 3,500 tok.
| Model | Standard $/claim | 1,911 claims | Batches (−50 %) 1,911 claims |
|---|---|---|---|
| Opus 5.5 | 4.3k×$4 + 3.5k×$0.20 + 0.5k×$20 ≈ **$0.028** | ≈ $54 | ≈ $27 |
| Sonnet 5.5 | 4.3k×$2 + 3.5k×$0.10 + 0.5k×$10 ≈ **$0.014** | ≈ $27 | ≈ $14 |
| Haiku 5.5 | 4.3k×$0.10 + 3.5k×$0.01 + 0.5k×$0.50 ≈ **$0.0007** | ≈ $1.4 | ≈ $0.7 |
(Add one 1h cache write of the 3.5k-token rubric per model per hour: $0.028 Opus / $0.014 Sonnet — negligible.)
Reading: even the top model costs under $60 for the whole backlog; the eval harness decides whether Sonnet/Haiku hold quality (the directive is "default Opus 5.5; downgrade only when measured").
Session mode cost = subscription usage; a 50-claim run ≈ 100k judge tokens + orchestrator overhead.

## Decision: which mode when
| Situation | Mode |
|---|---|
| First runs, 50 claims at a time, editor present | A (session) |
| Backlog of 1,911, or any run > 200 claims | B (api, --batch) |
| Eval harness / calibration (must be repeatable) | B (api, fixed model + effort) |
| Scheduled/unattended | B now; hosted Managed Agent later (below) |
| Editor wants to "talk" to the run (ask why, re-judge one claim) | A |

## Mode C (future) — hosted: Claude Managed Agent
Portable because of DD1: the orchestrator persona + the skill are files, the scripts are Node, secrets are env vars.
| Requirement | How |
|---|---|
| Agent config (once, versioned) | system = claim-tagger.md body; skills discovered from the mounted agents repo at root `.claude/skills/claim-verification/` (one level deep — this is why the repo layout matters) |
| Environment | cloud, `networking.limited`, `allowed_hosts`: api.notion.com, api-testnet.geobrowser.io, gateway.pinata.cloud (+ source domains or `unrestricted`), `allow_package_managers: true` for `npm ci` |
| Secrets | vault `environment_variable` credential NOTION_TOKEN (substituted at egress, never in the sandbox); ANTHROPIC key not needed inside (the session is the model) |
| Trigger | on demand `sessions.create` by an editor tool, or a scheduled deployment (cron) with a session `budget` cap |
| Publish gate | `--publish` only after an outcome rubric passes (define_outcome: "dry-run report reconciles; 0 read-back diffs") or a human `tool_confirmation` on the write step |
| Cost | standard token rates (no batch discount) + $0.08 per session-hour while `running`; a 50-claim session ≈ 15–30 min → a few cents on top of tokens |
| Blockers today | none for the MVP (read-only Geo, Notion via token). For the big picture: the wallet key / geo-publish must stay a human-run local step (or a self-hosted sandbox). Managed Agents is beta and requires an API account (not the Max subscription) |
