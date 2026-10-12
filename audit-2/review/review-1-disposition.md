# Disposition of review-1 (Opus 5.5 reviewer, 2026-10-11)

Reviewer verdict: close to meeting-ready; 4 blocking, 22 should, 13 could; ~965 words of cuts; 6 structure suggestions.

## Applied

**All 4 blocking**
1. Script count → "13 one-off maintenance scripts" (text + diagram + P0 checklist).
2. KPI → "9 severe findings in the fix backlog" (matches the backlog's S count).
3. Orientation box on tab 1 (Geo, claim, skills, agents, QA agent) + new glossary entries Geo, claim, QA agent, wallet key (and later: space is covered inside the Geo definition).
4. Realism gap P1–P3 → new first bullet in "Debt we deliberately carry" (skills needing shared code run from a library checkout; geo-agents vendors skills + one Notion client + one read-only Geo client); agents tree gains `docs/` (moved documentation) and the `shared/` comment; library tree shows `scripts/` and `validate_migration.ts` as still used until P3; "Done when" for P1 adds "the moved agents run from geo-agents".

**All 22 should**: cost row 200–400k tokens + lower-bound note; judgment example model → claude-opus-5-5; sourcesChecked/Unreadable → 1/0; review JSON gains `findings` (short entry) + field table gains id/lastReviewed/confidence; "with move" redefined (fixed in the library during P1, before the release the agents start on) and P1 row says so; row 8 (delete routing, S) → before move (counts: before 10 / with 5 / after 16); row 10 wording (required now, shared code in P3); phase table → 5 columns (Done when moved to engineer details); phase diagram redrawn with P2 ∥ P3 after P1, "library snapshot released as v1.0.0", strangler bars removed; P2 owner → two editors; glossary tag/release mentions the commit; "breaks silently" → "stops working"; row 27 reworded (geo-publish alone); Routines marked research preview + bare mode skips subagents; "should change rarely"; "Why one agents repository" note box on the Target structure tab (answers footnote *1); Supported example → factual pair (Leeds rents); P0 row in plain words; backlog gains dfn markers + rows 15/19/28/30 reworded; new glossary entries MVP, JSON, schema, eval, precision and recall, canonical space, maintainer, Curator API, report standard, Routines; tab-1 jargon replaced (supply-chain sentence, diagram labels); first-use dfn markers added per tab (taxonomy, bounty, tag, Managed Agent on tab 1; allowlist, self-heal, Managed Agent on the path tab; dry run, read-back, subagent, orchestrator, judge, gold set on the QA tab; orchestrator, judge, dry run, rubric, gold set, Routines on the run tab); unattended bullet → engineer details.

**All 13 could**: masthead "repository audited 9 October 2026"; subagent definition names both roles; IPFS plain wording; hard rules titled "(increments 1 and 2)"; local paths phrased as "working files in the repository"; two Notion identities folded into row 20; "already implements" (not "at scale"); library tree additions; "(P3 target: each under 500 lines)"; reasoning text without "matches"; nested-discovery parenthesis moved to skills; Managed Agents "once P1 is done and the Notion token has moved to the vault"; which-way rows merged.

**Cuts**: ★1 run pseudocode → details; ★2 roles table → details; ★3 what-lives-where reduced to 3 rows; ★4 done-when → details; ★5 why-subagents + unattended → details; 6 "what changed" → one line; 7 marketplace bullet shortened; 8 Later row shortened; 9 QA lede → one sentence; 10 closing paragraph trimmed; 11 "what keeps working" → one sentence in the figcaption; 12 backlog lede shortened; 13 open items trimmed (internal process + wiring checks dropped); 14 "no download" phrase kept once in the lede. Repetition: the quote-gate correction now appears in D7, the tab-1 one-liner, the QA warning and the Sources caveat (the quality-loop sentence was removed).

**Structure**: reordered to Where we are → Target structure → Migration path → QA agent → How agents run → Backlog → Sources; tabs renamed ("Target structure", "How agents run", "Backlog"); phase diagram shows the parallel lanes.

## Not applied, with reason
- **Preselect the S filter on the backlog.** Hiding 22 of 31 rows by default would make the ranked list look incomplete on first open; the count line already reads "31 of 31 rows" and one click shows the 9 S rows. The before-move rows are the P0 list, already summarised in the P0 phase row.
- **"Space" as a separate glossary entry.** Covered inside the Geo definition ("organised in spaces") and the canonical-space entry; a third entry added noise.

## Post-rewrite checks (2026-10-11)
JSON: 3 blocks parse, canonical pretty-print, ≤23 lines, ≤74 chars. Glossary: 46 terms used, 46 defined, 0 orphans either way. Tables: max 5 columns. Browser: no horizontal overflow (desktop and 510 px pane), no console errors, strips generated on 6 tabs. Body words ≈ 3,600 excluding the glossary (≈ 1,000 of them inside collapsed engineer details).
