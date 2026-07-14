# Skill versions & changelog

Per-skill version history. Pairs with `SKILL-VERSIONS.json` (machine-checkable integrity: approved commit + content hash) — this file is the **human "what changed and why"**.

**On every approved change to a skill:**
1. Bump the `version` in that skill's `SKILL.md` frontmatter (semver: patch = wording/fix, minor = new capability, major = breaking workflow change).
2. Add a dated bullet under that skill below.
3. Regenerate the manifest: `python3 skill-dev/skill_versions.py generate`.
4. Commit all three together.

---

## non-actionable/

### geo-query — 0.2.3
- 2026-07 · **Canonical client + trap table** (kills the hand-rolled-curl error class: 59 schema errors / 31 re-introspections / 236 ad-hoc curls across a month of sessions): new `lib/gql.mjs` (zero-dep `query()` with retry+backoff that throws the FULL GraphQL error text — never swallows into empty `data`; verified templates `Q.ENTITY_BY_ID` / `Q.ENTITIES_BY_TYPE(_CONNECTION)` / `Q.BACKLINKS` / `Q.PROPOSALS`; `paginate()` cursor helper) + `lib/gql-cli.mjs` shell one-liner. New SKILL sections "Canonical client" + "Fields that DON'T exist (recurring mistakes)" — no `nodes` on flat lists, Entity has `spaceIds` not `spaceId`, RelationFilter takes `typeId` not `type`, backlinks scoped via `filter` not a spaceId arg, filter fields take filter OBJECTS, no `equalTo` anywhere; every row verified against live introspection. curl section demoted to fallback; all 4 templates verified live (crypto space). Rebased onto geo-publish 0.5.1; hand-rolled TS cursor loop + curl block condensed to canonical-client pointers (keeps body <500 lines).
- 2026-07 · **Row order inside tables + front-page/tabs recipe** (the missing half of the shuffled-tables report — 0.2.1 ordered the *blocks*, rows within each table still followed `createdAt`): query-block rows follow the block's `Sort` **value** (`sort_by` property + direction — verified live: timeline block = Publish date desc); collection-block rows = `Collection item` relations by `position` (null-tolerant). Review-a-submission steps 3–4 updated (decode block KIND + keep its own order). New "Front pages and tabs" recipe: `space.page` front-page discovery + tabs by `POSITION_ASC` (verified: AI front page's 10 tabs match rendered order). Gotcha 11 extended.
- 2026-07 · Merged colleague's 0.2.1 refinements (all claims re-verified live): dedicated "Relation properties — read them inline" core section; pagination table corrected (`first`/`offset` ≤ 1000 on both shapes); Pattern 3 = filterable `backlinks`; Blocks relation-type ID `beaba5cb…` in the review query + Well-known IDs; `createdAt` keyset note; `backlinksExist`; `searchConnection`/`similarityThreshold`; `typeEntity{}` note.
- 2026-07 · **Performance + freshness fixes** (editor feedback: "topic query takes 5–10 min"): new Performance section — never N+1, use server-side relation filters (measured live: Iran-war stories 469ms vs ~131s+ N+1); bulk-scan pattern (relationsConnection 1000 rows/330ms with inlined nested fields). New Data-freshness section (verified: no cache, indexer lag ~seconds; re-query, don't distrust). Review-a-submission: block/table order = relation `position` (server `orderBy: POSITION_ASC`; verified vs live UI). Gotchas 9–12.
- 2026-07 · Hardened by independent 43-check live test: fixed StringFilter exact-match (`is`/`isInsensitive`, not `equalTo`); documented `first`≤1000 + offset-cap-on-Connections (cursor-only past 1000); `entity(id:)` never-null stub + correct existence check; one-query inline relation-properties + `backlinks` + count-only/`search()`/`relation(id:)`/`property(id:)`/`relationsExist` extras; softened stale unscoped-500 claim to performance rule; evals: dead fixture replaced, 4 new evals covering the v0.2.0 patterns.
- 2026-06 · Initial. GraphQL-over-HTTP querying (Nick's version); runs anywhere incl. browser. Folded in submission review/fact-check (merged from the retired geo-query-web). Person-ID corrected to `7ed45f2b…`.

### ontology-advisor — 0.1.0
- 2026-06 · Initial. Conversational modelling advice grounded in ONTOLOGY.md + live graph; read-only.

### geo-press-review — 0.5.1
- 2026-07 · Version bump to 0.5.1 (integrity manifest) + claims-read query widened to `relations(first: 100)` so busy stories don't drop claims. Consolidates the connector guard + mandatory-claims + two-bucket + accuracy work below into one shippable version.
- 2026-07 · Connector-safety guard (Ahmed's report): Half 1 must use the **GraphQL API by space ID**, never the Hypergraph MCP connector — the connector exposes only a curated space subset (no World affairs) and **silently fuzzy-matches a space name to the nearest one** ("World affairs" → "AI"), which would build a coverage map of the wrong space. Added a mandatory space-verification guard (confirm resolved `id`+`page.name` exactly; STOP on not-found/mismatch/substitution). Confirmed live: `89bd89bf…` = World affairs, 1,175 News stories, reachable via GraphQL.
- 2026-07 · Retest fix: the claims-check is now **MANDATORY** for any "Geo has a related story but not this thread" 🆕 (was judgment-based; one run skipped it and mis-flagged the "Mojtaba absent from funeral" thread as new). Editor called it launch-confident on Claude after this.
- 2026-07 · Accuracy round from an editor live-test (World affairs Jul 3–6): before 🆕, re-check with an **undated search of the News-story TYPE** (catches stories Geo published just outside the window — the India–Japan miss); **match on the story's `Notable claims`, not just title+description** (the Kyiv "68 missiles/351 drones" facts were already claims). Both queries verified live. Also hardened the two-bucket scope note (removed the 🔄 label from the instruction so it stops re-planting the forbidden bucket).
- 2026-07 · **Removed the 🔄 "On Geo — needs update" bucket** (editor call: not useful in current form, deferred to a future version) → two-bucket output (✅ Already on Geo / 🆕 Not on Geo yet). **Headlines are now clickable links to their primary source** (editor's top-requested shortcut — click the headline, land on the article). Cross-Geo `entity` check + ✅ entity-ID citation retained.
- 2026-07 · A/B tuning (Claude-vs-GPT test on World affairs Jul 3–6; gap was process depth, not search quality): mandatory 8–10 topic-lane fan-out before searching; discard out-of-window article dates; non-US compensation (outlet-name queries).
- 2026-06 · Source-faithfulness gate: a cited source must actually substantiate the *specific* story (not just the broad topic), and the recommendation may only be as specific as its sources support — fixes attaching generic "Iran war — live" blogs to a precise story. Prefer specific articles over live-blogs/topic hubs.
- 2026-06 · Editor-friendly labels ("Not on Geo yet" instead of "not covered"); all sources rendered as clickable links.
- 2026-06 · Initial. External press (Google News/web) vs Geo coverage; three-bucket ranked output.

### qa-report-workflow — 0.1.0
- 2026-06 · Initial. Triage + report UI/UX bugs (editor-reported, or active hunting via Playwright MCP); copy-paste Linear/Notion/Slack output; markdown report file. *(Not yet committed/shipped.)*

### image-banner-recompose — 0.2.0
- 2026-06 · Initial in-repo. Recomposes an uploaded image (e.g. a book cover) into a 2364×640 banner — smart crop / outpaint / blurred backdrop / solid-edge extend, auto-picked per image; strategy-aware QA, unsharp finishing, low-res warning. Author: Armando; reviewed + rebuilt into a full skill by Moh. No graph writes.

### geo-describe — 0.2.0
- 2026-06 · Fleshed out the accuracy/research leg: added `references/accuracy-verification.md` (Tier 0/1/2 verification, verify-framing-not-just-existence, dynamic-metric handling, verification-record format, faithfulness check) and wired it into SKILL.md Stages 3 & 5. Validated on a real run (Aave): verified founder/origin, confirmed a TVL ranking (softened as a dynamic metric), corrected a distorted claim ($1T cumulative mis-stated as daily).
- 2026-06 · Initial. Writes accurate, original, rules-compliant entity descriptions at scale: fact-extract → tiered parallel accuracy research → compose source-hidden → originality+accuracy+rules gate (`scripts/check_similarity.py`) → emit vetted description + Source for geo-publish. Makes no graph writes itself (hands off to geo-publish); advanced/needs the fuller Claude env (see `compatibility`). Author: Armando (spec), Moh (build).

### daily-report — 0.1.0
- 2026-06 · Initial. Editor end-of-day daily update: reads the day's Claude Code sessions (`scripts/gather_sessions.py`, runtime read, token-light), distills the Geo work into bullets, asks a top-up for work done elsewhere (Cowork/chat/ChatGPT), confirms, then files the editor's row to the Notion daily-update form under their own identity. Manual; no graph writes. v1 of the editor-scalable routine (scheduling deferred to v2).

## actionable/

### geo-publish — 0.5.1
- 2026-07 · Data-type check generalized beyond datetime: full `dataTypeName` → SDK value-type mapping table (all 11 live dataTypes enumerated from the API, incl. Checkbox→boolean and Relation→never-a-value); Gate 2 now checks EVERY planned value against it. Zero extra queries — dataTypeName already comes back in discovery, so no slowdown for bulk/ranking runs.
- 2026-07 · **Relation entity-id + dataType fixes** (from Preston's live diagnosis of the ~1000-row mis-publish): HARD RULE 7 + "Relations — entity id vs relation id" section (knowledge goes on the relation `entityId`, never the relation `id`; use `createRelation`'s `entity*` params or resolve `entityId` to update — new Gate 3). HARD RULE 8 + Gate 2 extended: match the property's declared `dataTypeName` (datetime-vs-date silent-render trap). HARD RULE 9: test one row (visually) before bulk. Fixed the discovery query too (validated: `types{ id name }`, `nodes{}` wrappers, `dataTypeName`, relation `entityId`).
- 2026-06 · **Runtime data loading rule** (fixes the bulk-publish outage): scripts must READ the dataset file (CSV/JSON) at runtime, never transcribe rows into the script as constants — baking rows in times out on large sets and risks the model fabricating values (esp. URLs). New "Bulk / dataset publishing" section + HARD RULE 6.
- 2026-06 · Consolidated to one portable skill (GEO_PRIVATE_KEY, PK_SW fallback) + strong safeguards (dup check, schema gate, two-phase dry-run→confirm). Retired geo-publish-codex.
- earlier · 0.1–0.2 pre-consolidation publish skills.

### geo-clean — 0.3.0
- 2026-07 · **Adopted the geo-merge-topics cleanup system** (ported `src/select_canonical.ts`, `validate_migration.ts`, evolved `entity_ops.ts`/`constants.ts`/`functions.ts` — local `allowCanonicalDelete` guard retained) + the Notion topic-reference rules, generalized to all types. Merge op rebuilt: **deterministic canonical cascade** (canonical-space representative topic → Root (Geo) resident → not-catch-all-only → Featured → Scored → Curated → true backlink totalCount → data → age → id) with hard exclusions (personal/dataset copies never canonical — Root exception) and editor override; **Both-Scored escalation** (≥2 scored members → never merged, escalated to review); **untouchable-space vacate semantics** (personal/dataset copies survive; representative topics never vacated from their own space); **references-only cross-space merges** (merge never grants the canonical new residencies) with an **END STATE plan block** + **Root-never-loses-a-topic invariant** (no override); **HARD RULE 8: voting data untouchable** (Score / Rank Votes / vote values excluded from every op + scrub pass — merges previously fabricated/destroyed votes); post-publish **migration validator** (snapshot → publish → 3-rule check) + per-space governance proposal URLs; fix packages for no-access spaces; escalation reports. New **Move/copy operation** (references preserved; representative-topic guard). Fixed skill↔code drift: `disableAutoSelect` now makes the helper respect the designated Main (it silently re-picked before); reference.md's fictional `summaryOut`/`keepAsGhost`/`LEGACY_*` contract replaced with the real API; big-merge.md wired to the validator. Evals 4–10 added.
- 2026-06 · Runtime data loading rule (HARD RULE 7): cleanup scripts read the `<date>-*.json`/CSV list at runtime, never embed IDs/rows as constants — avoids timeouts and ID corruption on large lists.
- 2026-06 · Initial. Find/merge duplicates, delete orphans, fix data types/stale relations; bundled reference.md + big-merge.md; Discovery→Gates→Plan→dry-run→publish safeguards.

### geo-orchestrate — 0.2.0
- 2026-06 · Runtime data loading rule in script-generation: generated scripts read the dataset file at runtime, never transcribe rows as constants; fixed the "Add Web URL from CSV" job accordingly.
- 2026-06 · Initial. Intent → plan → generate script → dry-run → confirm → publish; routes to query + publish.

### geo-discovery — 0.1.0
- 2026-06 · Initial. 6-stage gap-discovery pass over a space's daily stream → ranked Gap findings; read-only until human-reviewed publish stage. (Version normalized from `latest`.)
