# Summary — Geo review agent design (handoff for follow-up sessions)

Written 2026-10-11 after a single long design session on 2026-10-09 (Claude Code, model Fable 5.1, repo `content-management` @ `fd013a1`, Windows 11 / Git Bash, cwd `X:\work\content-management`). This file is the entry point for any later session. Read it first, then open only the files you need.

---

## 1. What the task was

Design (not build) the structure of a new Geo agent in two stages:

- **Big picture:** an agent that reviews **bounty submissions** in the Geo Curator program. Bounties are either (1) reuse-existing-ontology (verify data + format) or (2) new-ontology (also verify types/properties). A submission may span **several Geo proposals**; the agent must aggregate.
- **First MVP:** verify (= tag) **claims** that were mirrored from the World Affairs space into a **Notion table**, using a Notion **tag taxonomy** as the rule set. The MVP does not write Geo; it may read Geo.

Deliverables requested: requirements interview → repo audit (4 questions) → execution loops (MVP + big picture) → MVP skeleton → big-picture skeleton → a visual Claude Artifact. Working rules: skeptical of the repo, use subagents (Haiku fetch / Opus+Sonnet audit / main synthesis), web research for best practices, use geo-query instead of opening Geobrowser, document in `./special-agent`.

**Status: all six phases complete.** Artifact published. Nothing was written to Geo or Notion.

---

## 2. Where everything is

