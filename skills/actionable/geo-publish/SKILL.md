---
name: geo-publish
description: Publish entities and relations to the Geo knowledge graph via the GRC-20 SDK. Runs mandatory safeguards (semantic-duplicate check + schema check + two-phase dry-run/confirm) before any write. Use when creating, updating, or deleting entities and relations. Triggers on "publish", "create entity", "add person", "add to geo", "add to my space", "submit proposal", "create relation", "update entity", "delete entity".
metadata:
  author: geobrowser
  version: 0.5.2
---

# Geo Knowledge Graph — Publishing

Create, update, and delete entities and relations in Geo using `@geoprotocol/geo-sdk`. Portable (works in any local-execution agent: Claude Code, Codex CLI/Desktop, Claude cowork). **Browser-only assistants cannot publish** — they have no local runtime; send them to `geo-query` for reads.

Every write passes three mandatory safeguards FIRST: **semantic-duplicate check**, **schema check**, and **two-phase dry-run → explicit confirm**. These are not optional.

## Prerequisites

1. **Runtime**: Node 20.6+ or Bun (both support `--env-file`).
2. **SDK available**: either the `content-management` repo cloned with `bun install` run (`node_modules/@geoprotocol/geo-sdk` exists), or the skill's own `node_modules`.
3. **Wallet key** in an env file at the project root — `GEO_PRIVATE_KEY=0x...` in `.env.geo-publish` (preferred), or the repo's existing `PK_SW=0x...` in `.env`. Scripts read **`GEO_PRIVATE_KEY` first, then fall back to `PK_SW`**, so repo users need no second file. Export the key from <https://www.geobrowser.io/export-wallet>.

**Never put the key in the transcript.** Do NOT `cat`/`grep` the value, do NOT `export` it in-session, do NOT ask the user to paste it. If no key file exists, ask the user to create one themselves in their editor (one line, e.g. `GEO_PRIVATE_KEY=0x...`) and reply "done". You may create a `.env.geo-publish.example` placeholder and add the filename to `.gitignore` for them. To check it's configured without reading it:
```bash
test -f .env.geo-publish && grep -q '^GEO_PRIVATE_KEY=' .env.geo-publish && echo ok || (test -f .env && grep -q '^PK_SW=' .env && echo ok)
```

## HARD RULES (failure = bug)

1. Before any `Write` to a script or any `bun run`/`node`, you MUST post the **Discovery + Gates + Plan** block (template below) and wait for the user to reply **"go"**.
2. The duplicate search is **name-only, across ALL types and ALL spaces**. Never filter by the type you're about to create — "Bitcoin" the Project is a duplicate concern of "Bitcoin" the Token.
3. "Looks straightforward" is NOT a reason to skip the template. Always post it.
4. **Two-phase execution:** `go` authorizes the dry-run only. Publishing needs a *second* explicit `publish`.
   - After `go`: write the script with `DRY_RUN = true`, run the dry-run yourself, show the op count + a sample.
   - Then ask: *"Output looks right? Type **publish** to publish to Geo, or **stop** to discard."*
   - On `publish`: flip `DRY_RUN = false`, re-run, surface the tx hash + verify URL.
   - On `stop`: leave the script on disk, change nothing on Geo.
   - Never auto-publish on `go`.
