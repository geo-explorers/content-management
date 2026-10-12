# Summary — Session 2: Geo Agents Migration Plan (handoff)

Written 2026-10-11 (Claude Code, Fable 5.1, repo `content-management` @ `fd013a1`, Windows 11 / Git Bash). Continuation of `special-agent/Summary.md` (session 1, 2026-10-09). Read this first; open other files only as needed.

## 1. What the task was
Distil session 1 into a **meeting-ready artifact** for a team technical meeting with non-technical stakeholders: current status, the case for separating repositories, how agents should be structured, a realistic non-blocking migration path, a severity-ranked backlog, directory structures for both repos, and the QA agent (ex "big picture") plan. Critiques of v1 to fix: unreadable compressed JSON, check matrix without a reading legend, and the MVP's verbatim-quote gate (wrong: Geo claims are LLM paraphrases of sources; the check must be a semantic LLM judgment).

**Status:** artifact written, self-checked, under independent review → publish. Nothing written to Geo or Notion.

## 2. Where everything is
| File | What it holds |
|---|---|
| `special-agent-2/00-brief.md` | The brief verbatim + both interview batches with answers |
| `special-agent-2/01-log.md` | Chronological log: facts, agents launched, decisions, counts |
| `special-agent-2/02-decisions.md` | D1–D10 with where each shows in the artifact |
| `special-agent-2/research/claude-platform-facts-v2.md` | 9 official-doc facts re-verified 2026-10-11 (Haiku) |
| `special-agent-2/research/best-practices-v2.md` | 31 practice rows in 5 areas with fetched URLs; v1 carry-over/drop list; caveats (Opus 5.5) |
| `special-agent-2/drafts/backlog.md` | 31 de-duplicated audit findings, S/A/B/C, before/with/after move, audit refs (Sonnet 5.5) |
| `special-agent-2/drafts/phases.md` | P0–P3 + Later with effort, owner role, unblocks, done-when (Sonnet 5.5) |
| `special-agent-2/drafts/contracts.md` | Judgment + review JSON (validated), field tables (Sonnet 5.5) |
| `special-agent-2/drafts/trees.md` | Both repo trees + one-agent anatomy + "what lives where" + upgrade flow (mine) |
| `special-agent-2/drafts/copy-blocks.md` | Verdict table, correction callout, check matrix + legend, glossary (mine) |
| `special-agent-2/artifact/geo-agents-migration-plan.html` | **The artifact source** (7 tabs) |
| `special-agent-2/review/review-1.md` | Independent Opus review report (+ later passes) |

**Artifact URL (current):** https://claude.ai/artifact/2y5sFt8o1L14fVyKqgfCe7 — the user's re-themed copy, edited via comments since 2026-10-11 evening. The original https://claude.ai/artifact/F6S4JVUKefs4dsHyDqcfKX (24 versions) was deleted/unshared on 2026-10-12. v1 artifact: https://claude.ai/artifact/58bibLGuYwkAvftdsNUvqm (linked from tab 7 as the full spec). Review report and disposition: `special-agent-2/review/review-1.md`, `review-1-disposition.md`.

**QA agent rework (2026-10-11, latest):** the MVP (Notion claim check) is dropped from the document (D7 revised). The QA agent tab is now big picture only, structured like v1's big-picture tab: assumption (bounty + complete submission are given), in/out cards, orchestration diagram (intake → reconstruct → classify → 5 parallel checks → synthesize → draft → maintainer gate → share/publish), "How the skills are used" table, roles, check matrix + legend, three formatted records (submission, review, finding), loop pseudocode, curator-facing output, hard rules, PR #52. How agents run was re-framed around check workers. A Fable reviewer (non-engineer persona, high LLM proficiency) reviews the tab; findings and the conversation are in `review/review-3-qa.md`.

**Rework after the user's redirect (2026-10-11, later):** the migration is now structural only ("separate first, fix later", D6 revised): 7 steps (inventory → releasable library + tag v1.0.0 → create geo-agents → vendor at v1.0.0 + shared/ read clients → move agents with supervised runs → cut over: trim library, tag v1.1.0, catalog page, archive geo-editor-agent → QA agent inc. 1 as first native consumer), drawn as two lanes (library / geo-agents) × three stages (prepare / build alongside / cut over). The Backlog tab became **Audit findings**: same 31 severity-ranked rows, "Migration" column = step N (7 rows) or independent (24 rows); no bug fixes ride along with the move. The P0–P3 phase model is gone everywhere.

**Comment-driven changes after publish (2026-10-11 evening):** developer's note on the effort figures placed top-left inside the phase diagram (green annotation palette); "The phases" expanded with a technical section "Why each item sits where it does" (severity rule, phase rule, per-row tables for P0 and P1, clustered table for P3) and every phase row lists its backlog ids as `#bl-N` links that switch to the Backlog tab, reset filters and highlight the row. The user drives further changes through artifact comments; place each edit at the thread's anchor.

