---
name: geo-mirror
description: Mirror ANY Geo entity type from ANY space into Notion as linked databases, and (Part 2) sync reviewed Notion edits back to Geo. Type-generic — News stories, podcast Episodes, Events, People, etc. — one Notion database per entity type (primary + each related type), keyed by Geo ID so re-runs update in place. Read-only on Geo in Part 1. Triggers on "mirror to notion", "geo to notion", "export space to notion", "sync geo into notion", "mirror podcast into notion", "mirror episodes/events into notion".
metadata:
  version: "0.9.0"
  author: geobrowser
---

# Geo ⇄ Notion mirror

Two directions, gated separately:

- **Part 1 — Geo → Notion.** Pull a space's News stories + their Notable claims, Sources, and Topics into three **linked Notion databases**, each row keyed by its **Geo ID**. Read-only on Geo. Re-runs update rows in place (never duplicate).
- **Part 2 — Notion → Geo.** Diff the editor's Notion edits against the current Geo version and publish the changed fields back through the geo-publish two-phase gate (diff → review → dry-run → publish). Writes via the repo's `publishOps` (personal-vs-DAO routing + circuit-breaker).

## Example prompts (what an editor types → what they get)

| Editor prompt | Result |
| --- | --- |
| *"Mirror World affairs, News, last 2 days, into my Notion Test page: `<link>`"* | 3 tables: **News story + Claim + Article** (last-2-days stories, each with its claims + sources) |
| *"Mirror the last 3 episodes of The Daily podcast into `<link>`"* | 3 tables: **Episode + Claim + Project** (`--type Episode --related <show> --limit 3`) |
| *"Mirror US Politics stories about `<topic>` into `<link>`"* | News story + Claim + Article, scoped to that topic (`--related <topicId>`) |
| *"Sync my Notion edits back to Geo — page `<link>`, World affairs"* | Part 2: diffs your Notion edits vs Geo → review → publish the changed fields back |

Always name **space + scope + Notion page**. The agent resolves the canonical space ID, the entity `--type`, and any `--related` id (podcast/topic) via geo-query. A prompt with no scope is refused (never mirror a whole space).

Five **universal scripts** editors reuse as-is — no per-run code:
- `scripts/extract-space.mjs` — Geo → normalized JSON (read-only, no key).
- `scripts/mirror-to-notion.mjs` — JSON → three linked Notion DBs (needs a Notion token).
- `scripts/diff-notion-vs-geo.mjs` — Notion edits vs current Geo → change plan (read-only, Notion token).
- `scripts/sync-to-geo.mjs` — change plan → Geo `updateEntity` ops via `publishOps` (needs the wallet key; DRY_RUN default).
- `scripts/bulk-set-property.mjs` — fill ONE Notion property across many rows fast (see "Bulk-filling a Notion property" below).

## Bulk-filling a Notion property — never do it row-by-row

**If a task means "set property X on hundreds of Notion rows", do NOT loop `update-page` in the agent.** The Notion MCP's `update-page` takes **one page per call**, so each row costs a full agent round trip (~5–7s). Measured on a real task: **482 rows ≈ 50 minutes**. The same writes as paced REST calls run at Notion's allowed ~3 req/s → **~3 minutes**. (`create-pages` batches 100 at a time; `update-page` does not — that asymmetry is the whole trap.)

Use the script instead. The agent's job is to **decide** the values and emit a JSON plan; the script does the writing:

```bash
# 1. agent writes a plan file:  [{"name":"<row>","parent":"<value>"}, …]
#    ("parent":"ROOT" / null / "" means leave the row alone)
# 2. dry-run — reports what would change, writes nothing:
node --env-file=.env scripts/bulk-set-property.mjs \
  --db <DATABASE_ID_OR_URL> --plan plan.json --property "New broader topics"
# 3. publish:
node --env-file=.env scripts/bulk-set-property.mjs \
  --db <DATABASE_ID_OR_URL> --plan plan.json --property "New broader topics" --publish
```

Handles: relation / rich_text / select / url properties · matches rows by `--match` column (default `Name`) · resolves relation values to page IDs in `--target-db` (default: same DB, i.e. a self-referencing hierarchy) · paces at `--rate` req/s with retry on 429/5xx.