| File | What it holds |
|---|---|
| `special-agent/00-brief.md` | The user's original brief, verbatim |
| `special-agent/01-log.md` | Chronological work log (facts discovered, agents launched, decisions). Grep it before re-deriving anything |
| `special-agent/02-interview.md` | All three question batches **with the user's answers**, decisions D1–D3, assumptions A1–A16 |
| `special-agent/03-repo-audit.md` | Phase-2 synthesis: the four questions answered, top-10 risks, prior art (PR #52) |
| `special-agent/04-design.md` | Design decisions DD1–DD20, MVP loop, big-picture loop, open items |
| `special-agent/05-mvp-skeleton.md` | Columns, files, data contracts (JSON), judge prompt skeleton, pseudocode, calibration, editor loop, eval harness, hard rules |
| `special-agent/06-execution-modes.md` | Mode A (Claude Max session) vs Mode B (Claude API) vs Mode C (Managed Agent); cost model |
| `special-agent/07-bigpicture-skeleton.md` | Roles/subagents, data contracts, check matrix, pseudocode, PR #52 reuse, linkage fallbacks |
| `special-agent/08-repo-and-deployment.md` | Two-repo target layout, dependency mechanism, 8-step migration, Managed-Agent checklist |
| `special-agent/audit/architecture-coupling.md` | Opus audit: coupling map, repo split, hosting blockers, way-of-working, top-10 risks (file:line) |
| `special-agent/audit/skills-quality.md` | Opus audit: per-skill table, S/A/B/C findings, reuse / must-not-depend lists |
| `special-agent/audit/notion-tooling-reuse.md` | Sonnet audit: reusable scripts, how Claim Sources are modelled on Geo, 8 Notion clients, build-vs-reuse table |
| `special-agent/audit/claude-platform-facts.md` | Official-docs facts: Claude Code subagents/skills limits, headless, Routines, Agent SDK, Managed Agents, Batches, structured outputs, caching, prices (with URLs) |
| `special-agent/audit/best-practices.md` | External research: LLM-as-judge, fact-checking pipelines, eval sizing, HITL UX, agent architecture, instruction supply chain (with sources) |
| `special-agent/verify/README.md` + `decode-proposal-edit.mjs` | Live proof that proposal contents are readable (GraphQL → IPFS → grc-20 decode) |
| `special-agent/sources/` | Verbatim fetches: Agent Composition catalog (+ child pages, DB schemas, catalog rows), Claims mirror (schema + all 1,911 rows JSON), Claim Tags taxonomy (29 rows + bodies), bounty A/B, eval-1/2/3 (+ raw JSON), 4 referenced Notion pages, `pr52.diff` |
| `special-agent/artifact/geo-review-agent.html` | The published artifact's source |

**Artifact:** https://claude.ai/artifact/58bibLGuYwkAvftdsNUvqm (private; owner Mika). To update it from a new session: `Artifact action:"read" url:<that URL>` first, then publish with `url` set to the same URL (publishing without `url` creates a separate artifact).

**Memory (Claude Code project memory, loaded automatically):** `user-mika-profile`, `feedback-standalone-questions`, `geo-review-agent-design`.

---

## 3. The user, and how they want to work

Mika (Mikalojus Galminas; Notion identity mika@geobrowser.io, workspace "Geo") — returning content-team member, the first senior technical person on the team. Expects vibecode in the repo and wants it called out with fixes.

Working rules they set: questions in batches of 5–8 (most important first, only what docs don't answer); a running assumptions list shown before each phase; phases start only after they say **"go"**; Haiku for page fetching, Opus/Sonnet for audits/research, main session for interview/verification/synthesis; be skeptical; use geo-query not Geobrowser; document as you go. **Post questions as a standalone message** — a batch was once lost inside a status-heavy message.

---

## 4. Interview outcome (the contract for the MVP)

User answers (full text in `02-interview.md`):

1. MVP sets tags on the World Affairs claims Notion table. Schema-driven: any table with a title + `Geo ID` column; must work for **all kinds of claims**, not only debate claims.
2. Ignore the pre-existing "AI tagger" pipeline (user not familiar with it).
3. **Read-only Geo queries are allowed.**
4. "Verify" ranked: **C** rule compliance > **A** sources contain the position > **B** taxonomy/quality. **Rules live inside the agent** (the taxonomy's own "When to use" rules). Editors may give **context** about a dataset, never new tags or rules. Same principle later for bounty reviews (bounty text is input the agent reads).
5. Invoked **on demand by an editor**. Design **both** execution modes (Claude Max subscription and Claude API); the model/mode split is mine to design — "the area I care about most".
6. Repo freshly cloned; Notion MCP connected; assume **`NOTION_TOKEN` will live in `.env`**.
7. Output = **proposed tag(s) + a 0–1 confidence per tag per claim**; humans evaluate in Notion after runs. Requesting editor input is welcome (shape mine to propose).
8. Bounty↔proposal linkage: **`Need more info`**, assume solvable.
9. Agent creates its own columns (agreed: `Proposed Claim Tags`, `Tag confidence`, `Proposed tag notes`; I added `Agent review state`). One claim can carry several tags.
10. **No run report for the MVP** (reporting is big-picture). Default batch size with an override.
11. Evidence = **only the sources attached** on Geo (no web search for corroboration).
12. Claude Code CLI acceptable; WSL fine; no native Windows requirement.
13. **Moving agents out of content-management = "great idea"; content-management should be a pure skills library.**
14. **Verified tags only** (D1) — document this. Reuse **ontology-advisor** for ontology bounties (D2) — document this. A **new agents repository** is ideal (D3).
15. Big-picture output: a new Notion page or a Geo proposal; shape doesn't matter yet; **the review is for the curator** to fix their submission.
16. No hosting constraints. Yes to an evaluation harness + gold set. No extra hard limits.

---

## 5. Key facts established (verified live unless marked)

**Notion**
- Claims mirror: DB **"World affairs debate claims (1)"** id `0e2273e214eb83b0a2b1013e7d0958fc`, data source `collection://eec273e2-14eb-8349-a416-074a30396303`, view "QA review" `2b0273e214eb83ec884888873d57cceb`. **1,911 rows**, all tagged Debate (34 Featured, 14 Is factual). Columns: `Geo Name/ID/URL/Is factual/Name source/Tags/Score/Topics/Sources/Related people/Related projects/Supporting arguments/Opposing arguments`, `Proposed Tags/Topics/rename`, **review columns (all empty): `Review status` (To review | Reviewed), `Review notes`, `Claim Tags — verified` (relation → the taxonomy)**. `Geo Sources` holds names hyperlinked to Geo entity pages, not web URLs. **776 rows (41%) have no sources.**
- Taxonomy: DB **"Claim Tags — verified"** id `f05273e214eb8353b0a981544507de32`, data source `collection://b65273e2-14eb-8362-86a6-870ea8d632f4`. **29 tags**: Status Verified 13 / Proposed 14 / empty 2; fields Category, Polarity (Classification | Positive | Issue), Counterpart, Description, **When to use (decision rules written for an AI tagger)**, Example Claims, Geo Status, Geo Tag ID, Evidence (calibration report `3cf273e214eb81f2a815e7a751512a07` — **not accessible** to the connected account). The 13 Verified: Debate, Opinion, Hypothetical, Factual, Multiple statements, Improperly sourced, Unsourced, Self-contained, Context-dependent, Editor verified (human-only), Predictive, Simple, Single core statement.
- Agent Composition catalog (`3dc273e214eb814088b8de2e3184f988`): 4 DBs (MDs & documents 51; Skills 18; AI workflows 15 wf / 118 steps; Connectors 8); agent roles taxonomy incl. "Quality review agents"; report-writing standard `3dd273e214eb81d5aba6d4f27da8c9ba`; publication contract `3dc273e214eb818aacf3c92e1146bd1a`; installable repo page `3e2273e214eb81aa8959e12f3196edb2` (names **both** `MantasTech/geo-editor-agent` and `geo-explorers/geo-editor-agent`).
- **The Notion MCP connector hit the workspace "Query Data Source" usage limit mid-session** → bulk work must use the integration token (REST, ~2.5–3 req/s). Subagents generally lack MCP Notion tools (though Haiku subagents did have them in this session).

**Geo**
- Bounty = entity of type Bounty `808af0bad5884e3391f09dd4b25e18be` (props Task status, Difficulty, Bounty budget, Creator, Maintainers; body = Blocks). Curator site is an SPA; data via `api-testnet.geobrowser.io/graphql`. Curator API `https://curator-api-staging-testnet.up.railway.app/space/<s>/bounty/<b>/submissions` returned `{"submissions":[]}` for both examples.
- Evaluation pages = `Page` entities in a *datasets* space named `"<Curator> — <bounty> — submission review · <date>"`, with a text block (bounty link, "Proposals reviewed" governance links, "Last reviewed") + collection data block(s) of **`Review finding`** entities (type `b14985a95e0c5a3ca872f29e22719ace`; columns Related entities | Full original statement | Exact excerpt under review | Issue | Sources | Evidence detail). Backlinks = 0 (reviews not linked from Bounty). Many relation targets are unresolved stubs (entities only inside unaccepted proposals).
- **Proposal contents are readable**: `proposal(id)` → `proposalActions.contentUri` (`ipfs://…`) → gateway (pinata worked; ipfs.io reset; lighthouse 402) → `@geoprotocol/grc-20` `decodeEditAuto` → ops. Tested on `df516852a6534acfb35e4eb72ff71ac8`. Proposal entities can carry a **`Bounties` relation** (read by PR #52).
- Claim Sources: relation type `49c5d5e1679a4dbdbfd33f618f227c94` → **Article** `a2a5ed0cacef46b1835de457956ce915` (99%) → **Web URL** property `412ff593e9154012a43d4c27ec5c68b6`; scope `valuesList` by spaceId; 0.4% of edges lack a URL; 40 claims per batched query ≈ 0.6 s.
- World affairs space `89bd89bf28ff8a0963faf92a8c905e20`; datasets sibling `da96a4c26e718bfa6c27c3b1f3c316cd`.
- geo-query SKILL.md is stale on 4 facts: `POSITION_ASC` is case-insensitive server-side (ASCII sort needed); `entity.name/description` aggregate across spaces; `createdAt/updatedAt` are epoch-second strings (the skill's ISO example returns 0); collection blocks carry `Properties` column relations.

**Environment**
- node v26.10.0 present; **bun NOT installed**; `.env` absent; `gh` CLI works (used for PR #52/#38 and geo-editor-agent tree); python3 present. Both repo verifiers crash on Windows cp1252 unless `PYTHONIOENCODING=utf-8`.
- Bash heredocs with long markdown repeatedly failed on quoting in this Git Bash — use the Write/Edit tools for multi-line files.

**Claude platform (official docs, 2026-10-09)**
- Prices per MTok: Opus 5.5 $4/$20 (cache read $0.20); Sonnet 5.5 $2/$10 ($0.10); Haiku 5.5 $0.10/$0.50 ($0.01); Batches = 50% off; 1h cache write = 2x. Structured outputs: `output_config.format`, no numeric min/max, `additionalProperties:false`. Claude Code: skill descriptions capped at **1,536 chars combined**, SKILL.md should be **<500 lines**; subagent frontmatter supports `model`, `tools`, `skills`, `maxTurns`, `effort`; `claude setup-token` gives a 1-year subscription token for scripts; **Routines** = cloud-scheduled runs for Max (min 1h). Managed Agents: Agent (versioned) → Sessions; skills discovered from a mounted repo **only at root `.claude/skills/<name>/`**; vault env-var credentials; scheduled deployments; +$0.08/running session-hour; beta; needs an API account.

---

## 6. Design decisions (summary; full text in 04-design.md)

**User-flagged:** D1 Verified tags only · D2 reuse ontology-advisor · D3 agents → new repo, library stays pure.

**Mine (DD):** one pipeline, two judge adapters (session vs API); decisions come from files, never transcribed; `Unsourced` is computed, source-reading tags judged only with verified quotes else `cannot_tell`; per-tag verdicts (4 counterpart pairs as forced choice + 3 flags) each with 0–1 confidence; floor 0.60, Needs-editor band 0.60–0.75; **the human confirmation column is the gold set** (bootstrap with a stratified 100-row double-labelled set, Wilson intervals, kappa first); Notion via integration token, Geo read-only via `lib/gql.mjs`; prompt-injection frame (page text = data) + schema validation; resumable/idempotent (queue = empty `Agent review state`, idempotency key); **extractor worker** returns verbatim quotes verified as substrings before the judge sees them; three-state verdicts; write allowlist in code; 2.5 rps; default model Opus 5.5 with the eval deciding downgrades; big picture reuses **PR #52 stage 0** as collect/reconstruct, with policy moved to config and publishing/votes human-gated.

**MVP loop (13 steps):** precheck → roster → queue → enrich (Geo) → fetch → extract quotes → **judge** → calibrate/plan (dry run) → editor types `publish` → write → read-back → ledger → human review in Notion.

**Big-picture loop:** intake (log task) → collect proposals (GraphQL → IPFS → decode) → reconstruct → classify kind → checks C1 rule compliance / C2 claim tagger / C3 ontology (kind 2) / C4 duplicates / C5 schema → synthesize Review findings → draft report (Notion page or Geo proposal) → human approval → publish/share → follow-up diff on resubmission.

**Repo:** content-management → pure skills library (signed tags, `runtime/` with the single write path, CI required); **geo-editor-agent → the agents repo** (vendored skills at root `.claude/skills/`, `skills.lock.json` sha256, `.claude/agents/`, config with ids); 8-step migration in 08.

---

## 7. Audit headlines (file:line evidence in `audit/`)

Severe (S): armed delete scripts with live defaults (`01_entity_operations.ts`, `DRY_RUN=false` in 05/07/09/10/11, `08` fails open without TTY); circuit breaker ignores `deleteEntity` and is per-call; `.claude/settings.json` auto-approves publish-capable commands and `curl *` with the key loaded, `.env.geo-publish` not git-ignored (public repo); CLAUDE.md self-heal fetches **unpinned `main`** with circular verification; delete routing contradicts Hard Rule 3, geo-publish Gate-1 duplicate query is invalid GraphQL, geo-orchestrate publishes on one "go".
Major (A): integrity CI **not required and red since 2026-09-25** (geo-mirror hash hand-edited); geo-query stale (4 facts); retired endpoint `testnet-api.geobrowser.io` hardcoded in ontology-advisor + geo-discovery (their helpers are dead); no prompt-injection guard anywhere; tier labels wrong ("non-actionable" skills write Notion; PR #52 publishes and votes); skill descriptions blow the 1,536-char budget; 3 SKILL.md > 500 lines.
Other: 18 GraphQL + 8 Notion client copies; 7 copies of the space list; bun/node conflicts, two lockfiles with different SDK versions; Windows unsupported; two Work trackers; two Notion identities.
Prior art: **Draft PR #52 `geo-submission-review` v0.6.2** (mufasasa, 2026-10-03, +1,843 lines, 56 tests) — the three example evaluations match its output. PR #38 (trim main to 5 skills) open since 2026-09-01. `geo-explorers/geo-editor-agent` is **public** and vendors the repo at fd013a1.

---

## 8. Open items / Need more info

1. **Bounty ↔ submission ↔ proposals linkage** — no single authoritative source. Designed fallbacks: `Bounties` relation on proposals → same `proposedBy` in the bounty window (main + datasets) → Curator API submissions → editor-pasted links → `needs-identification` queue.
2. Calibration report page `3cf273e214eb81f2a815e7a751512a07` not shared with the connected Notion account (optional).
3. Whether `claude -p` headless runs share Max usage windows; what happens if `--bare` becomes the headless default.
4. geo-editor-agent URL disagreement (MantasTech vs geo-explorers) and ownership.
5. **No Work tracker row and no QA issues were created in Notion** for this session (AGENT-WORKFLOW asks for both). Offered to the user; not done.
6. Not yet verified with a live token: Notion server-side `relation is_empty` filter; whether `Claim Tags — verified` is a dual relation; the taxonomy DB's reverse relation points at a *different* claims collection (`67a1940f…`) than the mirror (`eec273e2…`) — check wiring before creating `Proposed Claim Tags`.
7. Whether rejected proposals' IPFS payloads persist indefinitely (a 2026-10-02 one did).

---

## 9. How to continue in a new session

- Read this file, then `04-design.md` and the skeleton you need. Grep `01-log.md` for any id or fact before re-deriving it.
- To update the artifact: `Artifact read url:https://claude.ai/artifact/58bibLGuYwkAvftdsNUvqm` → edit `special-agent/artifact/geo-review-agent.html` → publish with the same `url`.
- Follow the repo contract: **never write Geo by hand**; any publish goes through geo-publish; deletes through geo-clean; never read/print `.env`. If a session will touch the Agents flow Notion teamspace, log a Work tracker row first (`Projects = Agent flows`, Work tracker `collection://21bdbf37-b876-4ab5-8608-7fa7e42bd8a3`) and file problems in the QA issue tracker (`collection://d9398afb-b542-4c9a-931a-b279f1acd2b2`).
- Reuse the fetched sources in `special-agent/sources/` instead of re-fetching (Notion MCP has quota; the taxonomy DB refuses rows/view queries with ">1000 distinct mention targets" — SQL mode or per-page fetch only).
- For Geo reads use `node lib/gql-cli.mjs '<query>'` (bun is absent); scope by space; batch ≤40 claims with nested relations filtered by typeId.
- Likely next steps the user may ask about: implementing the MVP skill in geo-editor-agent; triaging PR #52; the library hygiene PRs (risks 1–5); writing the judge rubric from `sources/verification-specs.md`; building the 100-row gold set; costing/scheduling Mode B; a Managed Agent pilot.

---

## 10. One-paragraph version

We interviewed the user to a firm contract (verified-only tags, agent-internal rules, read-only Geo, sources-only evidence, four agent-owned Notion columns with per-tag 0–1 confidence, on-demand CLI runs, both Max and API modes, agents moving to a separate repo), audited the repository with five parallel agents (five severe risks, red integrity CI, a self-update supply-chain hole, stale skills, and a draft PR that already does half of the bounty review), verified live that proposal contents are decodable from IPFS and that claim sources resolve to Article URLs, and produced a design where a deterministic Node pipeline does everything except one judged step, which is swappable between Claude Code subagents and the Messages API. The published artifact presents it in eight tabs; `special-agent/` holds every source, audit, and design file.
