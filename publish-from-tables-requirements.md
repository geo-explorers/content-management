# Publish Skill — Requirements: Publishing from Table-Shaped Sources

**Status:** draft for review · **Owner:** Vytautas · **Date:** 2026-07-14
**Related:** `skills/actionable/geo-publish` (v0.5.1, the active build), `skills/actionable/geo-orchestrate`

This doc specifies what the publish skill must do when the editor's input is a **table** — from a CSV, spreadsheet, Notion database, Obsidian table, database connection, or a table rendered on a page. It standardizes one behavior (today CSV publishing "works but behaves differently between chats") and defines the new requirement: **one table can publish entities of any type**, with columns mapping to types, properties, and relations.

---

## 1. Purpose

Let an editor point the skill at a table and get correct Geo entities out — every row an entity, every column a name / type / property / relation — with the existing safeguards (duplicate check, schema check, dry-run → confirm) intact, and with **deterministic, identical behavior every run** regardless of chat/surface.

## 2. Current state & MVP

**geo-publish is the active build and works today** (v0.5.1). It publishes from a **prompt, a CSV, or a text file**, with the safeguards below, and is in weekly use for the highlights. Armando's read: it's **basically an MVP already, ahead of the old company version**.

- Known-good safeguards already in the skill: semantic-duplicate gate, schema/`dataTypeName` gate, relation-entity-id rule, two-phase publish, "test one before bulk."
- **Problem to fix:** the same CSV produces **different results in different chats** — column interpretation, type/relation handling, and dedup are not pinned down. §5 pins them down.

**MVP spec — defined at tomorrow's sync (Arturas leads):** what's tested, what's in, and the rollout. This doc is the input to that: the "in" set is the current state above + what lands this week (below); everything in §8 is explicitly out.

**Landing this week (moves into MVP once tested):**
- **Any spreadsheet as a source** — needs an **Excel/spreadsheet → CSV converter** (see §4.1); the CSV path alone doesn't read `.xlsx`/`.xls`/Sheets, and Notion only exports PDF/HTML/CSV.
- **Database connection** (Postgres, etc.) — a curator publishes straight from their own data. ✅ **validated end-to-end** 2026-07-14 (§4.2); productionizing the config + idempotency next.
- **Page blocks** — tables are covered via the highlights; the rest (images, links, formulas, collections) tested this week (§7).

## 3. The new requirement — one table, any entity type

### 3.1 The table contract

A table is a list of rows; **each row is one entity**. Columns are one of three kinds:

| Column kind | How it's recognized | What it becomes |
|---|---|---|
| **Entity name** (required) | header `Entity name` / `Name` | the entity's `Name` (no trailing period) |
| **Type** (required, per-row) | header `Type` | the entity's type(s) — **resolved per row**, so one table can mix types |
| **Property** | header matches a property on the row's type | a typed value (`text`/`date`/`datetime`/`number`/`boolean`/… per the property's `dataTypeName`) |
| **Relation** | header matches a relation type (e.g. `Topics`, `Supporting arguments`) | a relation edge from this entity to the target entity/entities |

Tables come in many shapes — different columns, different types per project. The skill must handle **any** such table, not a fixed layout, by mapping columns to the contract above and discovering each type's schema at runtime.

### 3.2 Behavior the skill must get right

- **Mixed types in one table** — the `Type` column is read per-row, so a single table can contain `Claim`, `Country`, `Person`, etc. together. Any type named must publish via runtime schema discovery — no hardcoded per-type list.
- **Column resolution** — discover each type's schema first (property IDs + `dataTypeName`, relation type IDs; never guess). Then each header resolves to a property (→ typed value, coerced per `dataTypeName`), a relation type (→ relation edge), or **neither → STOP and ask** (never silently drop or mis-map).
- **Multi-value cells** — split on comma; resolve each target independently.
- **Relation targets** resolve by name, in order: (a) another row in the same table, (b) an existing Geo entity (dedup-checked), (c) not found → create or flag, per mode.
- **Two-pass publish** — Pass 1 create every row's entity (get ids); Pass 2 wire values + relations (so in-table references resolve). All ops in one publish; read rows at runtime, never inline them.
- **Empty cells** are left unset.

## 4. Input sources (scope)

Every table-shaped source reduces to the **same contract in §3** — a header row + data rows. The read path (connector) differs per source; the column mapping is identical.

**Working now:** prompt · **CSV** · text file.

**In scope, table-shaped:**
- **Spreadsheets** — `.xlsx` / `.xls` / Google Sheets. Reached via the converter in §4.1.
- **Notion** databases — exported to CSV (Notion only exports PDF/HTML/CSV), then §4.1.
- **Obsidian** tables.
- **Database connection** — Postgres etc., query → rows (§4.2).
- **Any page-rendered table** the editor pastes or points to.

### 4.1 Companion requirement — a spreadsheet → CSV converter (extra script)

**The current CSV path does not handle all formats.** It reads CSV only; it can't open `.xlsx`/`.xls` or a live Sheet, and Notion databases arrive as exports, not CSV directly. So the skill needs a **companion conversion script** that normalizes any spreadsheet (Excel, Sheets, Notion export) into the one canonical CSV the publish path already understands.

