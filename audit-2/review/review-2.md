# Review 2: confirmation pass (2026-10-11)

Scope: the rewritten `artifact/geo-agents-migration-plan.html`, checked against `review-1.md` and `review-1-disposition.md`. "Could"-level polish is not re-listed.

## 1. Blocking findings from review 1

| # | Finding | Status | Evidence in the rewrite |
|---|---|---|---|
| 1 | "Eleven" one-off scripts | **Resolved** | Tab 1 point 1: "13 one-off maintenance scripts". Diagram: "13 at the root". P0 checklist: "the 13 numbered root scripts". One leftover: the tab 2 library tree comment still says "root 01…11 scripts". The range is accurate, but use "13 numbered root scripts" for consistency. |
| 2 | KPI "5 severe risks" vs 9 S rows | **Resolved** | KPI: "9 · severe findings in the fix backlog". Backlog counts: "S 9". |
| 3 | No orientation for non-technical readers | **Resolved** | Orientation box at the top of tab 1 (Geo, claim, skills, agents, QA agent). Glossary now has Geo, claim, QA agent and wallet key, and the wallet key is marked on first use. |
| 4 | Gap in what runs where between P1 and P3 | **Resolved** | First "Debt we deliberately carry" bullet names the skills that still run from a library checkout. `shared/` = one Notion client + one read-only Geo client. `docs/` added to the agents tree (geo-research's dependency). Library tree shows `scripts/` and `validate_migration.ts` as still used until P3. P1 "done when" adds "the moved agents run from geo-agents". |

**4 of 4 resolved.**

## 2. Reorder and phase diagram

- **Tab order is as planned:** Where we are → Target structure → Migration path → QA agent → How agents run → Backlog → Sources. The tab ids and the JavaScript still work, since the order comes from the button and section order.
- **Phase diagram redraw is clean.**
  - P0 → P1 → a fork into two lanes: P2 (accent, "first value for editors") above P3 ("next to normal work") below.
  - P1 is relabelled "library snapshot released as v1.0.0".
  - The cryptic shrink/grow bars are gone.
  - The P3 row says "in parallel with P2".
- **Phase table** is now 5 columns. "Done when" moved into the engineer details, and every phase is still there.

## 3. Regressions and new inconsistencies

- **Should (introduced by the reorder): Target structure now uses phase names before they are explained.** Tab 2 refers to P0, P1 and P3 eight times ("P3 target: each under 500 lines", "grows in P3", "until P3", "removed in P0/P1"). The phases are only explained on the next tab. A non-technical reader meets them unexplained.
  - Fix: add one sentence to the tab 2 lede: "P0–P3 are the migration phases on the next tab: P0 makes today's library safe, P1 releases it and creates geo-agents, P3 cleans up the shared code."
- **Minor: two "with move" rows are not library fixes.** P1 says "Land the five 'with move' backlog fixes", and the backlog lede defines "with move" as "fixed in the library during P1". But row 20 is about agent and workflow documents (they move to geo-agents), and row 21 is settled by D5 (the new repository).
  - Fix: "with move = fixed during P1, before the release the agents start on".
- **Counts all agree.**
  - Backlog: before 10 / with 5 / after 16 = 31. Recount of the rows: before = 1–8, 10, 11; with = 12–14, 20, 21. Severity: S 9 / A 10 / B 11 / C 1.
  - P0 covers every before-move row, and row 8's delete triggers are now in the P0 checklist.
  - P2's owner (two editors) matches the quality loop. Efforts match between tab 3 and the tab 4 cards (3–5 weeks / 2–3 weeks / 3–5 weeks).
  - Cost: subscription row 200–400k tokens. The example record says Opus, matching "default Opus 5.5". `sourcesChecked` 1 / unreadable 0 matches the one listed source.
- **Glossary matches the markers:** 47 `<dfn>` keys and 47 glossary entries, with no orphans either way. The disposition says 46, a harmless miscount.
  - Terms review 1 flagged are now marked on first use on each tab: dry run, read-back, orchestrator, subagent, judge, gold set, rubric, Routines and Managed Agent.
  - The tag/release definition no longer contradicts "tags can be moved".
- **No regression in the MVP correction.** Quote matching appears only in D7, the tab 1 "changed since" line, the QA correction box, the field-table note "no exact quote is expected" and the Sources caveat. All of these are describing what changed.
- **Not regressions (noted only):** "CI" is still undefined on tab 2 (could). The backlog's choice not to preselect the S filter is a reasonable call.

## 4. Ready for the meeting?

Yes. Once the one-sentence phase pointer goes into the Target structure lede (a five-minute edit), the document is ready to present. Nothing else blocks it.