5. **Never delete without explicit consent.** A delete or unset requires the user to type `publish` after seeing exactly what will be removed (entity name, backlink count, orphan count).
6. **Publishing from a dataset: the script READS THE DATA FILE AT RUNTIME — never transcribe rows into the script as constants.** See [Bulk / dataset publishing](#bulk--dataset-publishing--data-goes-in-the-file-not-the-script). Baking rows into the script blows the token budget and times out on large datasets, and risks the model fabricating values (especially URLs) as it copies.
7. **Properties on a relation go on the relation ENTITY id, NEVER the relation id.** A relation has two different IDs. Knowledge (values/name/types) written to the relation's own `id` is silently lost — the write "succeeds" and shows in the proposal, but renders nowhere. See [Relations — entity id vs relation id](#relations--entity-id-vs-relation-id-critical). This is not optional; getting it wrong mis-published ~1000 rows in production.
8. **EVERY value's `type` must match the property's declared `dataTypeName` — check all of them against the mapping table, not just dates.** The discovery query already returns `dataTypeName` per property, so this is a zero-extra-queries table lookup (see [Data-type mapping](#data-type-mapping-datatypename--sdk-value-type)). ANY mismatch publishes but silently doesn't render (datetime-as-date is just the classic case). Mismatches → Gate 2.
9. **Test ONE before any bulk publish.** Publish a single row first, open it on geobrowser.io, and confirm every field actually renders (not just "the API returned success"). Only then run the batch. Both failure modes above are *silent* — API/proposal say OK while the data is lost — so visual confirmation of one row is the only real check.

## Required output template (post BEFORE writing any script)

````
## Discovery
**Schema** — Type: <name> (`<id>`); Properties: <name> (`<id>`, dataType=…), …; Relation types: <name> (`<id>`), …

**Duplicate candidates** — name-only, ALL types, ALL spaces:
| Name | ID | Type | Space |
|---|---|---|---|
| … | … | … | … |
(or "no candidates found")

**Current state** (updates only): <values + relations, or "n/a — create only">
**Off-schema delta**: <properties/relations NOT on the type schema, or "none">

## Gates
- **Gate 1 (semantic-duplicate)**: PASS | FIRE — <reason/hits>
- **Gate 2 (schema-violation)**: PASS | FIRE — <off-schema list AND every planned value checked against the dataType mapping table; list any mismatch (e.g. datetime-as-date, Checkbox-as-text, Relation-as-value)>
- **Gate 3 (relation-target)**: PASS | FIRE — <any value targeting a relation `id` instead of the relation `entityId`; see Relations section>
If any FIRES, STOP, run the gate dialog, wait for the user.

## Plan (only if gates PASS or waived)
- Target space: <id> (personal | DAO)
- Ops: createEntity=<n>, createRelation=<n>, updateEntity=<n>, deleteRelation=<n>
- Script: `scripts/<YYYY-MM-DD>-<slug>.ts` (written AFTER "go")

Reply **"go"** to authorize writing + dry-running the script.
````

## Gate dialogs

**Gate 1 — semantic-duplicate fires:**
> Found an existing entity that may already mean this: **{name}** (`{id}`), type **{type}**, space **{space}**.
> - **Use existing** → skip the create, reuse this ID downstream.
> - **Publish anyway** → confirm it's NOT a duplicate and I'll proceed.

**Gate 2 — schema-violation fires** (missing property OR wrong data type):
> **{property}** (`{id}`) on a **{type}**: {it isn't on {type}'s schema | the schema declares it as **{schemaType}** but you're publishing it as **{yourType}** (e.g. datetime-vs-date)}.
> - **Fix the type** → I'll set the value's `type` to **{schemaType}** and reformat the value.
> - **Add to schema first** → I'll generate a schema-update op (missing-property case).
> - **Publish anyway** → it lands but won't render in the UI.
> - **Skip the property** → drop it from this publish.

**Gate 3 — relation-target fires:**
> This value targets a **relation id** (`{relationId}`), which can't hold properties — knowledge must go on the relation **entity id**.
> - **Fix the target** → I'll {put it in `createRelation`'s `entityValues` | resolve the relation's `entityId` and target that} instead.
> - (There is no "publish anyway" — writing to a relation id silently loses the data.)

## Discovery — how to produce the four outputs

GraphQL against `https://testnet-api.geobrowser.io/graphql` (no auth). Delegate to `geo-query` if loaded.

**Schema** (type ID + property/relation IDs + property dataTypes from a known instance):
```graphql
{ entities(first:1, filter:{ name:{ includesInsensitive:"<known instance>" } }) {
    id name types { id name }
    values(first:50){ nodes{ property{ id name dataTypeName } text } }
    relations(first:50){ nodes{ id entityId type{ id name } toEntity{ id name } } } } }
```
Property IDs from `values.nodes[].property.id`; **the property's declared type from `values.nodes[].property.dataTypeName`** (e.g. `Text`, `Time`/datetime, `Number`) — match your SDK value `type` to it (Gate 2). Relation type IDs from `relations.nodes[].type.id`. Each relation exposes **both `id` (the edge) and `entityId` (the relation entity, where its properties live)** — target `entityId` for relation values (Gate 3). **Don't guess IDs.** (`values`/`relations` are connections — the `nodes{}` wrapper is required.)

**Duplicate candidates** (name-only, all types, all spaces):
```graphql
{ entities(first:20, filter:{ name:{ includesInsensitive:"<name>" } }) { id name types { type { name } } } }
```

**Current state** (updates only — by entity ID): same shape as schema query, fetch the target entity.

**Off-schema delta**: compare every planned property/relation against the discovered schema; anything missing → Gate 2.

## Generate, dry-run, publish (only after "go")

1. **Write** `scripts/<YYYY-MM-DD>-<slug>.ts` with `DRY_RUN = true` (template below).
2. **Run** it yourself: `node --env-file=.env.geo-publish scripts/<file>.ts` (or `--env-file=.env` for repo/PK_SW users; or `bun run` with `--env-file`). Prints ops, touches nothing.
3. **Surface** op count + first-op sample + path, then the publish/stop prompt.
4. On `publish`: set `DRY_RUN = false`, re-run, report tx hash + `https://www.geobrowser.io/space/<spaceId>/<entityId>`.

Self-contained script template (portable — direct SDK, no repo helpers required):

```typescript
import { Graph, personalSpace, getSmartAccountWalletClient, SystemIds, type Op } from '@geoprotocol/geo-sdk';

const DRY_RUN = true;

// Key: GEO_PRIVATE_KEY preferred, PK_SW fallback. Normalize 0x prefix.
const raw = process.env.GEO_PRIVATE_KEY ?? process.env.PK_SW;
if (!raw) throw new Error('No key. Set GEO_PRIVATE_KEY in .env.geo-publish (or PK_SW in .env).');
const privateKey = (raw.startsWith('0x') ? raw : `0x${raw}`) as `0x${string}`;
const SPACE = process.env.DEMO_SPACE_ID!;        // target = your personal space

const allOps: Op[] = [];
const { id: entityId, ops } = Graph.createEntity({
  name: 'Hedy Lamarr',                        // NO trailing period
  description: 'Austrian-American inventor.',  // MUST end with a period
  types: ['7ed45f2bc48b419e8e4664d5ff680b0d'], // Person
  values: [],
});
allOps.push(...ops);

console.log(`${allOps.length} ops; entity ${entityId}`);
if (DRY_RUN) { console.log('DRY_RUN — set false to publish.'); }
else {
  const wallet = await getSmartAccountWalletClient({ privateKey });
  const { to, calldata, editId } = await personalSpace.publishEdit({
    name: 'Add Hedy Lamarr', spaceId: SPACE, ops: allOps, author: SPACE, network: 'TESTNET',
  });
  const tx = await wallet.sendTransaction({ account: wallet.account, to, data: calldata });
  console.log('editId', editId, 'tx', tx);
}
```

(Repo users may instead import `publishOps`/`printOps` from `../src/functions.js` — that path uses `PK_SW`/`DEMO_SPACE_ID` and handles personal-vs-DAO automatically.)

## Bulk / dataset publishing — data goes in the file, not the script

**Spreadsheet source? Convert to CSV first — the publish path reads CSV/JSON, not `.xlsx`/`.xls`/Sheets/Notion.** You publish from the `content-management` repo, so the converter is right there:
```bash
node src/xlsx-to-csv.cjs <file.xlsx>      # → <file>.csv  (uses `xlsx`; already installed via bun install)
```
Then publish that CSV. (No repo handy, or one quick file? Export to CSV by hand — Excel: Save As → CSV · Google Sheets: Download → CSV · Notion database: Export → CSV, since Notion only exports PDF/HTML/CSV.) Either way, **keep every column header verbatim** — headers are the schema-mapping keys.

When the source is a **dataset** (a CSV/JSON of many rows — podcasts, people, books…), the generated script must **read and parse that file at runtime** and build ops by looping the rows. **Do NOT transcribe the rows into the script as a `const data = [ … ]` array.**

Why this is a hard rule (it caused a real publish outage):
- **It doesn't scale / times out.** Embedding rows makes the model spend the whole run *copying data* into the file instead of writing logic. On a large dataset it hits the output-token limit ("file too large", "spent too long reading") and **never publishes**.
- **It hallucinates.** Asking a model to copy hundreds of values — especially URLs — risks fabricated or corrupted values getting published.
- **It's not reusable.** Data-as-constants means a new script per dataset; reading the file means swap the file and rerun.

The script holds only the **ontology (type/property/relation IDs) + the row→ops mapping**. The data stays in the file:

```typescript
import { Graph, personalSpace, getSmartAccountWalletClient, type Op } from '@geoprotocol/geo-sdk';
import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';   // or JSON.parse for a .json dataset

const DRY_RUN = true;
const DATA = process.argv[2] ?? 'data.csv';            // path passed at runtime
const rows = parse(readFileSync(DATA, 'utf8'), { columns: true, skip_empty_lines: true });

const PODCAST_TYPE = '4c81561d1f9541319cdddd20ab831ba2';  // ontology lives in the script
const HOSTS_REL    = 'c72d9abbbca84e86b7e8b71e91d2b37e';  // — IDs only, never the data

const allOps: Op[] = [];
for (const row of rows) {                               // build ops from the FILE, at runtime
  const { id, ops } = Graph.createEntity({ name: row.name, description: row.description, types: [PODCAST_TYPE], values: [] });
  allOps.push(...ops);
  // …createRelation(HOSTS_REL) per host, etc.
}
console.log(`${rows.length} rows → ${allOps.length} ops`);
if (!DRY_RUN) { /* publish allOps once (see template above) */ }
```

Run the dry-run against the real file: `node --env-file=.env.geo-publish scripts/<file>.ts data.csv`. If the dataset is very large, **chunk the rows** (publish in batches of N) rather than embedding more data. The two-phase `go` → `publish` flow is unchanged.

## Relations — entity id vs relation id (critical)

**In Geo, entities and relations are separate spheres; their IDs are NOT interchangeable.** A single relation carries several IDs — and getting them confused silently corrupts data at scale.

A relation (GraphQL `Relation`) has:
- **`id`** — the relation edge's own unique identifier ("the relation id"). Identifies the edge. **It is NOT an entity and CANNOT hold properties.**
- **`entityId`** — the **relation entity**: a real entity attached to the edge. **This is where any name / values / types on the relation live.**
- plus `fromEntityId`, `toEntityId`, `typeId`, `spaceId`.

**The failure mode (real, ~1000 rows):** writing values to the relation's `id` — e.g. `updateEntity({ id: <relationId>, values })`. The op is valid, the API returns success, and the proposal screen shows the property "set" — but it renders **nowhere**, because a relation id is not an entity. Silent loss.

**Do it right:**

- **Creating a relation WITH data** — put the data in `createRelation`'s `entity*` params. They attach to the relation entity (`entityId`), auto-generated or one you pass:
  ```ts
  const { id, ops } = Graph.createRelation({
    fromEntity, toEntity, type,               // the edge
    entityId,                                  // optional; the relation ENTITY (generate + keep it)
    entityName: 'Listen on Apple Podcasts',    // name/values/types land on entityId, NOT on id
    entityValues: [{ property: URL_PROP, type: 'text', value }],
    entityTypes: [SOME_TYPE],
  });
  ```
  Never follow a `createRelation` with a separate `updateEntity` that targets the relation's `id`.
- **Updating a relation's data later** — resolve its **relation entity id** first, then update THAT:
  ```graphql
  { entity(id:"<from>"){ relations(first:50){ nodes{ id entityId type{ id name } toEntity{ id name } } } } }
  ```
  Use the relation's **`entityId`** in `updateEntity({ id: entityId, values })`. Never the relation `id`.
- **Discovery must surface both.** When a relation carries (or will carry) data, show the plan's `relation id` AND `relation entity id` so it's unambiguous which one the values target.
- **Cleaning up a past mistake:** for each affected relation, query its `entityId`, delete the values wrongly written on the relation `id`, and re-write them on the `entityId`.

## Entity rules

- Names **must NOT** end with a period. Descriptions **MUST** end with a period.
- **Which value `type` a property wants is decided by its schema, not by how the value looks** — read `dataTypeName` from discovery and map it (table below). A mismatched value publishes but never renders.

## Data-type mapping (dataTypeName → SDK value type)

Every dataTypeName in the live API, mapped to the SDK value `type` (zero extra queries — `dataTypeName` comes back in the discovery query; this check is a table lookup over your planned values):

| `dataTypeName` (API) | SDK value `type` | Value format |
|---|---|---|
| `Text` | `text` | any string — **URLs too** (no url type) |
| `Date` | `date` | `YYYY-MM-DD` |
| `Datetime` | `datetime` | ISO `…Z` (the classic trap: setting it as `date` silently doesn't render) |
| `Time` | `time` | time string |
| `Checkbox` | `boolean` | `true`/`false` — NOT `text` |
| `Integer` | `integer` | whole number |
| `Float` | `float` | number |
| `Decimal` | `decimal` | number string |
| `Point` | `point` | coordinates |
| `Schedule` | `schedule` | schedule value |
| `Relation` | **NOT a value** | must be `Graph.createRelation` (with `entity*` params for its data) — never a `values[]` entry |
| *(null / unknown)* | — | flag it (Gate 2); inspect a live instance, don't guess |
- URLs publish as `type: 'text'` even for URL-renderable properties (SDK rejects `type: 'url'`).
- **Collect ALL ops into one array, publish ONCE.** Never publish in a loop.
- Relations: set `toSpace` if the target is in a different space. Use deterministic IDs (`from.slice(0,16)+to.slice(0,16)`) for relation entities so reruns are idempotent.

## Personal vs DAO spaces

| | Personal | DAO |
|---|---|---|
| Publish | instant (`personalSpace.publishEdit`) | proposal + vote (`daoSpace.proposeEdit`) |
| Access | your wallet only | must be an editor |

## What this skill does NOT do

- Print or store private keys.
- Auto-publish on `go` (publish needs a second explicit `publish`).
- Delete/unset without explicit `publish` after showing the impact.
- Skip Discovery / Gates / Plan to "save time".
- Publish from a browser-only assistant (no local runtime).

## More

- `geo-query` — discovery/reads. `geo-orchestrate` — multi-step intent → this skill.
- Schema spec: `knowledge-graph-ontology.md`. SDK: `@geoprotocol/geo-sdk`.