**It only writes rows that actually change** — so a re-run after tweaking a few values costs seconds, not another full pass. Verified live: 3/3 written at 1.9 rows/s, immediate re-run reported `TO WRITE: 0`.

It reports, rather than guesses, on: rows in the plan with no matching Notion row, relation values that don't exist as rows, and **duplicate `Name`s** (it uses the first and warns — dedupe those first or the hierarchy attaches to the wrong row).

> **Synced relation pairs: write ONE side only.** If the two properties are a synced pair (e.g. `New broader topics` ⇄ `New subtopics`), setting the child's parent auto-fills the parent's children list. Writing both sides doubles the cost for zero gain.

> **Sharing requirement.** These scripts authenticate as the **integration** (`NOTION_TOKEN`), not as you. A database you can see in the Notion UI (or via MCP, which uses your own login) will still 404 for the script until that page/database is explicitly connected to the integration (page → ⋯ → Connections). The 404 message names the integration, so it's easy to spot.

## What gets mirrored — one database per entity type

The mirror is **type-generic** but stays lean. It creates a DB for the **primary type** plus the **core content relations** — by default **Notable claims → `Geo Claim`** and **Sources → `Geo Article`/`Geo Project`** — so a typical mirror is **~3 databases**, not one per related type. Columns come from **each type's own value properties**. Examples:

- **News story** → `Geo News story` (Name, Summary, Description, Publish datetime) + `Geo Claim` + `Geo Article`.
- **Episode** (podcast) → `Geo Episode` (Name, Air date, Duration, Audio URL, Description) + `Geo Claim` + `Geo Project` (its Sources).

Core relations become **linked columns** on the primary DB. **Every other relation** (Topics, Related people/entities, Hosts, Guests, Podcast…) is mirrored in the primary row's **page body** (name + link), not as its own table — keeping the page uncluttered. Add more linked DBs with `--link "Notable claims,Sources,Hosts,Guests"`. Column types map from Geo dataTypes (Text→text, Datetime→date, Float/Integer→number, Checkbox→checkbox, URL→url).

**Geo ID** is the stable key on every row: re-running the mirror **updates the matching row** (adds new, leaves the rest), and Part 2's diff joins on it. Don't remove or edit the Geo ID column in Notion.

**Cover images:** each Story's Geo Cover (an `ipfs://` Image) is resolved to an HTTPS gateway URL and set as the Notion page **cover + icon** (plus a Cover URL property). Switch the Stories DB to a **Gallery view** and it renders like Geo's own News feed. Gateway defaults to `gateway.pinata.cloud`; override with `IPFS_GATEWAY` env.

**Review status** (`To review` / `Reviewed` / `Edited in Notion`) is on Stories + Claims — the editor's workflow column and the hook Part 2 uses to find what changed.

**Each Story's Notion page BODY is a faithful mirror of the composed Geo page** — not just the database columns, and not a flat claim dump. It walks the story's actual **page Blocks** (the Data blocks in position order): each becomes a section **heading** (block Name) + **intro** (block Description) + the **claims that block groups** (its Collection-item relations), reproducing Geo's grouped sections ("Wong collusion guilty plea" → its claims, "Foreign sanctions conspiracy charge" → its claims, …). Then Related stories, Sources (linked), Related entities, and Topics. A story with no page blocks falls back to a flat Notable-claims list. The columns drive the table/list view; the body is the readable mirror. Re-runs replace the body idempotently.

### ⚠ What the Notion API can and can't do (read before promising a layout)
The databases are created **inline** (`is_inline: true`) so each renders as a **full table embedded in the parent page** — not a collapsed sub-page link you have to click into. (Re-running also flips any pre-existing linked DBs to inline.) What the API still **cannot** create: **views** (Gallery/Board/Calendar), **grouping**, or **view-tabs** (like the "Claim quality / Issue / Classification" tabs on a reference DB). Those are a **one-time manual setup** per database:
1. Open **Geo Stories — {space}** → add a **Gallery** view → card preview = **Cover** → now it looks like the news feed.
2. Optionally group by **Review status** or **Topics**, and add view-tabs.
Do this once; re-runs keep your views and only update the row data.

## NOTION gates (run BEFORE any Notion write)