**Tab order (current):** 1 Where we are · 2 Target structure · 3 Migration path · 4 QA agent · 5 Audit findings · 6 Sources. The "How agents run" tab was removed on the user's request (version 15); D9 on tab 1 records the run-mode decision.

## 3. Decisions (full text in 02-decisions.md)
D1 verified tags only → now increment 2 · D2 reuse ontology-advisor · D3 library stays pure · **D4 one skills library + one agents repo** (monorepo of agents) · **D5 new repo `geo-explorers/geo-agents`; geo-editor-agent is NOT a reference (user: vibecoded by the same devs)** · **D6 fence first, refactor later** · **D7 MVP = one semantic verdict per claim (Supported / Partially supported / Not supported / Cannot check) + confidence + reason; no quote gate** · D8 backlog = all findings, before/with/after move · D9 subscription-local default, API note, Managed Agents alternative · D10 phases + effort + owner role, no dates.

## 4. The artifact in one paragraph
Seven tabs. **Where we are**: four KPIs, five status points, a "one repo, three jobs" diagram, why two repos, the D1–D10 table, what changed since v1. **Migration path**: strangler-fig principle, a four-phase chevron diagram with a "normal development continues" bar, the phase table (P0 Fence 2–4 d · P1 Tag + new repo 1–2 wk · P2 QA agent inc. 1 3–5 wk · P3 Consolidate 6–10 wk spread · Later), debt carried, what keeps working, an engineers-only P0 checklist. **Fix backlog**: 31 rows with severity + when filter chips (before 9 / with 6 / after 16). **Two repos**: target diagram, both trees, one-agent anatomy, what-lives-where table, upgrade pseudocode, engineers-only rationale incl. the plugin-marketplace alternative and geo-editor-agent lessons. **QA agent**: three increment cards; increment 1 with the correction callout, verdict table (FEVER footnote), swimlane diagram, agent-owned columns, judgment JSON + field table, run pseudocode, hard rules, quality loop (incl. word-overlap test cases); increment 2 in one paragraph; increment 3 with roles, check matrix + legend, linkage fallback, review JSON (envelope + one finding) + field table, loop pseudocode, outputs, PR #52 reuse. **Running it**: judge-slot diagram, subscription default (subagents, `claude -p` + setup-token, Routines), API note, Managed Agents paragraph, which-way-when, cost table. **Sources**: 27-row practice table with URLs, caveats, open items, the glossary that feeds every tab's `*` strip.

## 5. Key facts added this session
- Official docs (2026-10-11): project skills `.claude/skills/<name>/SKILL.md`; subagents `.claude/agents/*.md`; plugin marketplace sources pin `ref` + 40-char `sha`; `claude setup-token` → 1-year token for `claude -p` (Pro/Max), `--bare` will become the `-p` default and ignores it; Routines min 1 h, draw subscription usage; Managed Agents need an API key, skills at repo root one level deep, vault env-var secrets, $0.08/session-hour; prices Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50, batch 50%.
- geo-editor-agent tree (gh api): `.claude/{agents,skills}`, `config`, `context`, `docs/`, `documentation`, `lib`, `scripts`, `skill-dev`, `skills/`, `src`, `tools`, AGENTS.md/CLAUDE.md/SECURITY.md/SETUP.md/UPSTREAM.md, `.upstream-sha`. Keeps skills twice; copied src/lib/scripts because of relative imports.
- Research: FEVER (Supported/Refuted/NEI) and AVeriTeC labels; "not supported ≠ false"; entailment framing (TRUE, SummaC); word-overlap bias (McCoy 2019); explicit abstain (Wen 2025); confidence as ranking (Xiong, Tian); free reasoning then schema; Amershi HAI guidelines; Bansal/Buçinca automation bias; Artstein-Poesio kappa; Brown-Cai-DasGupta Wilson; Fowler strangler fig / parallel change / branching; Google monorepo papers; Pro Git submodules; SWE-at-Google ch. 21; GitHub Actions pin-by-sha; SLSA.

## 6. How to continue
- To update the artifact: `Artifact read url:<URL from 01-log>` → edit `special-agent-2/artifact/geo-agents-migration-plan.html` → publish with the same `url`.
- JSON check: the node one-liner in 01-log (extracts `<pre>{…}</pre>` blocks, JSON.parse, canonical pretty-print check).
- Term strips are generated: add `<dfn data-t="key">word</dfn>` in a tab and a `<dt id="g-key">` + `<dd>` in the tab-7 glossary; the script does the rest.
- Open items are listed on tab 7 (linkage, repo ownership, calibration report access, headless usage, Work-tracker rows, Notion wiring checks).