Requirements for the converter:
- **Lives in the repo:** `content-management/src/` (the converter script(s) for Excel/`.xlsx`/`.xls`/spreadsheet → CSV, alongside the other data tooling).
- Input: `.xlsx` / `.xls` (and, where feasible, Google Sheets export / Notion CSV export). Output: a single clean UTF-8 CSV matching the §3 contract (header row + rows).
- Preserve every column header verbatim (headers are the schema-mapping keys — §3.2), keep multi-value cells intact, don't coerce or reformat values.
- Deterministic and re-runnable (read at runtime; never inline data — same rule as publish).
- It is a **pre-step**, not part of publish: convert → CSV → hand to geo-publish. Keeps the publish path single-format and testable.

### 4.2 Database connection (Postgres, etc.)

A curator points the skill at their own database; a query returns rows that map to the §3 contract. Same safeguards.

**✅ Validated end-to-end (2026-07-14):** read 3 rows from a live Postgres table (`crypto.people`) → built Person entities → published to a personal space, instant, verified live. Read-only connection; zero DB writes. So the DB→Geo path works today.

**Findings from that test — the DB source differs from a generic table in three ways:**
1. **Type comes from the table/query, not a `Type` column.** A `people` table = Person, `claims` = Claim. So the mapping is: caller declares the type per table/query; every column is then a property or relation. (A query that unions multiple types would still need a `Type` column per §3.)
2. **Column names need an explicit mapping, and an allowlist** — DB columns aren't Geo property names (`x_url`→X, `website`→Web URL, `date_of_birth`→a date property), and DB-internal columns (`id`, `created_at`, `embedding`, …) must be **excluded**. Each table needs a column→property/relation map + a publish allowlist; unmapped columns → stop-and-ask (§3.2), never blind-publish.
3. **Idempotency via a mapping table.** Store `db row id ↔ Geo entity id` (the curator's DB already had an empty `geo_entity_map` table for exactly this). The flow reads it before publishing (skip already-published rows) and writes it after — so re-runs update-in-place instead of duplicating.

**Open items:** read-only connection handling; **credential handoff (never in chat — same rule as the wallet key; rotate any credential that was)**; the per-table type + column-map config format; and where the idempotency map lives (curator's DB vs ours).

**Separate question (NOT this doc):** articles, PDFs, and other unstructured/long-form inputs. Those need entity extraction, not column mapping — a distinct workstream.

## 5. One standardized behavior (fixes "differs between chats")

The skill MUST behave identically every run. Pin down (all from §3):
- column recognition and header→schema resolution as fixed rules, not per-chat judgment;
- value typing strictly from `dataTypeName`;
- the relation-target resolution order (in-table → existing Geo → create/flag);
- dedup: run the semantic-duplicate check per created entity, every time;
- two-pass ordering (create entities, then wire values + relations);
- dry-run → explicit `publish` confirm, every time.

*(Armando is sending concrete "it behaved differently here vs there" notes to the feedback channel; fold each into the fixed rules above so the divergence can't recur.)*

## 6. Modes — safe vs efficient (OPEN QUESTION — Armando owns; decide with Arturas)

Today's **personal-space-first** flow (publish to your personal space, review, then move to the target space) is **impractical for bulk work**. Proposal: two explicit modes.

| | **Safe mode** (default) | **Efficient / bulk mode** |
|---|---|---|
| Target | personal space first → review → promote | straight to the target space |
| Confirm | per-entity / small-batch review | one dry-run for the whole table, then publish |
| Use when | new/unsure editor, high-risk types | trusted editor, large clean table |

**Decision needed:** do we ship both, and what gates efficient mode (editor trust level? table size? dry-run diff sign-off)?

## 7. Page blocks — being tested this week

Publishing **page blocks** (not just flat entities) is the half still under test:
- **tables as blocks on a page** — ✅ covered via the weekly highlights;
- **images** — this week;
- **entity links** inside blocks — this week;
- **formulas** — this week;
- **collections** — this week;
- **view selection** (table / gallery / list view on a block) — this week.

**QA:** Moh runs it properly this week, building on the highlights table test. Findings feed back into this doc + the skill; a block type passes into the MVP once tested.

## 8. Out of scope (for now)

- Articles / PDFs / unstructured input (separate workstream — §4).
- Auto-creating brand-new *types* or *properties* from unrecognized columns (§3.2 stops and asks instead).
- The "update an existing story with a new figure" flow (tracked separately — the evolving-story/duplicate case).

## 9. Open questions & owners

1. **MVP spec** — what's tested / in / rollout → **Arturas** leads (tomorrow's sync); this doc is the input.
2. **Safe vs efficient mode** — ship both? gating? → **Arturas** (Armando owns).
3. **Spreadsheet → CSV converter** (§4.1) — build the companion script (`.xlsx`/`.xls`/Sheets/Notion export → canonical CSV) → **Vytautas**.
4. **Database connection** (§4.2) — ✅ path validated; remaining: per-table type + column-map config, idempotency map location, credential handoff → **Vytautas**.
5. **Page-block publishing** correctness (images/links/formulas/collections/views) → **Moh** QA, this week.
6. **Unrecognized column** default — always stop-and-ask, or allow "create property" in a power mode? → Vytautas.
7. **Relation target not found** — create vs flag, per mode → Vytautas.
8. Notion/Obsidian/DB connectors — which read path per surface (claude.ai connector vs local file vs DB client)? → Vytautas.