1. **Token present.** The editor supplies a Notion **internal integration token** in `.env` as `NOTION_TOKEN` (never printed/pasted into chat — same rule as the wallet key). Check presence without reading the value:
   ```bash
   grep -q '^NOTION_TOKEN=' .env && echo ok || echo "missing — add NOTION_TOKEN=secret_... to .env"
   ```
2. **Connection confirmed.** Verify the token authenticates and can see the parent page before mirroring:
   ```bash
   curl -s -o /dev/null -w '%{http_code}' https://api.notion.com/v1/users/me -H "Authorization: Bearer $NOTION_TOKEN" -H 'Notion-Version: 2022-06-28'   # 200 = connected
   ```
   Also confirm the integration is **shared into the parent page** (Notion → page → ⋯ → Connections → add the integration) — without it, database creation 404s. State "Notion connected ✓" to the editor.
3. **Scope confirmed — REQUIRED, never mirror a whole space.** Get the editor's explicit **space ID** (use the hardcoded canonical IDs — see geo-query, never fuzzy-resolve a space name) AND the **Notion parent page ID**, plus **at least one narrowing dimension**: a **date range** (`--since` / `--until`, on Publish datetime), a **`--topic <id>`**, or a **`--limit N`**. **If the editor gives only a space, STOP and ask them to narrow it** — which tab/feed (News, Events, Governance…), which topic, or which date range. Geo spaces hold thousands of entities and grow daily; an unbounded mirror would flood Notion. The extractor enforces this too — it **refuses to run with no scope** (exit 2) unless an explicit `--all` is passed (rarely what anyone wants; confirm loudly before using it). Echo the resolved scope back before running.

> **Tabs / types:** a space tab (News, Events, People, Podcasts…) is just a filter on an **entity type**. Pass that type via `--type <id>` (default = News story). The mirror is type-generic, so Episodes, Events, People, etc. all work — resolve the type id (and any `--related` filter, e.g. a specific podcast or topic) from the tab with geo-query, then mirror. A tab that mixes types → mirror each type in a separate run.

## GEO gate (Part 1 is read-only)

