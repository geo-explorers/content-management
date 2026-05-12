---
name: geo-publish
description: Publish entities and relations to the Geo knowledge graph via the GRC-20 SDK. Use when creating, updating, or deleting entities and relations. Triggers on "publish", "create entity", "add person", "add to geo", "submit proposal", "create relation", "update entity".
metadata:
  author: geobrowser
  version: "0.1.0"
---

# Geo Knowledge Graph — Publishing

Create, update, and delete entities and relations in the Geo knowledge graph using `@geoprotocol/geo-sdk`.

## When to apply

Use this skill when the user wants to:

- Create new entities (people, companies, events, articles, …).
- Add relations between entities (work history, speakers, authors, …).
- Update or delete entities / relations.
- Submit an edit to a personal space or propose one to a DAO space.

## Prerequisites

This skill ships inside the `content-management` repo, which is also the runtime harness:

- `package.json` already declares `@geoprotocol/geo-sdk`, `dotenv`, and `viem`.
- `src/functions.ts` exports the canonical helpers: `publishOps(ops, editName, spaceId?)`, `printOps(ops, dir, file)`, and `gql(query, vars?)` (with retries).
- Scripts are TypeScript (`.ts`) and run via **Bun**: `bun install` once, then `bun run scripts/<file>.ts`.

### Wallet credentials — `.env`

Wallet key + target space go in `.env` at the repo root (already in `.gitignore`):

```
PK_SW=0x<private_key>
DEMO_SPACE_ID=<personal_space_id>
```

- **No quotes, no spaces around `=`.** Bun's env loader keeps quotes literal and the SDK then throws `invalid private key, expected hex or 32 bytes, got string`. The same problem hits `DEMO_SPACE_ID`.
- `PK_SW`: export from <https://www.geobrowser.io/export-wallet>.
- `DEMO_SPACE_ID`: the user's personal space ID — visible in the geobrowser URL after they open their profile.
- **Never suggest commands that put the key in the transcript.** Do NOT run `! echo 'PK_SW=0x...' > .env`, do NOT `export PK_SW=...`, do NOT ask them to paste it into chat. **Do NOT `cat .env`, `grep PK_SW .env`, or any command that prints the file's contents** — even with regex filters, the matched value lands in the conversation history. To check the file exists and has the keys set, use `test -f .env && grep -q '^PK_SW=' .env && grep -q '^DEMO_SPACE_ID=' .env && echo ok` — that prints only `ok`, never the values.
- **The correct handoff**: ask the user to fill `.env` themselves — in their editor or a separate terminal you can't see — and to reply "done". You may offer to create/update `.env.example` and `.gitignore` on their behalf; never write the real file.

### Bun setup

If `bun` isn't installed: `curl -fsSL https://bun.sh/install | bash`, open a new shell, then `bun install` from the repo root.

### DAO editor rights

Only needed when publishing to a DAO space — your personal space (the default `DEMO_SPACE_ID`) needs nothing extra.

## Quickstart

### 0. Make sure `.env` is filled in

Check `bun install` has been run (`node_modules/` exists) and `.env` has both `PK_SW=` and `DEMO_SPACE_ID=` set. If `.env` is missing or empty, ask the user to fill it (see Prerequisites — never write the key yourself).

### 1. Confirm the plan with the user (one message)

Before writing or running a publish script, surface your assumptions in ONE short message and wait for confirmation:

> Ready to publish:
>
> - **Space**: `DEMO_SPACE_ID` from `.env` (your personal space) — change? (paste a DAO space ID to override)
> - **Name**: "<name the user gave>"
> - **Type**: `<TYPES.person>` (or `TYPES.project`, etc. from `src/constants.ts`) — change?
> - **Description**: <either "(none)" or a one-sentence draft ending with a period> — change?
>
> Reply "go" or tell me what to change.

