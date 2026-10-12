# Notion/Geo tooling reuse audit for the claim-verification MVP

Read-only audit, 2026-10-09. Paths are relative to `X:/work/content-management`. Nothing was written to Notion or Geo, `.env` was not read. Geo reads used `lib/gql.mjs`, with sample sizes stated below.

**Common to every Notion script:** raw `fetch`, `Notion-Version: 2022-06-28`, `NOTION_TOKEN` loaded via `node --env-file=.env <script>` (loads the whole file into the process). Zero npm deps unless noted. Node 26 is enough, bun is not needed (`bun run` in docs is cosmetic, node strips TS types). Target DB id is the *database* id `0e2273e2…` (titled "World affairs debate claims (1)"), not a `collection://` data-source id. Both the claims DB and the taxonomy DB must be shared with the integration or the script gets 404 (`notion-operations/SKILL.md` §1).

## 1. Reusable pieces

### `scripts/notion-read.mjs` (preflight only)
- CLI: `whoami | search | inventory | page | props | schema <db> | rows <db> [--limit N --props "A,B"]`. Read-only by construction.
- Pacing: a serial `sleep(340)` after every call (`:48`). Retry: 5 tries on 429/500/502/503, linear 1.5 s steps, **ignores Retry-After** (`:50-53`). A network exception is uncaught. Errors come back as `{_error}`, not thrown.
- Gaps: text output only. `schema` prints the type but not `relation.database_id` or single/dual, which the MVP needs. `rows` shows relations as "N linked". It cannot filter.

### `skills/non-actionable/geo-claim-grouping-notion/scripts/roster-from-notion.mjs` (best read-side start)
- CLI: `--db --out [--space] [--geo-id-column "Geo ID"] [--url-column] [--rate 3] [--type] [--skip-type-check]`. Exit 0/1/2.
- Pages the whole DB (100/page, so 20 calls for 1,911 rows). Writes `roster.json` with `ids`, `rows{geoId:{pageId,name,url}}`, `duplicates`, `space`, `typeCheck`.
- Excludes duplicate Geo IDs. Asserts every id is a Claim (`96f859ef…`, `:52`) through 50-alias Geo `entity()` batches (`:141-188`).
- Pacing: slot-pacing at `1000/RATE`. Retry: up to 6 retries on 429/>=500, honours Retry-After, else 2^n up to 30 s, network errors retried (`:63-80`).
- Gaps: the roster keeps no property values. It cannot tell which rows have an empty `Proposed Claim Tags`, so the queue is not derivable. Extend it or re-query. The title column is auto-detected, so `Geo Name` works.

### `…/write-grouping-to-notion.mjs` (the template for the write side)
- CLI: `--db --campaign --roster [--existing] [--floor] [--prune] [--rate 3] [--concurrency 4] [--publish]`.
- **Column creation:** `GET /databases/{id}`, build `toCreate`, refuse to re-type (a clash exits 2, `:271-282`), then one `PATCH /databases/{id}` with all missing columns and a re-GET (`:375`). Relation spec is `{relation:{database_id: db.id, single_property:{}}}`, a self-relation. Notes column is `{rich_text:{}}`.
- **Writes:** one `PATCH /pages/{id}` per changed row carrying all columns together, so it is atomic per row. Worker pool of 4 behind slot pacing. Diff-first, unchanged rows are skipped. It only ever sends its own six columns, by construction (`body`), with no explicit allowlist assertion.
- **Caps:**
  - rich_text: 100 objects and 1,900 chars per object (`:45-47`, `:317`).
  - Relation reads >25 are truncated by Notion, so `fullRelation()` uses `/pages/{id}/properties/{propId}` (`:258-262`).
  - Relation writes are **not** capped at 100. The sink never reaches it; `mirror-claims-topics.mjs:416` slices to 100.