Part 1 never writes to Geo — no publish gates needed. It only READS via the scoped GraphQL sweep. (Part 2 will route every write back through **geo-publish**'s gates — dry-run → `go` → `publish`.)

## Run it

**Step 1 — extract (read-only, safe to run freely). `--type` picks the entity type (default News story); a scope is REQUIRED:**
```bash
# News stories (default type), date range:
node scripts/extract-space.mjs 4582fbbee28a16589154f7e36f1ee3c5 --since 2026-08-19 --out mirror.json
# podcast Episodes of a specific show (--type + --related the podcast entity):
node scripts/extract-space.mjs b5a31f8182b042437ede0f84ee02f104 --type 972d201ad78045689e01543f67b26bee --related <PODCAST_ID> --limit 3 --out mirror.json
# scope options: --since/--until (date range, auto-detects the type's date prop) | --related <ENTITY_ID> | --limit N
# NO scope → refuses (exit 2) rather than dump a whole type/space.
```
Find the `--type` id via geo-query (`type = <name>`) and, for "episodes of show X" / "stories about topic Y", the `--related` entity id. It prints the counts. Show the editor the counts + the top few names as the confirmation surface.

**Step 2 — dry-run the Notion write (nothing created):**
```bash
node --env-file=.env scripts/mirror-to-notion.mjs mirror.json --parent <NOTION_PAGE_ID> --dry-run
```

**Step 3 — mirror (after the editor confirms):**
```bash
node --env-file=.env scripts/mirror-to-notion.mjs mirror.json --parent <NOTION_PAGE_ID>
```
Creates/locates the three DBs, upserts every row by Geo ID, links Stories→Claims→Sources. Prints the three database IDs — hand those to the editor (they're the anchors Part 2 will diff against).

## Part 2 — sync Notion edits back to Geo

After an editor edits the mirrored content in Notion, push the changes back. **Editable fields synced back (v1):** Story **Name / Summary / Description**, Claim **Name**, Source **Name / Web URL**. NOT synced yet: adding/removing claims or relations, Publisher, page-**body** edits, new entities — those are structural (a later increment). Editors edit the **columns**; the story body is read-only mirror.

**GEO gate (Part 2 writes to Geo).** Same contract as geo-publish: the wallet key (`GEO_PRIVATE_KEY` in `.env`, never printed) is required, and every write is **two-phase** — a read-only diff the editor reviews, then a dry-run, then an explicit publish. Writing to a **DAO space** (e.g. World affairs) creates a **proposal + vote**, not an instant edit — tell the editor. `publishOps` refuses to touch a space the wallet doesn't own / isn't an editor of.

**Step 1 — diff (read-only, Notion token only):**
```bash
node --env-file=.env scripts/diff-notion-vs-geo.mjs --parent <NOTION_PAGE_ID> --space <SPACE_ID> --out plan.json
```
It prints each changed entity and every field edit (`old → new`). **Show the editor this diff as the confirmation surface.** Empty diff = Notion matches Geo, nothing to do. It never blanks a Geo field from an empty Notion cell.

**Step 2 — dry-run the sync (builds ops, writes nothing):**
```bash
node --env-file=.env scripts/sync-to-geo.mjs plan.json
```

**Step 3 — publish (only after the editor confirms the diff):**
```bash
node --env-file=.env scripts/sync-to-geo.mjs plan.json --publish
```
Builds one `updateEntity` op per changed entity and publishes via `publishOps` (proposal+vote for DAO spaces, direct for the editor's personal space). Reports the tx/proposal per space.

## Gotchas

- **Query efficiency:** the extractor sweeps stories scoped by `spaceId`+`typeId`, root page 100, with bounded nested relations — never the big-root-page × unfiltered-nested-relations shape (see geo-query "Memory blow-up").
- **Date filter is on `Publish datetime`, not entity `createdAt`.** Entity `createdAt` on this API is epoch seconds and (for pre-migration entities) flattened — "past 2 weeks news" means the article dateline, which is the `Publish datetime` property. The extractor filters on that.
- **`--since` with no date range** keeps only stories that HAVE a Publish datetime; a story missing that value is dropped from a ranged run (flag it to the editor if counts look low).
- **Notion rate limits** (~3 req/s): large spaces (hundreds of stories) take a few minutes — the script paces itself; let it finish.
- **Sibling "… datasets" spaces double every relation — dedupe on the target, never scope by space.** A story mirrored into its sibling dataset space (World affairs ↔ `World affairs datasets`) returns each relation edge **twice**, once per space, with *different* relation ids but the same target. Unfixed, the Notion page body repeats every section heading and claim. The fix in `extract-space.mjs` is `uniqTargets()` on the target id. Do **not** "fix" this by adding `spaceId: { is: … }` to the relation filters — that is **lossy**: some targets (e.g. a claim's `Sources`) live *only* in the dataset space, so scoping silently drops them. Verified: scoping dropped all sources on the Niger story's claims and one story-level source.
- **Part 2 writes to the space you NAMED, never `spaceIds[0]`.** An entity that lives in both a space and its sibling `… datasets` space has values in both; `spaceIds[0]` is often the dataset copy. `diff-notion-vs-geo.mjs` compares against the `--space` copy (falling back to a sibling only when the value exists nowhere else) and targets the **named space** for write-back — so a sync edits the copy the editor is looking at, not the dataset copy (which would silently leave the space page stale). A regression here means edits vanish into the dataset space.
- **Verify a Part-2 sync via the per-space VALUE, not `entity.name`.** `entity.name` is denormalized and can resolve from a *sibling* space, so it won't change when you edit the named space's copy — checking it makes a successful sync look like it failed. Confirm with the per-space value: `entity(id){ values(filter:{ property:{is:"a126ca53…"} }){ nodes{ spaceId text } } }` and read the row whose `spaceId` is the space you wrote to.
- **DAO spaces: a synced edit is a PROPOSAL, not live** until it's voted through — the per-space value won't change until then. Don't judge by the space page immediately after publishing.
- **Whichever side you edited last wins the next diff.** Notion is the diff's source of truth. If you edit a field directly in Geo, re-run the Part-1 mirror *before* editing in Notion — otherwise the stale Notion cell will propose reverting your Geo edit.
- **Re-runs are safe:** upsert-by-Geo-ID means running again with the same range updates in place, never duplicates. A wider range adds the new rows.
