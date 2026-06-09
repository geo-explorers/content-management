---
name: geo-publish-codex
description: Publish entities and relations to the Geo knowledge graph from Codex Desktop. Runs safeguards (duplicate check + schema check) before writing any script. Designed for editors with the `content-management` repo cloned locally and Bun installed. Triggers on "publish", "create entity", "add person", "add to geo", "add to my personal space", "submit proposal", "create relation", "update entity".
---

# Geo Knowledge Graph — Publishing (Codex Desktop)

Editor-facing skill for adding, updating, and deleting entities + relations in Geo. Uses Bun + `@geoprotocol/geo-sdk` locally. Includes the two mandatory safeguards (semantic-duplicate + schema-violation) BEFORE any script is written.

## Prerequisites — verify before first run

The skill assumes the editor's machine has all of these. If any are missing, STOP and ask them to set it up first; do not try to work around.

1. **`content-management` repo cloned** somewhere on the machine (e.g. `~/Documents/content-management`). The skill runs FROM this directory.
2. **Bun installed**: `bun --version` should print a version. If not: `curl -fsSL https://bun.sh/install | bash`.
3. **Dependencies installed**: `bun install` has been run in the repo root (`node_modules/` exists).
4. **`.env` filled in** at the repo root:
   ```
   PK_SW=0x<editor's wallet private key>
   DEMO_SPACE_ID=<editor's personal space ID>
   ```
   No quotes, no spaces around `=`. Each editor uses their OWN key; never share.
5. **Codex domain allowlist** (in `~/.codex/config.toml`) covers the publish path, not just reads. Read-only needs only `testnet-api.geobrowser.io`. Publishing additionally needs:
   - the IPFS gateway used by the SDK (for uploading the edit payload)
   - the blockchain RPC the SDK targets
   - the governance contract resolver

   Exact hosts surface on first failed publish — add each to `[permissions.workspace.network.domains]` as they appear and retry.

**Never** suggest commands that print the private key. Do NOT `cat .env`, do NOT `grep PK_SW .env`. To check the file is configured: `test -f .env && grep -q '^PK_SW=' .env && grep -q '^DEMO_SPACE_ID=' .env && echo ok`.

## HARD RULES (failure = bug)