Pick a type by matching the entity name where possible (a name like "Acme Inc." → `TYPES.company`; a person's name → `TYPES.person`). Don't invent a description the user didn't ask for — offer `(none)` as default.

Only proceed to write the script after the user confirms.

### 2. Write a `.ts` script in `scripts/`

Convention: `scripts/<YYYY-MM-DD>-<slug>.ts`. The script must:

- Import from `@geoprotocol/geo-sdk` and `../src/functions.js` (use `.js` extensions, ES modules).
- Default `DRY_RUN = true` at the top.
- Collect every op into one `allOps: Op[]` and publish ONCE.
- Call `printOps(allOps, '.', '<slug>_ops.txt')` so the editor can inspect before flipping `DRY_RUN`.

Skeleton:

```typescript
import { Graph, type Op } from '@geoprotocol/geo-sdk';
import { printOps, publishOps } from '../src/functions.js';

const DRY_RUN = true;

const allOps: Op[] = [];

const { id: entityId, ops: entityOps } = Graph.createEntity({
  name: 'Ada Lovelace',                     // MUST NOT end with a period
  description: 'A 19th-century mathematician.', // MUST end with a period
  types: ['7ed45f2bc48b419e8e4664d5ff680b0d'],  // discovered, not guessed
  values: [
    { property: WEB_URL_PROPERTY, type: 'text', value: 'https://en.wikipedia.org/wiki/Ada_Lovelace' },
  ],
});
allOps.push(...entityOps);

printOps(allOps, '.', 'add_ada_ops.txt');

if (DRY_RUN) {
  console.log('DRY_RUN — set DRY_RUN = false to publish.');
} else {
  const txHash = await publishOps(allOps, 'Add Ada Lovelace');
  console.log('Tx:', txHash);
}
```

### 3. Dry-run, confirm, publish

```bash
bun run scripts/<file>.ts          # DRY_RUN: prints op count + ops file
# editor reviews → replies "go"
# flip DRY_RUN to false
bun run scripts/<file>.ts          # actually publishes
```

`publishOps` reads `PK_SW` and `DEMO_SPACE_ID` from `.env`, queries the space type from the API, and routes to `personalSpace.publishEdit` (instant) or `daoSpace.proposeEdit` (proposal + vote) automatically. Pass an explicit space ID as the third argument to override `DEMO_SPACE_ID` for one publish.

It returns the transaction hash on success. Surface that plus the verify URL: `https://www.geobrowser.io/space/<spaceId>/<entityId>`.

## The three-step workflow

Every publish follows the same flow:

```
1. Discover schema  (query an existing entity of the same type)
1a. Pre-publish gates (semantic-duplicate + schema-violation — MANDATORY)
2. Build ops        (Graph.createEntity, Graph.createRelation, ...)
3. Submit           (personalSpace.publishEdit + wallet.sendTransaction,
                     or daoSpace.proposeEdit + voteProposal)
```

## Pre-publish gates (run BEFORE building ops)

**Safeguards aren't side rails — they ARE the product.** Run both gates below for every publish. If either fires, STOP and ask the editor — don't auto-resolve. (When called via `geo-orchestrate`, these run there; when called directly, run them here.)

### Gate 1 — Semantic-duplicate check

For every `createEntity` op, search Geo first for an entity that means the same thing.

- Named entities (Person, Project, Organization, Topic, …): name search across all spaces (don't restrict by `space`), then schema inspection of the top hits to compare.
- Claims: **exact meaning only**. Rephrasings count as duplicates; partial overlaps do NOT. Narrow the candidate set with topic / related-project filters or keyword search before any LLM comparison — never scan all claims.

If a likely duplicate is found, STOP and ask:

> Found an existing entity that may already mean the same thing: **{name}** (`{id}`) in space **{space}**.
> - **Use existing** → I'll skip the create and reuse this ID.
> - **Publish anyway** → confirm these are NOT duplicates and I'll proceed.

### Gate 2 — Schema-violation check

For every `createEntity` / `updateEntity` op, compare the `values[]` and relation types you plan to publish against the declared property schema of the entity's type.

If any property or relation type is NOT on the entity type's schema, STOP and ask:

> You're about to add property **{property name}** (`{property id}`) to a **{type name}** entity. This property isn't on **{type name}**'s schema.
> Off-schema properties: {list}.
> - **Add to schema first** → I'll generate a schema-update op to extend **{type name}**.
> - **Publish anyway** → the property will land on the entity but won't render in the UI.
> - **Skip the property** → drop it from this publish.

Surface the result of both gates in the plan confirmation message (§Quickstart step 1) so the editor sees what was checked.

### Step 1 — Discover the schema

Before creating an entity of a type you haven't worked with, **query an existing one** to learn its property IDs and relation type IDs. The `geo-query` skill covers this in depth; the minimum:

```typescript
const res = await fetch("https://testnet-api.geobrowser.io/graphql", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: `{
    entities(typeId: "TYPE_ID", first: 1) {
      id name
      values(first: 50) { nodes { property { id name } text date boolean decimal } }
      relations(first: 50) { nodes { type { id name } toEntity { id name } } }
    }
  }`,
  }),
});
const { data } = await res.json();
// data.entities is a flat array; read property IDs, relation type IDs, toEntity classification IDs
```

Don't guess property/relation IDs. Schemas drift.

### Step 2 — Build ops

All SDK methods return `{ id, ops }`. **Collect every op into a single `allOps: Op[]` array and publish ONCE.** Publishing in a loop creates duplicate edits and inconsistent state.

```typescript
import { Graph, TextBlock, Position, SystemIds, ContentIds } from "@geoprotocol/geo-sdk";
import type { Op } from "@geoprotocol/grc-20";

const allOps: Op[] = [];

// Create an entity
const { id: entityId, ops: entityOps } = Graph.createEntity({
  name: "Ada Lovelace", // MUST NOT end with a period
  description: "A 19th-century mathematician.", // MUST end with a period
  types: [SystemIds.PERSON_TYPE], // at least one type
  values: [
    { property: BIRTH_DATE_PROP, type: "date", value: "1815-12-10" },
    {
      property: ContentIds.WEB_URL_PROPERTY,
      type: "text", // URL-renderable properties have data type Text — see "Value types" below
      value: "https://en.wikipedia.org/wiki/Ada_Lovelace",
    },
  ],
});
allOps.push(...entityOps);

// Add a relation
const { ops: relOps } = Graph.createRelation({
  fromEntity: entityId,
  toEntity: TOPIC_MATHEMATICS_ID,
  type: ContentIds.TOPICS_PROPERTY,
});
allOps.push(...relOps);
```

### Step 3 — Submit

Use `publishOps` from `src/functions.ts` — it reads `PK_SW` and `DEMO_SPACE_ID` from `.env`, queries the space type, and routes to personal or DAO publishing automatically.

```typescript
import { publishOps } from '../src/functions.js';

// Defaults to DEMO_SPACE_ID (personal space), instant publish.
const txHash = await publishOps(allOps, 'Add Ada Lovelace');

// Override target space for one publish (e.g. a DAO space):
const txHash = await publishOps(allOps, 'Add Ada Lovelace', '<dao_space_id>');
```

For a DAO target the helper detects you're an editor/member, calls `daoSpace.proposeEdit` with `votingMode: "FAST"` if you're an editor, and returns the propose-tx hash. Voting is currently disabled in `publishOps` — uncomment the auto-vote block at the bottom of `src/functions.ts` if you need it.

If you need to bypass the helper (e.g. you want to write your own wallet flow), see `reference.md` for the raw `personalSpace.publishEdit` / `daoSpace.proposeEdit` calls plus the wallet-client pattern.

## Entity rules

- **Names must NOT end with a period.** `"Ada Lovelace"`, not `"Ada Lovelace."`.
- **Descriptions MUST end with a period.** Full sentences.
- **Dates** use type `"date"` with `YYYY-MM-DD`. Year-only: use `YYYY-01-01`.
- **Datetimes** use type `"datetime"` with `YYYY-MM-DDTHH:MM:SSZ`.
- **URLs** publish as `type: "text"` even when the property's renderable type is URL (e.g. `Web URL`, `Website`). The SDK does NOT accept `type: "url"` — `Graph.createEntity` throws `Unsupported value type: url`. Social handles are `"text"` with just the handle (`"alice"`, not `"https://twitter.com/alice"`).
- **Text blocks**: one paragraph per `TextBlock`. The UI drops everything after the first `\n\n`.
- **Batch size**: soft limit ~10,000 ops per proposal.

## Value types reference

| SDK `type` | Example `value`                              |
| ---------- | -------------------------------------------- |
| `text`     | `"any string"`                               |
| `date`     | `"2024-03-15"`                               |
| `datetime` | `"2024-03-15T14:30:00Z"`                     |
| `time`     | `"14:30:00"`                                 |
| `integer`  | `42`                                         |
| `float`    | `3.14`                                       |
| `decimal`  | `"123.456789"` (string, arbitrary precision) |
| `boolean`  | `true`                                       |

There is **no `url` value type**. Properties whose renderable type is URL (e.g. `Web URL`, `Website`) still have data type `Text` underneath — publish them as `type: "text"`.

## Relations

### Basic relation

```typescript
const { ops } = Graph.createRelation({
  fromEntity: personId,
  toEntity: companyId,
  type: SystemIds.WORKS_AT_PROPERTY,
  toSpace: companySpaceId, // only if target is in a different space
});
allOps.push(...ops);
```

### Relation-as-entity (relation with its own properties)

Relations can carry properties and sub-relations — this is how "Worked at" entries get start/end dates and role classifications.

**Use a deterministic ID** so reruns don't create duplicates:

```typescript
const relEntityId = `${personId.slice(0, 16)}${companyId.slice(0, 16)}`;

const { ops } = Graph.createRelation({
  fromEntity: personId,
  toEntity: companyId,
  type: SystemIds.WORKED_AT_PROPERTY,
  toSpace: companySpaceId,
  entityId: relEntityId,
  entityName: "Senior Engineer at Acme",
  entityValues: [
    { property: SystemIds.START_DATE_PROPERTY, type: "date", value: "2022-03-01" },
    { property: SystemIds.END_DATE_PROPERTY, type: "date", value: "2024-11-30" },
  ],
  entityRelations: {
    [ContentIds.ROLES_PROPERTY]: { toEntity: ENGINEER_ROLE_ID, toSpace: rolesSpaceId },
  },
});
allOps.push(...ops);
```

### Ordered collections

Use `Position` for fractional indexing when order matters (e.g. blocks in a page):

```typescript
import { Position } from "@geoprotocol/geo-sdk";

let lastPos: string | null = null;
lastPos = Position.generateBetween(lastPos, null); // first: "a"
// ... createRelation with `position: lastPos` ...
lastPos = Position.generateBetween(lastPos, null); // next: "n"
```

## Updates and deletes

```typescript
// Update properties (add/change values)
const { ops } = Graph.updateEntity({
  id: entityId,
  values: [{ property: propId, type: "text", value: "new value" }],
  unset: [{ property: oldPropId }], // clear a value
});

// Delete a relation — use the EDGE id from the GraphQL `id` field, NOT `entityId`
const { ops } = Graph.deleteRelation({ id: relationEdgeId });

// Delete an entity
const { ops } = Graph.deleteEntity({ id: entityId });
```

## Adding images

```typescript
// Upload to IPFS via SDK
const { id: imageId, ops: imageOps } = await Graph.createImage({
  url: "https://example.com/ada.png",
  name: "Ada Lovelace portrait",
  network: "TESTNET",
});
allOps.push(...imageOps);

// Attach as avatar
const { ops: avatarOps } = Graph.createRelation({
  fromEntity: personId,
  toEntity: imageId,
  type: ContentIds.AVATAR_PROPERTY,
});
allOps.push(...avatarOps);
```

## Adding text blocks (bios, body content)

Each paragraph is its own block:

```typescript
import { TextBlock, Position } from "@geoprotocol/geo-sdk";

const { ops: b1Ops, position: p1 } = TextBlock.make({
  fromId: entityId,
  text: "First paragraph.",
  position: Position.default(),
});
allOps.push(...b1Ops);

const { ops: b2Ops } = TextBlock.make({
  fromId: entityId,
  text: "Second paragraph.",
  position: Position.after(p1),
});
allOps.push(...b2Ops);
```

## Critical gotchas — quick reference

1. **Collect all ops, publish once.** Never publish inside a loop — creates duplicate edits and partial state.
2. **Names no period, descriptions must end with period.** The UI enforces this.
3. **Use the edge `id` to delete relations**, not the relation's `entityId`. Mixing them up silently fails or deletes the wrong thing.
4. **Deterministic IDs for relation entities** — `slice(from) + slice(to)` so reruns are idempotent.
5. **Discover schema before publishing** — don't hardcode property/relation IDs for types you haven't inspected.
6. **Target space matters.** If `toEntity` lives in a different space than `fromEntity`, set `toSpace`.
7. **Wallet must be an editor** of a DAO space before you can propose.
8. **`getSmartAccountWalletClient`** is the canonical wallet. Don't try to sign ops yourself.
9. **Run the semantic-duplicate gate before every `createEntity`.** Name search across all spaces; for Claims use exact-meaning rule. See "Pre-publish gates".
10. **Run the schema-violation gate before every `createEntity` / `updateEntity`.** Any `values[]` property or relation type not on the entity type's schema must be surfaced to the editor (Add to schema / Publish anyway / Skip).

## Personal vs DAO spaces

|            | Personal space                | DAO space                                        |
| ---------- | ----------------------------- | ------------------------------------------------ |
| Publishing | Instant (`publishEdit`)       | Proposal + vote (`proposeEdit` → `voteProposal`) |
| Access     | Your wallet is the sole owner | Must be an editor; vote threshold 51%            |
| Voting     | None                          | 24h slow path, or fast path (1 editor approval)  |
| Use for    | Experiments, personal data    | Shared curated spaces (Crypto, AI, etc.)         |

## More

- `reference.md` — full SDK surface (all constants, ops types, wallet setup).
- `examples/create-entity.md` — end-to-end: create a Person, publish to a personal space.
- `examples/create-relation.md` — add a "Worked at" relation entity with dates and roles.
- `examples/update-entity.md` — update and unset properties; delete a relation.
