# Claude platform facts (researched 2026-10-09 by the claude-code-guide agent; saved verbatim by the main session)

## Source key (all checked 2026-10-09; prefix each with https://)
- CC-SUB code.claude.com/docs/en/sub-agents · CC-SKL …/skills · CC-HK …/hooks · CC-HL …/headless · CC-CLI …/cli-reference · CC-SCH …/scheduled-tasks · CC-RTN …/routines · CC-MEM …/memory · CC-AUTH …/authentication · CC-COST …/costs
- SUP-PRO support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan
- SDK code.claude.com/docs/en/agent-sdk/overview · SDK-QS …/quickstart · SDK-PY …/python
- MA platform.claude.com/docs/en/managed-agents/overview · MA-MIG …/migration · MA-SCHED …/scheduled-deployments · MA-ORCH …/multiagent-orchestration
- PRICE platform.claude.com/docs/en/about-claude/pricing · MODELS platform.claude.com/docs/en/models/overview · M-FABLE / M-OPUS / M-SON / M-HAIKU platform.claude.com/docs/en/models/{fable-5-1, opus-5-5, sonnet-5-5, haiku-5-5}/overview
- BATCH platform.claude.com/docs/en/build-with-claude/batch-processing · CACHE …/prompt-caching · SO …/structured-outputs · HALLU platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
- E-BEA anthropic.com/engineering/building-effective-agents · E-MAS …/multi-agent-research-system · E-EVAL …/demystifying-evals-for-ai-agents · E-LONG …/effective-harnesses-for-long-running-agents

## 1. Claude Code building blocks
- Subagents (CC-SUB): Markdown files with YAML frontmatter in `.claude/agents/`. Only `name` and `description` are required. Other fields: `tools` (allowlist; omitted = inherits all subagent-available tools), `disallowedTools`, `model` (`sonnet`, `opus`, `haiku`, `fable`, a full ID, or `inherit`), `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `effort`. Unrecognized fields are ignored silently. Precedence: managed settings → `--agents` → project `.claude/agents/` → user `~/.claude/agents/` → plugins. Without `model`, a subagent uses `CLAUDE_CODE_SUBAGENT_MODEL` or the main model. Subagents inherit the parent's MCP tools unless restricted. Nesting is three layers by default.
- Skills (CC-SKL): `SKILL.md` in `~/.claude/skills/` (personal) or `.claude/skills/` (project); enterprise overrides personal, which overrides project. **Descriptions are always in context (capped at 1,536 characters combined)**; the body loads only on invocation. **Keep it under 500 lines.** A subagent with a `skills` field preloads the full content. In `-p`, forked skills wait for their result.
- Hooks (CC-HK): events include `PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, `SessionStart`, `SessionEnd`. Exit code 2 blocks on blockable events, with stderr as the reason. CLAUDE.md is context, not enforcement; use a hook to enforce a rule (CC-MEM).
- Headless `claude -p` (CC-HL, CC-CLI): exit 0 on success, non-zero on failure. `--output-format text|json|stream-json`; with `--json-schema`, validated output appears in `structured_output`. `--max-turns` errors when reached. `--max-budget-usd` caps a client-side list-price estimate, and subagent spend counts. Also `--allowedTools`, `--permission-mode dontAsk`, `--permission-prompts none` (v2.1.259+). Piped stdin capped at 10 MB. Without `--bare`, `-p` runs project hooks and `.mcp.json` servers even in untrusted folders.
- Scheduling (CC-SCH, CC-RTN): `/loop` runs only in an open session (min 1 minute; 50 tasks/session; recurring tasks expire after 7 days). Desktop scheduled tasks need the machine on. **Routines run on Anthropic cloud (min 1 hour; research preview; Pro, Max, Team, Enterprise). Routine runs count against subscription usage.** Limits: 100 scheduled runs/hour/account; "Run now", API fires and one-off reruns share 30/hour/routine. Routines clone repos fresh and run without permission prompts. Locally added MCP servers must be added as claude.ai connectors. The `/fire` endpoint is claude.ai-only.
- Subscription auth (CC-AUTH, CC-HL): **`claude setup-token` makes a one-year token for "CI pipelines and scripts" (`CLAUDE_CODE_OAUTH_TOKEN`).** Precedence: `ANTHROPIC_AUTH_TOKEN` → `ANTHROPIC_API_KEY` (always used in `-p` when present) → apiKeyHelper → the setup token → `/login` subscription. Unset `ANTHROPIC_API_KEY` to use the subscription in `-p`. `--bare` never reads OAuth or the keychain. Docs call `--bare` "the recommended mode for scripted and SDK calls" that "will become the default for -p in a future release" — that would affect subscription-based scripts; the docs do not say how.
- Limits (SUP-PRO, CC-COST): Pro and Max have a five-hour session limit and a weekly limit, shared across Claude and Claude Code. Max adds a separate weekly Fable limit. Subscription cache lifetime is one hour (API default five minutes). Subagent requests draw on your usage.
- CLAUDE.md (CC-MEM): loads at launch from managed policy, `~/.claude/CLAUDE.md`, `./CLAUDE.md` or `./.claude/CLAUDE.md`, `./CLAUDE.local.md`, plus every ancestor directory. Subdirectory files load when Claude touches files there. `@` imports nest four hops. Target under 200 lines. Subagents load it unless `omitClaudeMd: true` (CC-SUB).