1. Before any `Write` to `scripts/` or any `bun run`, you MUST emit the "Discovery + Gates + Plan" block (template below) and wait for the editor to reply "go".
2. The duplicate-candidate search is by **name only, across ALL types and ALL spaces**. Never filter by the type you're about to create — "Bitcoin" the Project is a duplicate concern of "Bitcoin" the Token.
3. "Looks straightforward, writing the script" is NOT a substitute for the template. Always emit the full template.
4. **Two-phase execution** (editors are non-technical, don't have terminals open):
   - After "go": write the script with `DRY_RUN = true`, then **run the dry-run yourself** via `bun run scripts/<file>.ts`. Show the editor the op count and a summary.
   - Then ask: *"Output looks right? Type **publish** to publish to Geo, or **stop** to discard."*
   - On `publish`: flip `DRY_RUN` to `false`, run the same script again, surface the transaction hash + the verify URL `https://www.geobrowser.io/space/<DEMO_SPACE_ID>/<entityId>`.
   - On `stop`: do nothing more; leave the script on disk so they can review it later.
   - Never auto-publish without the explicit `publish` reply.

## Required output template (post this BEFORE writing any script)

````
## Discovery
**Schema**
- Type: <name> (`<id>`)
- Properties to set: <name> (`<id>`, dataType=<text|date|...>), ...
- Relation types: <name> (`<id>`), ...

**Duplicate candidates** — name-only search across ALL types and ALL spaces:
| Name | ID | Type | Space |
|---|---|---|---|
| ... | ... | ... | ... |
(or: "no candidates found")

**Current state** (for updates only): <list values[] and relations, or "n/a — create only">

**Off-schema delta**: <list properties/relations NOT on the type schema, or "none — all on schema">

## Gates
- **Gate 1 (semantic-duplicate)**: PASS | FIRE — <reason or hits>
- **Gate 2 (schema-violation)**: PASS | FIRE — <reason or off-schema list>

If either gate is FIRE, STOP HERE. Run the gate dialog (below) and wait for the editor.

## Plan (only if both gates PASS or were waived)
- Target space: <id> (personal | DAO)
- Ops: createEntity=<n>, createRelation=<n>, updateEntity=<n>, deleteRelation=<n>
- Script path: `scripts/<YYYY-MM-DD>-<slug>.ts` (will be written AFTER you reply "go")
- Dry-run command: `bun run scripts/<file>.ts` (you run this — I will NOT)

Reply **"go"** to authorize writing the script.
````

## Gate dialogs

**Gate 1 — Semantic-duplicate fires.** STOP and ask:
> Found an existing entity that may already mean the same thing: **{name}** (`{id}`) in space **{space}**, type **{type}**.
> - **Use existing** → I'll skip the create and reuse this ID for downstream relations.
> - **Publish anyway** → confirm these are NOT duplicates and I'll proceed.

**Gate 2 — Schema-violation fires.** STOP and ask:
> You're about to add property **{property name}** (`{property id}`) to a **{type name}** entity. This property isn't on **{type name}**'s schema.
> Off-schema properties: {list}.
> - **Add to schema first** → I'll generate a schema-update op to extend **{type name}**.
> - **Publish anyway** → property lands on the entity but won't render in the UI.
> - **Skip the property** → drop it from this publish.

## Discovery — how to actually produce the four outputs

Use GraphQL against `https://testnet-api.geobrowser.io/graphql`. No auth.

**Schema** (find type ID + property/relation IDs):
```graphql
{ entities(first: 1, filter: { name: { includesInsensitive: "<known instance>" } }) {
    id name
    types { type { id name } }
    values(first: 50) { property { id name } text }
    relations(first: 50) { id type { id name } toEntity { id name } }
} }
```
Property IDs come from `values[].property.id`; relation type IDs come from `relations[].type.id`. **Don't guess IDs.**

**Duplicate-candidate list** (name-only, all types, all spaces):
```graphql
{ entities(first: 20, filter: { name: { includesInsensitive: "<name>" } }) {
    id name
    types { type { id name } }
} }
```

**Current state** (only for updates — fetch by entity ID):
```graphql
{ entity(id: "<id>") {
    id name
    values(first: 50) { property { id name } text date }
    relations(first: 50) { id type { id name } toEntity { id name } }
} }
```

**Off-schema delta**: compare every property and relation in your planned ops against the schema you discovered. Anything not in the schema → Gate 2 fires.

## Generate, dry-run, publish (only after "go")

After the editor replies "go":

1. **Write** `scripts/<YYYY-MM-DD>-<slug>.ts` with `DRY_RUN = true` at the top (template below).
2. **Run the dry-run** yourself:
   ```bash
   cd <path-to-content-management> && bun run scripts/<file>.ts
   ```
   This prints ops but does NOT touch the chain.
3. **Surface to the editor** a short summary: op count, sample of the first op, file path, then:
   > Output looks right? Type **publish** to publish to Geo, or **stop** to discard.
4. **On `publish`**: edit the script to set `DRY_RUN = false`, run again, and report the transaction hash + verify URL.
5. **On `stop`**: do nothing; leave the script in `scripts/` for later review.

Script template:

```typescript
import { Graph, type Op } from '@geoprotocol/geo-sdk';
import { printOps, publishOps } from '../src/functions.js';

const DRY_RUN = true;

const allOps: Op[] = [];

const { id: entityId, ops: entityOps } = Graph.createEntity({
  name: 'Hedy Lamarr',                       // NO trailing period
  description: 'Austrian-American inventor.', // MUST end with period
  types: ['<PERSON_TYPE_ID>'],
  values: [
    { property: '<WEB_URL_PROPERTY_ID>', type: 'text', value: 'https://en.wikipedia.org/wiki/Hedy_Lamarr' },
  ],
});
allOps.push(...entityOps);

printOps(allOps, '.', '<slug>_ops.txt');

if (DRY_RUN) {
  console.log('DRY_RUN — set DRY_RUN = false to publish.');
} else {
  const txHash = await publishOps(allOps, 'Add Hedy Lamarr');
  console.log('Tx:', txHash);
}
```

After writing the file, run the dry-run yourself and surface a short summary like:

> Wrote `scripts/<file>.ts` (DRY_RUN = true).
> Dry-run output: **N ops** queued (sample: `createEntity Hedy Lamarr`).
> Output looks right? Type **publish** to publish to Geo, or **stop** to discard.

## Entity rules

- **Names must NOT end with a period.** `"Hedy Lamarr"`, not `"Hedy Lamarr."`.
- **Descriptions MUST end with a period.** Full sentences.
- **Dates** use type `"date"` with `YYYY-MM-DD`.
- **URLs** publish as `type: "text"` even when the property's renderable type is URL. The SDK rejects `type: "url"`.
- **Collect ALL ops into one array, publish ONCE.** Never publish inside a loop.

## Value types

| SDK `type` | Example `value`                |
| ---------- | ------------------------------ |
| `text`     | `"any string"`                 |
| `date`     | `"2024-03-15"`                 |
| `datetime` | `"2024-03-15T14:30:00Z"`       |
| `integer`  | `42`                           |
| `decimal`  | `"123.456789"` (string)        |
| `boolean`  | `true`                         |

No `url` type. URL-renderable properties publish as `text`.

## What this skill does NOT do

- Add or print private keys.
- Auto-publish without the explicit `publish` reply (separate from `go` which only authorizes the dry-run).
- Skip Discovery, Gates, or Plan to "save time".
- Force the editor into a terminal — Codex executes `bun run` for them.

## When something fails mid-publish

If `bun run` errors with a network host the sandbox blocked, the editor adds that host to `~/.codex/config.toml` under `[permissions.workspace.network.domains]` and retries. Do not suggest disabling the sandbox.