- **Dry-run and read-back:** dry-run is the default. It prints a six-section report and writes a run-record JSON. `--publish` creates columns, patches rows, then re-queries the whole DB and compares relation sets and rich_text signatures (`:390-404`). It prints `N rows checked, M remaining differences` and exits 1 on any difference or failure.
- Gaps: the relation target is hard-wired to the same DB. The column contract (`COLS`) is hard-wired. Input is pair decisions, not per-row tags. No `--limit`. There is no queue and failures are not replayed, only an idempotent re-run. Progress is a `\r` stderr line.

### `skills/actionable/geo-mirror/scripts/bulk-set-property.mjs`
- CLI: `--db --plan --property [--match Name] [--target-db] [--rate 3] [--concurrency 4] [--publish]`. Dry-run is the default.
- Resolves relation values by name to page ids in a *different* DB (`:125-139`, `:153-162`). That is exactly tag name to taxonomy page.
- Gaps:
  - One property per run, so three runs mean three non-atomic PATCHes per row.
  - A single `--match` column is used on **both** DBs, so `--match "Geo ID"` breaks on the taxonomy DB.
  - The default Name match silently uses the first row for duplicate claim names (`:129-133`, warning at `:184`).
  - The column must already exist (`:143`).
  - No read-back. No 25-item read or 100-item write handling.

### `skills/actionable/geo-mirror/scripts/notion-geo-tables.mjs` + `plan-notion-changes.mjs`
- Only importable Notion module: `notionClient(token)`, `allRows`, `findMirroredTables`, `classifyTable`, `gql`. Pacing is a shared 340 ms slot. Retry is up to 6 retries honouring Retry-After. Network errors and non-JSON bodies are not retried (`:30-41`). **It imports `@geoprotocol/geo-sdk` at top level** (`:12`), so it needs node_modules.
- **Naming hazard:** `classifyTable` treats `Proposed <X>` text columns as Geo proposals. `Proposed tag notes` would be read as a proposal for Geo property "tag notes". It is unresolvable and skipped, and the table has no `Publish status`, so the planner blocks it. `Proposed Claim Tags` (relation) is counted under "Not handled here". `Tag confidence` is ignored. This is harmless, but keep the three names exactly as specified.

### `mirror-claims-topics.mjs` (made the target table)
- Reusable ideas: `findOrCreateDb` adds only missing columns (`:291-305`). `unchanged()` handles the 25-item truncation heuristically (`:341-354`). `linkedNames()` builds hyperlinked rich_text (`:358-366`).
- **Avoid** `ensureDual` (`:307`). It creates a `dual_property` and adds a back-relation column on the target DB. Use `single_property` so the human-owned taxonomy DB stays untouched.
- Default is dry-run. Pacing is 350 ms serial. No read-back.

### Not reusable, and traps
- `mirror-to-notion.mjs`: **writes by default** (`--dry-run` is opt-in, `:18`), has **no pacing** (`:26-38`), and re-stamps `Review status = "To review"` on every upsert (`:189,200`). Never point it at the target table.
- `mirror-sources.mjs`, `extract-space.mjs`, `extract-page-collections.mjs`: Geo-to-Notion mirroring, not needed.
- `sync-to-geo.mjs`: writes Geo. Out of scope.

### Geo read clients
- Use `lib/gql.mjs`: `query(q, vars, {retries=2})` and `paginate`. Zero deps. Retries 5xx/429/network/transient GraphQL errors at 500·2^n ms. Throws on real errors. No pacing. `lib/gql-cli.mjs` is the shell wrapper (its bun shebang is irrelevant, node works).
- Do **not** import `src/functions.ts` `gql()` (`:52`). It pulls in geo-sdk and viem, and `dotenv.config()` (`:14`) loads `.env`, including any wallet key, at import.

## 2. How Claim Sources are modelled on Geo

