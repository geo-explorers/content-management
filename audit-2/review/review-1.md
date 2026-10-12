# Review 1 — geo-agents-migration-plan.html (2026-10-11)

**Verdict.** Close to meeting-ready. All brief requirements and D1–D10 are covered, and the MVP correction is clean: quote matching appears only where the document describes what changed.
**Must change (4 blocking):** two headline numbers on tab 1 are wrong or contradict tab 3 ("eleven" scripts; "5 severe risks" against 9 S rows). Tab 1 never says what Geo, a claim, the wallet key or the QA agent is. The migration path does not say which skills and agents can actually run from `geo-agents` between P1 and P3.
**Should change:** the cost table's subscription row and the JSON examples have internal inconsistencies. The "with move" backlog rows require library edits after the v1.0.0 tag, which breaks the sequence. The phase table has 6 columns, and tabs 3, 5 and 6 still carry unexplained jargon.
**Cuts:** about 900 words can move into the collapsed engineer details or be dropped without losing anything the meeting needs. Priority cuts are marked ★ (about 560 words).
**Structure:** put the target structure before the route. Treat the backlog as an appendix.

---

## Blocking

1. `[Where we are · Status in five points]` "Skills, agents and eleven one-off scripts share one public repository", plus the diagram's "11 at the root". **Problem:** this is wrong. The repository root holds 13 numbered scripts (`01_…` to `11_…`, plus `02.3_…` and `02.5_…`) and also `testing.ts`. The P0 checklist calls them "the root `01…11` scripts", which is where the 11 came from. **Fix:** "Skills, agents and 13 numbered one-off maintenance scripts share one public repository." Diagram: "13 at the root; several write or delete Geo data by default".
2. `[Where we are · KPI strip]` "5 · severe risks found by the audit", against `[Fix backlog · counts]` "By severity: S 9". **Problem:** the first screen and tab 3 disagree. The 5 is the merged "top risks" list in `03-repo-audit.md`, where risk 5 bundles three problems; the backlog splits them out. Stakeholders will notice. **Fix:** change the KPI to "9 · severe (S) findings in the backlog", or keep 5 and add the label "5 severe risk areas (9 backlog items)".
3. `[Where we are · lede + Decisions]` "One public repository does three jobs today…" **Problem:** a product manager never learns what Geo is, what a claim is, what a "space" is, what the "wallet key" protects (it appears in point 3 and in the diagram) or what the "QA agent" does. The QA agent is first explained on tab 5. **Fix:** add a 2-sentence orientation before the lede: "Geo is the public knowledge graph our editors publish to; a *claim* is one statement in it, with sources attached. The *QA agent* checks claims and bounty submissions for editors." Add glossary entries for **wallet key** ("the private key that signs every publish to Geo; whoever holds it can write or delete as the team"), **Geo**, **claim** and **space**, and mark them with `<dfn>` on first use.
4. `[Migration path · P1 row]` together with `[Two repos · What lives where]` "Nothing of its own, except one small Notion client". **Problem:** the realism gap. Vendored skills that call library-root code break inside `geo-agents`, just as they broke in geo-editor-agent: geo-mirror Part 2 and geo-claim-grouping import `../../../../src`, geo-clean uses `validate_migration.ts`, and geo-press-review uses `scripts/`. The moved geo-research agent reads `content-management/documentation/`, but the library tree removes `documentation/` and the agents tree has no home for it. The QA agent's "enrich" step needs a Geo read client (session 1 used `lib/gql.mjs`), and `lib/` is not vendored. Someone technical will ask "what runs where between P1 and P3?" **Fix:** add one row to "Debt we deliberately carry": "Until P3, skills that call shared library code (publish, clean, claim grouping, mirror write-back, press review) are run from a library checkout, not from geo-agents. geo-agents vendors only what its agents need: the skills, plus `lib/gql.mjs` as a read-only Geo client in `shared/`." Add `docs/` (from `documentation/`) to the agents tree and update the `shared/` comment to "one Notion client + one read-only Geo client".