## 2. Claude Agent SDK
- What it is (SDK, SDK-QS): Claude Code's harness as a library. Python `claude-agent-sdk`; TypeScript `@anthropic-ai/claude-agent-sdk`. Bundles the native binary. Built-in tools: Read, Write, Edit, Bash, web search. Reuses hooks, subagents, MCP, permissions, sessions, skills/memory from `.claude/` and `~/.claude`.
- Options (SDK-PY): `max_turns`, `max_budget_usd` (estimate), `allowed_tools`, `permission_mode` (incl. `dontAsk`), `setting_sources` (defaults user/project/local; `[]` disables), `agents`, `output_format` (JSON schema), `model`, `mcp_servers`, `hooks`. `usage` excludes subagent tokens; `model_usage` includes them.
- Auth (SDK-QS, SDK): the quickstart directs API-key use, or Bedrock/Vertex/Foundry/Claude Platform on AWS. "Unless previously approved, Anthropic does not allow third party developers to offer claude.ai login or rate limits for their products, including agents built on the Claude Agent SDK." Internal use not addressed.
- When to choose it (SDK): the SDK to run Claude Code's harness in a process you operate; Messages API / tool runner if you write your own loop; Managed Agents if Anthropic hosts it.

## 3. Claude Managed Agents
- Status and access (MA): beta. Header `managed-agents-2026-04-01` (SDKs set it) and a Claude API key. Enabled by default for API accounts. MCP tunnels and dreaming are limited research preview. Stateful; not ZDR- or HIPAA-eligible.
- Model (MA, MA-MIG): agent definition (model, system prompt, tools, MCP, skills); environment (Anthropic cloud or self-hosted sandbox); sessions; SSE event stream. Built-in bash, file ops, web search/fetch, MCP.
- Porting from the Agent SDK (MA-MIG): `ClaudeAgentOptions` → persisted agent; `query()` → session creation + event streaming; `@tool` functions → custom tools answered on `agent.custom_tool_use`; `cwd`/`add_dirs` → uploaded files; CLAUDE.md hierarchy → one `system` string; PreToolUse hooks → your client or `permission_policy`; `max_turns` counted client-side. The page does not map `.claude/agents` or settings hooks.
- Scheduling (MA-SCHED, beta): cron + IANA timezone, minute granularity; up to 1,000 deployments/org; jitter ≤15% of interval (max 9 min); pause/unpause/archive; per-run budget.
- Multi-agent (MA-ORCH): coordinator + threads sharing sandbox and filesystem, each with isolated context/config.
- Pricing (PRICE): standard token rates with cache multipliers; **the batch discount does not apply; plus $0.08 per session-hour, counted only while status is `running`.**

## 4. Batch, structured outputs, caching, models
- Batch (BATCH, MODELS): 50% off input and output. 100,000 requests or 256 MB per batch. Most finish within an hour; expire at 24 h; results kept 29 days. All active models. Server tools allowed; `stream`, `speed`, `max_tokens: 0` rejected. Errored/canceled/expired not billed. Results out of order → match on `custom_id` (`^[a-zA-Z0-9_-]{1,64}$`). Beta `output-300k-2026-03-24` allows 300k output tokens on 5.5 models.
- Structured outputs (SO): `output_config.format = {"type":"json_schema","schema":...}`; JSON in the text block; constrained decoding; no beta; works with batch. **Unsupported: `minimum`, `maximum`, `minLength`, `maxLength`, recursive schemas; `additionalProperties` must be `false`.** Refusals and `max_tokens` cutoffs can yield invalid output. Enum casing may change. Changing the format invalidates the cache. Opus 5.5 / Sonnet 5.5 / Fable 5.1: forced tool use returns an error → prefer `output_config.format`.
- Prompt caching (CACHE): minimum 512 tokens on 5.5 models and Fable 5.1. TTL 5 min (write 1.25x) or 1 h (write 2x). Reads 0.1x (0.05x on Opus and Sonnet 5.5; 0.025x on Fable 5.1). Up to four breakpoints. Batch hit rates best-effort 30–98%; docs recommend the 1-hour TTL (BATCH).
- Models and prices (PRICE, MODELS), per MTok:

| Model (API ID) | Released | Input / output | 5m write / 1h write / read | Batch in / out |
|---|---|---|---|---|
| Fable 5.1 (`claude-fable-5-1`) | 2026-09-01 | $10 / $50 | $12.50 / $20 / $0.25 | $5 / $25 |
| Opus 5.5 (`claude-opus-5-5`) | 2026-09-22 | $4 / $20 | $5 / $8 / $0.20 | $2 / $10 |
| Sonnet 5.5 (`claude-sonnet-5-5`) | 2026-09-28 | $2 / $10 | $2.50 / $4 / $0.10 | $1 / $5 |
| Haiku 5.5 (`claude-haiku-5-5`), prompt ≤100k | 2026-10-07 | $0.10 / $0.50 | $0.125 / $0.20 / $0.01 | $0.05 / $0.25 |
| Haiku 5.5, prompt >100k | same | $0.50 / $2.50 | $0.625 / $1 / $0.05 | $0.25 / $1.25 |

All four: 1M context, 128K synchronous output. Earliest retirement 2027. Haiku 5.5 and Sonnet 5.5 return 400 for non-default `temperature`/`top_p`/`top_k`. Default effort medium for Haiku and Opus 5.5, high for Sonnet 5.5 and Fable 5.1. Thinking tokens bill as output. Opus 5.5 thinking cannot be disabled. 4.7+ tokenizers ≈ 30% more tokens than 4.6 and earlier.

## 5. Anthropic-recommended patterns
- Workflows vs agents (E-BEA, 2024-12-19): prompt chaining, routing, parallelization (sectioning/voting), orchestrator-workers, evaluator-optimizer. Use the simplest solution that works.
- Orchestrator-workers (E-MAS, 2025-06-13): lead spawns 3–5 subagents in parallel; each brief needs objective, output format, tool/source guidance, task boundaries. Token use: agents ≈4x chat, multi-agent ≈15x. Good for heavy parallel work; poor for tightly dependent work.
- LLM-as-judge and evals (E-EVAL, 2026-01-09; E-MAS): start with 20–50 tasks from real failures; prefer deterministic graders; calibrate LLM judges against humans; grade each dimension separately; grade outcomes not paths; pass^k for consistency; 0% pass usually = broken task; read transcripts. Best judge in E-MAS: one call returning a 0.0–1.0 score plus pass/fail.
- Abstention and grounding (HALLU, E-EVAL): allow "I don't know"; extract verbatim quotes first for documents over 20k tokens; attach a supporting quote to each claim and retract claims without one; offer an "Unknown" exit.
- Long-running and resumable (E-LONG, 2025-11-26): initializer + coding agent; JSON feature list (less likely to be overwritten than Markdown); progress log; git commits as checkpoints; init script; resume by reading git log and progress first; end-to-end verification before marking items done.

## Design implications (the agent's inference, not Anthropic guidance)
1. Keep the verifier read-only; use `tools: Read, Grep, Glob, WebFetch, WebSearch` or `--allowedTools` with `--permission-mode dontAsk`.
2. Max mode: do not use `--bare`; unset `ANTHROPIC_API_KEY`; confirm with `/status`; set `--max-turns`; split large runs to fit the five-hour and weekly windows.
3. API mode: Message Batches + `output_config.format` + `custom_id` for resume + 1-hour cache on the shared rubric; Haiku 5.5 for triage; keep prompts under 100k tokens.
4. One verdict schema in both modes, with an `unknown` verdict and quoted evidence; put bounds in descriptions (numeric constraints unsupported).
5. Validate the LLM judge against 20–50 human-labelled claims before trusting it.

## Could not verify
- Exact Max usage caps (numbers); only the window structure is documented.
- Whether `claude -p` runs draw from the same windows (inferred).
- Whether internal Agent SDK use with a Max login is permitted (policy text silent).
- Whether `--max-budget-usd` means anything on a subscription login.
- Whether usage-limit auto-continue applies to `-p`.
- Whether batch requests can run client-side tool loops (inferred: multiple rounds).
- Whether forced `tool_choice` errors on Haiku 5.5.
- How `.claude/agents`, skills and settings hooks map into Managed Agents.
- Official confidence-score guidance: none found.
- Whether Routines `/fire` can be called from outside claude.ai (docs say no).
- GitHub Actions scheduling and auth: not opened.
- What happens to subscription `-p` runs if `--bare` becomes the default.