| Item | Value | Evidence |
|---|---|---|
| Relation type "Sources" | `49c5d5e1679a4dbdbfd33f618f227c94` (SDK `ContentIds.SOURCES_PROPERTY`) | `discover_candidates.ts:28`; `queries-and-signals.md:24` |
| Target entity | A top-level content entity: **Article** `a2a5ed0cacef46b1835de457956ce915` (`src/constants.ts:170`) | live query |
| Web URL property | `412ff593e9154012a43d4c27ec5c68b6`, Text (SDK `WEB_URL_PROPERTY`), on the **target**, not on the relation | live query |
| Other properties | Name `a126ca53…`, Publish datetime `94e43fe8…`, Web archive URL `54aa3b25…` (SDK) | live query |

**Live confirmation** (claim `5dcfc5bf…`, World affairs): 2 Sources edges, both to Articles with Web URLs (straitstimes.com, aljazeera.com). The relation entities (`entityId`) are empty stubs with no type and no values. So the "Source relation-entity carries Web URL" pattern in `ontology-advisor/references/ONTOLOGY.md:319` is not what this data uses.

**Sample** (first 1,500 Sources edges in the space, an unrandomised sample):
- Targets: Article 1,491 (7 double-typed), Press release 2, Tweet 1, Debate 4, untyped 2.
- 6 of 1,500 edges have no Web URL. 4 edges point at targets with more than one Web URL value (cross-space), so scope `valuesList` by `spaceId`. 41 targets are not resident in World affairs.
- 0 of 500 checked have a Web archive URL.

**Notion side:** `Geo Sources` is rich_text of source *names hyperlinked to Geo entity pages* `geobrowser.io/space/<space>/<id>`, capped at 48 (`mirror-claims-topics.mjs:118, 358-366, 417`). It holds no web URLs. 776 of 1,911 rows (41%, per the `special-agent/sources/claims-mirror-rows.json` snapshot) have an empty `Geo Sources`. A 40-row sample of those had 0 Sources edges on Geo. A 40-row sample of non-empty rows had 113 edges (2.8 per claim), 107 with a URL, and 34 of 40 claims with at least one URL. **The MVP needs a rule for claims with no Sources.**

**Does any script already resolve source to web URL?** Only `discover_candidates.ts:352-373` `enrichUrls`. It is embedded and best-effort, and it takes the first `http*` text among *all* values of the citation entity (property-agnostic). It covers 4 citations per claim and only the exported top-80 pairs, and it imports `src/functions.ts`. It is not reusable as is. Nothing else resolves it.

**Verified read-only query** (two batches of 40 claims ran in about 0.6 s each; keep nested relations filtered by `typeId` and batches at 40 or fewer, per `versions.md:34`):
```graphql
{ e0: entity(id:"<claim>") { id relations(first:50, filter:{typeId:{is:"49c5d5e1679a4dbdbfd33f618f227c94"}, spaceId:{is:"89bd89bf28ff8a0963faf92a8c905e20"}}) { nodes { toEntity { id name types{name} valuesList(filter:{propertyId:{is:"412ff593e9154012a43d4c27ec5c68b6"}, spaceId:{is:"89bd89bf28ff8a0963faf92a8c905e20"}}){ text } } } } } e1: … }
```
Resolving all 1,911 claims takes about 48 batches, under a minute.

## 3. How many Notion clients exist

**Eight code copies, five behavioural variants, all pinned to `2022-06-28`. No shared module and no canonical one.**

| Variant | Files | Pacing | Retry |
|---|---|---|---|
| Serial sleep | `notion-read.mjs` | 340 ms after each call | 5 tries, linear, ignores Retry-After, no network catch |
| Slot pace, `--rate` (3 identical copies) | `bulk-set-property`, `roster-from-notion`, `write-grouping-to-notion` | 1000/RATE | up to 6 retries, Retry-After honoured, network retried |
| Serial 350 ms (2 copies) | `mirror-claims-topics`, `mirror-sources` | `lastCall` | same as above |
| Unpaced | `mirror-to-notion` | none | same as above |
| Exported factory | `notion-geo-tables` | shared 340 ms slot | up to 6 retries, Retry-After honoured, no network retry |