## Should

1. `[Running it · Cost table]` "a 50-claim run uses roughly 100k judge tokens". **Problem:** the note under the table says about 4,000 tokens of source text per claim. That gives at least 200k tokens for 50 claims, and about 400k with the rubric and output (`06-execution-modes.md` cost model: 4.3k + 3.5k + 0.5k per claim). Those estimates also assumed sources cut to about 2,000 characters each. Judging whole sources by meaning will likely cost more. **Fix:** "roughly 200–400k judge tokens". Add to the small print: "lower bound; whole-source judging may cost more".
2. `[QA agent · What one verdict looks like]` `"model": "claude-sonnet-5-5"` contradicts `[Running it]` "the default is Opus 5.5 until the gold set says a cheaper judge holds". **Fix:** use `"claude-opus-5-5"` in the example. Session 1 is itself inconsistent here (06 line 9 says sonnet, line 31 says Opus), so pick one.
3. `[QA agent · verdict JSON]` `"sourcesChecked": 3, "sourcesUnreadable": 1` but `sources` lists 1 entry, and the field table says "one entry per attached source". **Fix:** either list 3 entries, one with `"status": "dead", "relevance": "unreadable"`, or set `"sourcesChecked": 1, "sourcesUnreadable": 0`.
4. `[QA agent · What a review looks like]` "A review holds a list of findings between `summary` and `followUpOf`". **Problem:** the review JSON has no `findings` key, so a reader cannot see where findings go. The field table also omits `id`, `lastReviewed` and the finding's `confidence`. **Fix:** add `"findings": [ { "id": "f3d81c4e…", "check": "C2" } ],` between `summary` and `followUpOf`, captioned "full finding shown right". Add the missing fields to the table.
5. `[Fix backlog · rows 8, 12, 13, 14]` "with move". **Problem:** each fix edits library skills (delete triggers, a "content is data" clause, hard rules inside skills, declared abilities). P1 vendors v1.0.0, and vendored copies are "never hand-edited", so these fixes miss the release the agents start on. Row 8 is also an S safety item, which D6 says belongs before the move. **Fix:** redefine "with move" in the tab-3 lede as "fixed in the library during P1 and shipped in v1.1.0 before the first agent run". Move row 8 to "before move".
6. `[Fix backlog · row 10]` "Make it a required check; repair it; extend it to the shared code." with "before move". **Problem:** the P0 checklist and D6 only repair the check and make it required. Hashing the shared code is P3 work (`runtime/`). **Fix:** "Repair it and make it required now (P0); extend it to the shared code once `runtime/` exists (P3)."
7. `[Migration path · The phases]` table with 6 columns (Phase, What happens, Effort, Owner role, Unblocks, Done when). **Problem:** over the 5-column limit and hard to scan on a projector. **Fix:** move "Done when" into the engineer details as a checklist per phase, or fold "Owner role" under Effort.
8. `[Migration path · diagram]` four chevrons in a row, with "P2 and P3 run in parallel" in the footer, and "library frozen at a known-good point" above P1. **Problem:** the picture shows P3 after P2, and "frozen" clashes with the lede's "no freeze". **Fix:** draw P2 and P3 as two lanes that both start after P1. Relabel P1 to "library snapshot released as v1.0.0". Drop the unexplained "old shared code shrinks / runtime grows" bars.
9. `[Migration path · P2 row]` "Agent developer; an editor from the content team". **Problem:** `[QA agent · Quality loop]` says "two editors label the same 100 rows". **Fix:** change the owner to "Agent developer; two editors (gold-set labelling)".
10. `[Sources · Glossary]` "tag / release — A named, immutable point…" contradicts `[Sources · Best practices]` "tags can be moved, hashes cannot". **Fix:** "A named point in the library's history (v1.0.0) that consumers pin to. Because a tag can be moved, the lock file also records the exact commit."
11. `[Where we are · point 2]` "so a skill copied anywhere else breaks silently". **Problem:** unsupported. A missing import fails with an error; the audit uses "silently" only for agents losing MCP tools. Strictly, these skills also work in any repository that has `src/` at its root. **Fix:** "…so a skill copied anywhere else stops working."
12. `[Fix backlog · row 27]` "about 19,000 tokens load before the first query". **Problem:** misattributed. `skills-quality.md` B5 gives this figure for geo-publish alone (its SKILL.md plus the mandatory ONTOLOGY.md). **Fix:** "The publishing skill alone loads about 19,000 tokens before its first query, and skill descriptions together exceed Claude Code's budget, so skill selection suffers."
13. `[Running it · Unattended on the subscription]` "Two supported options exist… Routines". **Problem:** Routines is a research preview (`claude-platform-facts-v2.md` #6). The bare-mode caveat also understates the risk: bare mode skips subagents (#5 and notes), and the default design depends on subagents. **Fix:** "Two options exist: … and Routines (a research preview) …. Caveat: a future default for `-p` ('bare mode') ignores that token and skips subagents, so unattended runs must set the mode explicitly."
14. `[Where we are · Why two repositories]` "The library changes rarely… Agents change weekly." **Problem:** stated as fact but unsupported. The git log shows frequent skill changes (#43–#51 in September). **Fix:** "The library should change rarely and carefully…; agents change often."
15. `[Two repos]` (footnote *1). **Problem:** "all agents in one repo, or many?" is answered only inside D4 on tab 1 and in a Sources row. The brief asked it explicitly. **Fix:** add a short note box under the tab-4 lede, "Why one agents repository, not one per agent": shared vendored skills, one lock and one CI; hosted runs mount one repository; changes across agents land in one pull request. "An agent moves to its own repository only if it needs its own owner or release rhythm (D4)."
16. `[QA agent · The four verdicts · Supported]` "Claim: 'The US should sanction banks in allied countries…' Source: a news report on Treasury sanctions against a Turkish bank". **Problem:** a factual report does not obviously support a normative "should". Many readers would call this Partially supported, and it invites a debate in the meeting. **Fix:** use a factual pair, e.g. claim "Rents in Leeds rose about 12% in 2026"; source "Leeds rents up 12.1% year on year".
17. `[Migration path · P0 row]` "retire the one-word publisher and the self-voting publisher, fix the broken duplicate check". **Problem:** these names are only explained on tab 3, which comes later. **Fix:** "retire two shortcuts that can publish to Geo without the normal confirmation, and fix the check that should stop duplicates".
18. `[Fix backlog · whole table]` **Problem:** the tab has no `*` markers at all. Rows a product manager cannot follow: 2 "auto-approve allowlist", 4 "self-referential check", 15 "removed software-kit functions", 16 "sort order differs from the UI", 17 "retired server address", 19 "old naming scheme for relationships… collide", 27 "tokens", 28 "Two runtimes and two lockfiles pin different kit versions", 29 "skills index", 30 "change-notification workflow posts large diffs… spreadsheet library". **Fix:** add `<dfn>` markers for allowlist, self-heal, circuit breaker, write path and hard rules, so the tab gets a terms strip. Plain-word rewrites: 28 "Two different toolchains are in use, with conflicting versions"; 30 "The bot that posts repository changes to Discord has broad permissions; a spreadsheet-reading library has known security flaws".
19. `[QA agent]` **Problem:** undefined terms: "MVP" (card 1), "precision and recall" (Quality loop), "eval", "schema" ("against the schema"), "JSON" ("verdict JSON" in the diagram), "canonical space" (C4 and the Duplicate finder), "maintainer" ("The maintainer approves"), "Curator API", "the team's report standard". **Fix:** add glossary entries. Suggested: precision = "of the rows the agent called X, how many editors agreed"; recall = "of the rows editors called X, how many the agent found"; canonical space = "the curated Geo space that holds the accepted version of a topic"; maintainer = "the person who runs the bounty and accepts or rejects submissions".
20. `[Where we are · point 5 + diagram]` "That is a supply-chain hole, not a safeguard." Also in the diagram: "7 of 15 import by path", "src/ lib/ and the .env file", "install script copies skills flat". **Problem:** jargon on the most-watched tab. **Fix:** "Anyone who gets a change merged could change what every agent does on its next run." Diagram labels: "7 of 15 depend on shared code", "shared code + key file", "the install copies lose the shared code".
21. Missing per-tab markers. These terms are used on a tab without `<dfn>`, so that tab's strip omits them:
    - Tab 1: taxonomy and Verified tags (D1), bounty (D2), tag/release (D6), Managed Agent (D9).
    - Tab 2: self-heal, allowlist (P0 row), Managed Agent (Later row).
    - Tab 5: dry run, read-back, subagent, orchestrator (roles table). The judge and the gold set are used before their markers, in card 2 and in the diagram.
    - Tab 6: orchestrator, judge, dry run, rubric, gold set, Routines.

    **Fix:** mark the first use of each term on every tab. The JavaScript already de-duplicates per tab.
22. `[Running it · Default]` "spawns up to five judge subagents, ten claims each… Usage… Unattended…". **Problem:** `claude -p`, `claude setup-token`, "the flag must be pinned", "usage window" and "context" are engineer-level. **Fix:** keep the first paragraph. Move the "Unattended on the subscription" bullet into an engineer `<details>`.

## Could

1. `[Masthead]` "content-management @ fd013a1". The commit hash means nothing to stakeholders. Use "audited 9 Oct 2026".
2. `[Glossary · subagent]` "Here: the judge." Tab 4 also makes the orchestrator a subagent. Use "Here: the orchestrator and the judge."
3. `[Glossary · IPFS]` "content-addressed storage". Use "a public file network where each file is found by a fingerprint of its content".
4. `[QA agent · Hard rules for the agent]` "Never writes Geo." Increment 3 can publish Review findings. Retitle to "Hard rules (increments 1–2)".
5. `[Fix backlog · counts]` "`special-agent-2/drafts/backlog.md`", plus `[Sources]` "`special-agent-2/research/best-practices-v2.md`" and the footer paths. Published viewers cannot open local files. Replace with "audit references available on request" or link the repository.
6. `[Fix backlog]` D8 says "all audit findings", but the "two Notion identities" finding (`architecture-coupling.md` way-of-working table) has no row. Fold it into row 20 or 25.
7. `[QA agent · last paragraph]` "PR #52 already proves the collect-and-decode step at scale". "At scale" is unsupported; the audit says 56 tests, and the three example reviews match its output. Use "already implements the collect-and-decode step".
8. `[Two repos · library tree]` "`lib/ src/` … stays until P3, writes gated". "Writes gated" is unclear and is not a P0 item. The tree also omits root `scripts/` and `validate_migration.ts`, which skills still call. Add them with the comment "still used by skills until P3".
9. `[Two repos · diagram]` "15 skills, each under 500 lines". Today 3 exceed 500 lines (backlog row 27). Label it "(P3 target)".
10. `[QA agent · verdict JSON]` `"reasoning": "Paraphrase matches: 12% rent rise, but only in one city."` "Matches" echoes the dropped matching idea. Use "Same meaning for one city; the claim covers two."
11. `[Two repos · engineer details]` "subagents from `.claude/agents/` (nested folders are discovered on demand)". The research confirms nested discovery for skills, not subagents. Move the parenthesis after `.claude/skills/…`.
12. `[Running it · Managed Agents]` "It fits the read-only checker as soon as P1 is done". `03-repo-audit.md` Q1 lists about 6 hosting blockers. Say "once P1 is done and the Notion token moves to the vault".
13. `[Running it · Which way, when]` The first two rows both say "A · subscription". Merge them: "First runs, editor present, re-judging single claims".

---

## Cuts (target 400–800 words; ★ = do first)

| # | Cut | Words saved |
|---|---|---|
| ★1 | Tab 5 "One run, as pseudocode": move into a collapsed engineer `<details>`. The swimlane shows the same 10 steps. Pseudocode stays available, as the brief asks. | ~110 |
| ★2 | Tab 5 "Roles" table: move into engineer details. The check matrix's "Who decides" column carries the same split. | ~110 |
| ★3 | Tab 4 "What lives where" table: cut, or keep only the "Hard rules" and "A new skill born with an agent" rows. The trees and the diagram already show the rest. | ~120 |
| ★4 | Tab 2 "Done when" column: move into engineer details. This also fixes the 6-column table. | ~110 |
| ★5 | Tab 6 "Unattended on the subscription" bullet, and the "Why subagents" bullet (repeats tabs 4 and 5): move into details. | ~105 |
| 6 | Tab 1 "What changed since the first design" note: reduce to one line, "Changed since 9 Oct: new repository (D5), meaning-based MVP (D7), tagging moved to increment 2 (D1)." It repeats the D-table directly above it. | ~45 |
| 7 | Tab 4 engineer bullet on plugin marketplaces: duplicates the Sources row. | ~60 |
| 8 | Tab 2 "Later" row: shorten to "Increments 2–3 and optional hosted runs; see QA agent." It duplicates the tab 5 cards. | ~45 |
| 9 | Tab 5 lede: cut to one sentence. The three cards say the same thing. | ~40 |
| 10 | Tab 5 closing paragraph after the review pseudocode: keep only the PR #52 reuse sentence. | ~50 |
| 11 | Tab 2 "What keeps working in every phase": reduce to one sentence under the diagram. | ~35 |
| 12 | Tab 3 lede: shorten to "Every audit finding, ranked. 'When' = where it sits in the migration, not urgency." Drop the local-path sentence in "Counts". | ~60 |
| 13 | Tab 7 Open items: drop "No Work tracker rows or QA issues were created…" (internal process) and the two Notion wiring checks (engineer detail). | ~55 |
| 14 | Tab 4: "nothing downloads skills while an agent runs" appears 3 times (lede, diagram footer, pseudocode "rule:"). Keep the lede only. | ~20 |
| | **Total** (★ only ≈ 555) | **~965** |

Repetition between tabs: the quote-gate correction appears 5 times (tab 1 D7, the tab 1 note, the tab 5 warning, the tab 5 quality loop, the tab 7 caveat); keep D7, the tab 5 warning and the caveat. "Fence first" is explained on tab 1 (D6), in the tab 2 lede and figcaption, and in the tab 3 lede. The client counts 18/8/7 appear on tab 2 (debt box) and in tab 3 row 24. The orchestrator/judge isolation is explained on tab 4 (anatomy), in the tab 5 diagram footer and twice on tab 6.

## Structure suggestions

- **Reorder** to match the meeting arc: 1 Where we are (status + case) → 2 Target structure (now "Two repos": repositories + agent anatomy) → 3 Migration path → 4 QA agent → 5 How agents run → 6 Backlog (reference) → 7 Sources. Show the destination before the route. A 31-row table in the middle of the meeting will derail it.
- **Rename** "Two repos" to "Target structure", "Running it" to "How agents run", and "Fix backlog" to "Backlog (reference)".
- **Backlog default view:** preselect the S filter ("9 of 31 rows"), and show the 9 S items as a "what P0 fixes" summary on the migration tab.
- **Phase diagram:** redraw with P2 and P3 as parallel lanes (Should 8). The tab 1, tab 4 and tab 5 diagrams earn their place because each shows a mechanism (coupling arrows, dependency direction, who touches what). The tab 6 judge-slot diagram is borderline; keep it, since it carries D9 visually.
- **Add the "Why one agents repository" box** on the target-structure tab (Should 15).
- **Tables:** everything is ≤5 columns except the phase table (6). The best-practice table (25 rows) is fine as an appendix.

## Fact-check results

| Claim | Result | Evidence |
|---|---|---|
| "7 of 15 skills work only inside this repository" | Verified, with nuance ("breaks silently" unsupported) | `architecture-coupling.md` §1 headline + coupling row 1: "7 of 15 skills reference `src/`"; they also work in any checkout that has `src/` at its root |
| "5 severe risks" | Verified, but conflicts with the backlog's 9 S rows | `03-repo-audit.md` Top risks 1–5 (S); `architecture-coupling.md` R1–R5; `Summary.md` §10 |
| "Integrity check red since 25 September" | Verified | `architecture-coupling.md` §1 + R6; `03-repo-audit.md` Q3; git log: `fd013a1` dated 2026-09-25 |
| "41% of mirrored claims have no sources" | Verified | `Summary.md` §5 Notion: "776 rows (41%) have no sources" (the mirror's `Geo Sources` column) |
| "About 18 Geo query clients, 8 Notion clients, 7 copies of the space list" | Verified | `architecture-coupling.md` R10; `skills-quality.md` B4 "Seven copies of the canonical space list" |
| "Eleven one-off scripts" | **Wrong** | Repository root: 13 numbered scripts (`01`–`11` plus `02.3`, `02.5`) and `testing.ts`; `architecture-coupling.md` R1 names 01, 05, 07, 08, 09, 10, 11 as armed |
| "1,911 claims" | Verified | `Summary.md` §5 Notion: "1,911 rows" |
| Cost per claim / total (Opus ≈$0.03 / $54; Sonnet ≈$0.015 / $27; Haiku ≈$0.001 / $1.4; half with batches) | Verified (rounded) | `special-agent/06-execution-modes.md` Cost model lines 23–31 ($0.028 / $0.014 / $0.0007); prices re-confirmed in `research/claude-platform-facts-v2.md` #8 |
| "A 50-claim run uses roughly 100k judge tokens" | **Wrong** (internally inconsistent) | Taken from `06-execution-modes.md` line 32, but that file's own model (4.3k + 3.5k + 0.5k tokens per claim) gives about 400k for 50 claims; the artifact's own note (4,000 tokens per claim) gives at least 200k |
| "Default judge Opus 5.5" | Unsupported as stated (the source contradicts itself) | `06-execution-modes.md` line 9 "default `sonnet`" vs line 31 "default Opus 5.5"; the artifact's JSON example uses Sonnet |
| geo-editor-agent "keeps every skill twice" | Supported (directory listing only; content not compared) | `special-agent-2/01-log.md` line 7 (gh tree: `skills/{actionable,non-actionable}` and `.claude/skills`); not stated in session-1 audits |
| "One skips its confirmation when nobody is at the keyboard" | Verified | `architecture-coupling.md` R1: "`08:178-179` skips confirmation when there is no TTY" |
| "About 19,000 tokens load before the first query" (row 27) | **Misattributed** | `skills-quality.md` B5: geo-publish alone (6.8k-word SKILL.md + 7.2k-word ONTOLOGY.md) |
| Routines: hourly at most, draws subscription usage | Verified; "research preview" status omitted | `research/claude-platform-facts-v2.md` #6 |
| Managed Agents: beta, API key, per-hour charge, root-level skills | Verified | `research/claude-platform-facts-v2.md` #7 ($0.08/session-hour) |
| `-p` future default ignores the setup token | Verified; it also skips subagents (not mentioned) | `research/claude-platform-facts-v2.md` #5 and notes |
| 13 Verified / 14 Proposed tags | Verified | `Summary.md` §5 Taxonomy (29 tags: 13 / 14 / 2 empty) |
| Every `<dfn data-t>` has a glossary entry | Verified (33 keys; no orphans either way) | Artifact `<dfn>` markers vs `#glossary dt[id^=g-]` |
| MVP presented as semantic; quote matching only in "what changed" | Verified | Artifact tab 1 D7 and note, tab 5 warning + quality loop, tab 7 caveat; no other quote-matching mention |
