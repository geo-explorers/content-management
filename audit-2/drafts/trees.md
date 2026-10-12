# Drafts — directory structures (Tab 4 "Two repos")

Designed from first principles + the Claude Code conventions that matter for discovery (project skills at `.claude/skills/<name>/SKILL.md`, subagents at `.claude/agents/<name>.md`, project instructions in `CLAUDE.md`, permissions in `.claude/settings.json`). geo-editor-agent was looked at only for lessons (D5): it duplicates every skill twice (`skills/` and `.claude/skills/`) and had to copy `src/`, `lib/`, `scripts/` because the skills import shared code by relative path. Both are things the target layout avoids.

Pending: Haiku's `research/claude-platform-facts-v2.md` confirms the discovery paths; adjust if a fact changed.

## A. Skills library — `content-management` (state after P1; P3 grows `runtime/` and empties `lib/`+`src/`)

```
content-management/                    skills library · released as tags v1.0.0, v1.1.0 …
├─ skills/
│  ├─ actionable/<skill>/              SKILL.md · references/ · scripts/ · evals/   (can change Geo)
│  └─ non-actionable/<skill>/          same shape                                   (read-only)
├─ lib/  src/                          today's shared code; stays until P3, write paths gated
├─ runtime/                            P3, grows incrementally: one Geo client · one Notion client
│                                      · ONE write path with the circuit breaker · spaces.json
├─ skill-dev/                          linter · integrity-manifest generator and verifier
├─ SKILL-VERSIONS.json                 integrity manifest: one content hash per skill
├─ CLAUDE.md                           routing table only; the self-heal rule is gone
├─ MAINTAINERS.md                      how to change a skill and cut a release
└─ .github/workflows/verify.yml        REQUIRED check: hashes match + linter passes
   removed in P0/P1: root 01…11 scripts · output/ · testing.ts · agents/ · documentation/
```

## B. Agents repo — `geo-agents` (new, geo-explorers)

```
geo-agents/                            all agents, one folder each
├─ CLAUDE.md                           hard rules + routing — they travel WITH the agents
├─ README.md                           install · run an agent · update the vendored skills
├─ .claude/
│  ├─ skills/<skill>/                  VENDORED copy of the library skills at one tag; never hand-edited
│  ├─ agents/<role>.md                 one subagent definition per role (e.g. qa-orchestrator, qa-judge)
│  └─ settings.json                    allow: run agent scripts · ask: --publish · deny: read .env*
├─ agents/
│  ├─ qa-agent/                        ← anatomy below
│  ├─ geo-research/                    existing agent, moved here
│  └─ geo-mirror-refresh/              existing agent, moved here
├─ shared/                             one small Notion client + ledger helper (until runtime/ exists)
├─ workflow/
│  ├─ AGENT-WORKFLOW.md                task and QA-issue lifecycle (moved from the library)
│  └─ ids.json                         Notion tracker ids — ids live here, never in prose
├─ skills.lock.json                    { library tag, commit, sha256 per vendored file }
├─ tools/
│  ├─ sync-skills.mjs --ref v1.0.0     copies skills from the library tag, rewrites the lock
│  └─ verify-lock.mjs                  recomputes hashes; every agent runs it at start
├─ runs/                               git-ignored: ledgers, judgments, fetched pages
└─ .github/workflows/verify-vendored.yml   REQUIRED: vendored files match the lock
```

## C. Anatomy of one agent — `agents/qa-agent/`

```
agents/qa-agent/
├─ AGENT.md                what it does, its hard rules, the run loop — read first by the orchestrator
├─ config.json             Notion table id · Geo space id · batch size · confidence floor · model per role
├─ prompts/
│  └─ judge.md             the rubric: how to decide Supported / Partially / Not supported / Cannot check
├─ schemas/
│  └─ judgment.schema.json the JSON shape every verdict must satisfy (validated before anything is written)
├─ scripts/
│  ├─ run.mjs              the deterministic pipeline: read → fetch → pack → validate → write → read back
│  └─ eval.mjs             compares the agent's verdicts with editor confirmations (precision, recall)
└─ evals/gold/             the human-confirmed rows the eval runs against
```
Plus two thin subagent files in `.claude/agents/`: `qa-orchestrator.md` (runs the scripts, dispatches judges, asks the editor for `publish`) and `qa-judge.md` (tools: read and write files only; no network; model set in config).

## D. "What lives where" (table for Tab 4)

| Thing | Skills library | Agents repo |
|---|---|---|
| Skills (geo-query, geo-publish, …) | the source of truth, released as tags | a vendored copy pinned to one tag, verified by hash |
| Shared Geo/Notion clients and the write path | today `lib/`+`src/`; in P3 `runtime/` | nothing of its own except one small Notion client until `runtime/` exists |
| Agent personas (subagent definitions) | — | `.claude/agents/` |
| Agent procedure, config, prompts, schemas, evals | — | `agents/<name>/` |
| Hard rules | short `CLAUDE.md` + inside geo-publish/geo-clean | full `CLAUDE.md` (so rules load wherever agents run) |
| Notion tracker ids, space ids | `runtime/spaces.json` (P3) | `workflow/ids.json`, `agents/<name>/config.json` |
| Run artefacts (ledgers, fetched pages) | — | `runs/`, git-ignored |
| A new skill born with an agent | graduates here once stable and evaluated | lives in `agents/<name>/` first |

## E. How a skill update reaches an agent (pseudocode for Tab 4)

```
maintainer:  tools/sync-skills --ref v1.1.0      # copy skills from the library tag; rewrite skills.lock.json
             open a pull request                 # reviewers read the real skill diff
CI:          verify-vendored                     # recompute every hash; must equal the lock
             merge
each agent start:
             verify-lock  →  match? run : stop and ask a human
rule:        no agent ever downloads skills while it runs
```

## F. Why these shapes (for the "Details for engineers" block)
- Vendored copy + hash lock, not git submodules (hostile to non-engineers, poor on Windows) and not the old unpinned sync script (per-machine, flattens paths, breaks imports). An npm package can come later for `runtime/` when a third consumer appears.
- Skills at root `.claude/skills/` and subagents at `.claude/agents/` because that is where Claude Code (and a hosted Managed Agent) discover them without configuration.
- One folder per agent keeps ownership obvious; thin subagent files point into it so the folder stays the single place to read.
- `shared/` is admitted debt: one Notion client in the agents repo until the library's `runtime/` exists (P3); then delete it.