The de facto template is `bulk-set-property.mjs`: two other scripts cite it as "the shape" (`roster:63`, `sink:235`). The only importable client is `notion-geo-tables.mjs`, and it drags in the Geo SDK. `notion-operations/references/toolkit-scripts.md` documents the pins but offers no module. A second identity, the MCP connector (editor, not bot), is not usable from scripts. Geo side: at least 9 `gql` copies. `lib/gql.mjs` is the declared canonical one (`geo-query/SKILL.md:539`).

## 4. Build vs reuse

| MVP component | Verdict | What to take, what is missing |
|---|---|---|
| Notion read (roster) | **Reuse + extend** `roster-from-notion.mjs` | Gives Geo ID to page id, the Claim type check and the duplicate guard. Add the emptiness of `Proposed Claim Tags` (client-side, or a server-side `relation is_empty` filter; no script uses one, so test it). |
| Geo source resolution | **Build (about 60 lines)** | Use `lib/gql.mjs` and the verified query. Handle 0 sources, no Web URL (6 of 40 sampled claims with sources had none), non-Article targets, and multi-URL. |
| Page fetch | **Build or use agent tools** | No fetch/extract code and no HTML parser dep (only geo-sdk, grc-20, dotenv, viem, xlsx). The only precedent is `agents/geo-research.md` using the WebFetch/WebSearch tools plus `documentation/research-agent-allowlist.md`. No paywall or archive handling. Cache fetched text on disk for resume. |
| Classification | **Reuse the pattern, build the contract** | No LLM-call code and no Anthropic SDK in the repo. The established pattern is in-session adjudication that writes `decisions.json`, which a sink script reads. Define `{rows:[{geoId, tags:[{tag,confidence}], notes}]}`. |
| Column creation | **Reuse** the sink's `toCreate` / no-re-type / one-PATCH logic | Change the target. Read `relation.database_id` from the existing `Claim Tags — verified` property (`GET /databases`) rather than the data-source id `b65273e2…`. Use `single_property`. Confidence and notes are `rich_text`. |
| Notion write | **Reuse structure, build rows** | Reuse pacing, worker pool and one-PATCH-per-row. Write relation + `Tag confidence` + notes in **one** PATCH. 13 tags is far below the 100-write and 25-read caps. Add `assertWritable()`: allow only the 3 names and refuse `Geo …`, `Claim Tags — verified`, `Review status`, `Review notes`. No script has this guard. |
| `Tag confidence` encoding | **Decision** | Notion has no map type. Recommended: rich_text, one line per tag in relation order, `Tag name = 0.82`. Read-back checks that the tag-name set equals the relation titles. The sink's line grammar (`column-contract.md`) is the precedent. |
| Dry-run and read-back | **Reuse** | Copy the report, run-record and read-back pattern (`relSig`/`notesSig`). The read-back re-reads the whole DB (20 calls, fine). |
| Resume / queue | **Build** | No script checkpoints Notion writes; they re-run idempotently. Queue = rows with empty `Proposed Claim Tags`. Add a sentinel so "classified, no tag applies" does not re-queue forever (non-empty notes, or an explicit "none" outcome). Keep a per-row JSONL of verdicts between classify and write. Closest checkpoint precedent: `discover_candidates.ts --resume`. |
| CLI / entry point | **Build as a new skill** | Put it under `skills/non-actionable/<name>/scripts/` so `.claude/settings.json` allow-patterns already match. `CLAUDE.md` routing needs a new row. CI needs a version bump plus `skill_versions.py generate`, and `agents/MD-FILES.md` must be refreshed. |

**Operational numbers:**
- Writing 1,911 rows at 3 req/s takes about 10.6 min, over the 600 s foreground cap. Run in the background with progress lines, and support `--limit N`.
- `api-versions-and-limits.md` lists 180 req/min on non-Business plans, so 3.0 req/s sits exactly on that ceiling. Default to 2.5.
- Roster is about 20 Notion calls plus 39 Geo batches. Read-back is about 20 calls.
