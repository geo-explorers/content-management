---
name: geo-clean
description: Clean the Geo knowledge graph — find and merge duplicates, find entities without types, delete orphans, fix data types, find blank properties, fix stale relations, delete space data. Runs safeguards (orphan check, backlink-based Main selection, dry-run, explicit publish confirmation) before any destructive op. Triggers on "find duplicates", "merge", "deduplicate", "delete orphan", "delete entity", "delete space data", "fix data type", "find blank properties", "fix stale relations", "clean", "cleanup".
---

# Geo Knowledge Graph — Cleaning

Editor-facing skill for cleaning Geo: finding bad data, merging duplicates, deleting orphans, fixing types. Uses Bun + `@geoprotocol/geo-sdk` locally on the editor's machine. Every destructive op runs through a Discovery + Gates + Plan template, a dry-run, and an explicit `publish` confirmation.

This skill complements the publishing skill (which creates new entities). Both share the same local setup. Works on any host (Claude Code, other desktop agents) that can read files, run bash, and reach the network.

## Prerequisites — verify before first run

1. **`content-management` repo cloned** locally. The skill runs FROM this directory and imports helpers from `src/` (`mergeEntities`, `OpsBatch`, etc.).
2. **Bun installed** (`bun --version` works).
3. **`bun install` already run** (`node_modules/` exists).
4. **`.env` filled in**: `PK_SW=` and `DEMO_SPACE_ID=` set. Never `cat .env` or `grep PK_SW .env` — to verify presence use `test -f .env && grep -q '^PK_SW=' .env && echo ok`.
5. **Network allowlist** (if the host sandboxes outbound traffic) includes `testnet-api.geobrowser.io` plus the publish-time hosts (IPFS gateway, RPC, governance contract resolver). Hosts surface on first failed publish — add as they appear.

If any prerequisite is missing, STOP and ask the editor to fix it. Do not work around.

## HARD RULES (failure = bug)

1. Before any `Write` to `scripts/` or any `bun run`, you MUST emit the operation-specific Discovery + Gates + Plan template (below) and wait for the editor to reply `go`.
2. **Two-phase execution**:
   - After `go`: write the script with `DRY_RUN = true`, run the dry-run yourself, surface the summary to the editor.
   - Ask: *"Output looks right? Type **publish** to apply the cleanup, or **stop** to discard."*
   - On `publish`: flip `DRY_RUN = false`, run again, report the tx hash + space verify URL.
   - On `stop`: do nothing; leave the script for review.
3. **Never auto-execute a destructive op without `publish`.** `go` only authorizes the dry-run.
4. **Logging is mandatory.** Every dry-run prints per-entity decisions: `[MERGE] X (id) ← Y (id), Z (id)` / `[DELETE] X (id, 0 backlinks)` / `[SKIP] X (id, reason)`. No silent ops.
5. **Always use deterministic IDs for relation entities** created during merges: `from.slice(0,16) + to.slice(0,16)`. Reruns must be idempotent.
6. **Additive-only when in doubt.** If a "fix" could be done either by adding new data or by deleting old, prefer adding. Only delete when the user explicitly authorized.

## The operations

Each operation has a dedicated section below with its own Discovery, Gates, and Plan template.

| Operation | Destructive? | Key gate |
|---|---|---|
| Find duplicates | No | — |
| Find entities without types | No | — |
| Find blank properties | No | — |
| Find stale relations | No | — |
| Merge duplicates | Yes | Main = most backlinks |
| Delete orphan | Yes | Must have 0 incoming relations |
| Fix data type | Yes | Old value preserved as comment until publish |
| Delete space data | Yes (mass) | Editor types space name to confirm |

---

## Operation: Find duplicates (read-only)

Used standalone OR as the discovery step before a merge.

### Discovery
Pattern B from `geo-query-web`: list entities of the target type (paginate every page, not just the first 50). Group by `name.toLowerCase().trim()`. Surface groups with 2+ members.

### Output template
```
## Duplicate groups — type {type name}
Total entities scanned: {N}
Duplicate groups: {G}

| Group | Members | Spaces | Backlinks (each) |
|---|---|---|---|
| "ethereum" | 4 | Crypto, Crypto datasets, AI, PERSONAL | 142, 8, 2, 0 |
| ... |

Reply with the group(s) to merge, or "all" to merge every group automatically (Main = most backlinks).
```

No write happens here. Output is the input for the Merge operation.

---

## Operation: Merge duplicates (destructive)

The most-requested op. Editors' rule: **the entity with the most incoming relations (backlinks) wins** — it's the Main. Other group members merge INTO it.

### Discovery (mandatory before Plan)

For every group the editor selected:

1. **List every member** (id, name, space, types).
2. **Count backlinks per member, paginated to completion.** Query `relations(filter: { toEntity: { id: { is: "<id>" } } })` with `first: 50` and cursor-paginate by last `createdAt` until a page returns fewer rows than `first`. **Do NOT stop at page 1.** Record the total page count alongside the row count.
3. **Designate Main** = member with most backlinks. Tie-break by space priority (root > canonical > personal — load from `content-management/src/constants.ts` if present, otherwise list the tie and ask the editor).
4. **Inventory each non-Main member's values + outgoing relations** — these will be ported to Main.
5. **Bucket the resulting ops by target space.** Each backlink op writes to the backlink's source space, not Main's space. A merge that touches Podcasts, Crypto, and PERSONAL becomes three separate transactions / governance proposals.

### Gate — Big-Merge (HARD STOP)

Fires if **any single member has > 100 incoming backlinks** OR **the total planned ops > 200**.

Big merges have historically lost rows (Armando AI/Tech case, 2026-05-29: 216 deletes vs 107 creates because backlinks weren't paginated to completion). Even with the pagination fix in place, large merges produce huge cross-space governance proposals and are hard to roll back.

STOP and tell the editor:

> Group **"{name}"** is too big for the auto-merge helper:
> - canonical has **{N}** incoming backlinks (cap is 100)
> - duplicate(s) have **{M}** combined
> - estimated total ops: **{ops}** (cap is 200)
>
> This needs the manual merge procedure in `documentation/big-merge.md` — the helper has historically under-migrated rows on this scale and produced large cross-space proposals. Reply **skip** to leave this group, or **force big-merge** to override (you accept the under-migration risk and will manually verify backlink counts post-merge).

### Gate — Cross-Space-Impact

Fires if the merge writes into **more than one space**.

STOP and tell the editor:

> This merge writes into **{S} spaces**:
> | Space | createRelation | updateEntity | deleteRelation | deleteEntity |
> |---|---|---|---|---|
> | Crypto | 12 | 1 | 0 | 0 |
> | Podcasts | 94 | 0 | 94 | 0 |
> | PERSONAL | 1 | 0 | 0 | 1 |
>
> Each non-personal space becomes its own DAO governance proposal. The Podcasts proposal in particular will churn the podcast app's topic links for **{N}** episodes.
>
> Reply **go** to proceed across all spaces, or name spaces to exclude (e.g. `exclude Podcasts` — those backlinks stay pointing at the duplicate).

### Gate — Backlink-Pagination-Confirmation

Discovery must surface, per member:

```
Backlinks paginated to completion: YES (253 rows fetched across 6 pages of 50)
```

If the helper returns a count without a page-count breakdown, the gate fires:

> Backlink pagination for **{name}** ({id}) could not be confirmed as complete. The helper returned **{N}** rows but did not report page count. Refusing to proceed — under-migration risk. Update the helper or run the manual procedure.

### Gate — Main selection
If the Main is unclear (tied backlink counts, OR Main has 0 backlinks like every other member, OR Main is in a low-priority space), STOP and ask:

> Main is ambiguous for group **"{name}"**:
> | Candidate | ID | Space | Backlinks |
> |---|---|---|---|
> | ... | ... | ... | ... |
>
> Which entity should be Main? Reply with the id, or **skip** to leave this group untouched.

### Gate — Data-type mismatch
If members have different data-type assignments for the same property name (e.g. one stores "Birth date" as `text`, another as `date`), STOP and ask which type wins. Don't silently coerce.

### Plan template

```
## Merge plan — type {type name}
Groups: {G}
Pagination: all members confirmed paginated to completion ✓

Per-space ops:
| Space | createRelation | updateEntity | deleteRelation | deleteEntity |
|---|---|---|---|---|
| Crypto | 12 | 1 | 0 | 1 |
| Podcasts | 94 | 0 | 94 | 0 |

Duplicate handling: DELETE the duplicate entity after migration (default).
(Reply `keep duplicate as ghost` before `go` to leave the duplicate as a nameless husk instead — only do this if you need to preserve the ID for an external system.)

Per-group decisions:
[MERGE] "ethereum"  Main: 4cd3dcb0… (Crypto, 142 backlinks, 3 pages)
        ← 8bd19463… (Crypto datasets, 8 backlinks, 1 page) → DELETE
        ← 61bc9cb3… (AI, 2 backlinks, 1 page) → DELETE
        ← a54bc45b… (PERSONAL, 0 backlinks, 1 page) → DELETE
[SKIP]  "bitcoin"   reason: ambiguous Main (tie 14 / 14)
[SKIP]  "ai"        reason: Big-Merge gate (253 backlinks > 100)

Reply **go** to write + dry-run the script. (Then **publish** to actually merge.)
```

### Execution

Use `mergeEntities` from `content-management/src/entity_ops.ts` (battle-tested). Batch ops via `OpsBatch`. **Always pass `summaryOut: new Map()`** so the helper fills per-space op counts for the Cross-Space-Impact gate.

The helper handles:
- Re-pointing incoming relations from members to Main (**paginated to completion** — uses `offset`-based pagination with `first: 500` until exhausted; logs page count)
- Copying unique values from members to Main (skip if Main already has the property; skip legacy/deprecated property IDs from `LEGACY_PROPERTY_IDS`)
- Copying unique outgoing relations to Main (skip if Main already has that exact `type + toEntity`; skip legacy/deprecated relation type IDs from `LEGACY_RELATION_TYPE_IDS`)
- Stripping the member: unset all values, delete all relations (outgoing + in-space backlinks), and emit a protocol-level `deleteEntity` op so the member ID is truly removed (not left as a nameless husk). Opt out with `keepAsGhost: true` only if an external system needs the ID.

```typescript
import { mergeEntities, type MergeOpSummary } from '../src/entity_ops.js';

const summaryOut: MergeOpSummary = new Map();
await mergeEntities({
  mainEntityId: '<canonical-id>',
  mainSpaceId: '<canonical-space-id>',
  secondaries: [{ entityId: '<dup-id>', spaceId: '<dup-space-id>' }],
  dryRun: true,
  opsBatch,
  summaryOut,
});
// Render the Cross-Space-Impact gate from summaryOut:
for (const [spaceId, counts] of summaryOut) {
  console.log(`  ${spaceId}: total=${counts.total} ` +
    `create=${counts.createRelation} update=${counts.updateEntity} ` +
    `delRel=${counts.deleteRelation} delEntity=${counts.deleteEntity}`);
}
```

After publish, report per-space tx hashes AND the post-merge backlink count on Main. Editor sanity-checks that Main's new backlink total ≈ the pre-merge sum (canonical + duplicates' migrated backlinks). A meaningful gap is a red flag for under-migration — investigate before approving the next merge.

---

## Operation: Delete orphan entity (destructive)

Delete an entity that no longer belongs (typo, test entity, abandoned record). **Only safe when nothing points at it.**

### Discovery
For each candidate ID:
1. Pattern C (its types, values, outgoing relations).
2. Pattern D incoming — count backlinks. Paginate fully.

### Gate — Backlink check (HARD)
If the candidate has ANY incoming relations, STOP. Do not generate a delete op. Tell the editor:

> Entity **{name}** (`{id}`) has **{N}** incoming relations:
> | From | Type |
> |---|---|
> | ... | ... |
>
> Delete would orphan these referrers. Options:
> - **Re-point** these relations to another entity first (specify target), then delete.
> - **Merge** this entity into another (use the merge operation instead of delete).
> - **Force delete** (acknowledged: referrers will be orphaned) — type `force delete {id}` exactly to confirm.

### Plan template
```
## Delete plan
[DELETE] {name} ({id}) — 0 backlinks, in space {space}
[SKIP]   {name} ({id}) — has 4 backlinks (gate fired; see above)

Will produce: deleteEntity={n}, deleteRelation={m} (outgoing relations cleaned up).

Reply **go** to write + dry-run.
```

Uses `Graph.deleteEntity({ id })`. Also emit `deleteRelation` ops for the entity's outgoing relations (use the edge `id`, not `toEntity.id`).

---

## Operation: Find entities without types (read-only)

Untyped entities are leakage from broken publishes. Surface them so the editor can re-type or delete.

### Discovery
```graphql
{ entities(first: 50, filter: { types: { isNull: true } }) { id name createdAt } }
```
If the schema doesn't support `types.isNull`, fall back to listing entities + checking `types` array per-entity (paginate everything).

### Output template
```
## Entities without types
Total: {N} (across {S} spaces; sample shown — full list in scripts/<date>-no-type-export.json)

| Name | ID | Space | createdAt |
|---|---|---|---|
| ... |

Decide per-entity: **assign type** (specify type id) / **delete** (use delete-orphan op) / **leave**.
```

Read-only — no script written. Hand off to merge / delete / publish as the editor decides.

---

## Operation: Find blank properties (read-only)

Find entities of type T where property P is empty. Useful for backlog work ("every Person needs a Web URL").

### Discovery
List entities of type T (paginate). For each, check `values[].property.id === P` exists with a non-empty value. Report misses.

### Output template
```
## Blank "{property name}" on type "{type name}"
Total entities of type: {N}
Entities missing the property: {M} ({pct}%)

Sample:
| Name | ID | Space |
|---|---|---|
| ... |

Full list written to scripts/<date>-blank-{prop}.json.
```

Read-only. Hand off to a bulk publish op once the editor has source URLs.

---

## Operation: Fix data type (destructive)

A property stored under the wrong SDK type (e.g. "Birth date" published as `text` when it should be `date`). Re-publish under correct type, unset the old.

### Discovery
1. Identify the property's correct data type (from the type's schema entry — Pattern C on a known-good instance).
2. List entities of type T where the property exists.
3. For each, capture the current (wrong-typed) value as a string, then validate it parses under the target type (e.g. `"1815-12-10"` parses as `date`; `"about 1815"` does NOT).

### Gate — Unparseable values
If any entity's current value can't be cleanly parsed under the target type, STOP and surface a list. Options:
- **Hand-correct each** before retrying.
- **Skip unparseable** and fix only the clean ones.
- **Drop unparseable** (unset, no replacement).

### Plan template
```
## Fix data type — "{property name}": text → date
Affected entities: {N}
Clean (will be re-typed): {M}
Unparseable (gate fired): {U}

Per-entity:
[FIX]  {name} ({id})  "1815-12-10" → date
[SKIP] {name} ({id})  "about 1815" (unparseable)

Reply **go** to write + dry-run.
```

Each entity gets a `Graph.updateEntity({ values: [...], unset: [...] })` op. Batch.

---

## Operation: Find stale relations (read-only)

A relation is stale if its `toEntity.id` no longer exists (target deleted). Surface for cleanup.

### Discovery
For each entity of type T (or across a space), read its relations. For each relation's `toEntity.id`, run a quick existence check (`entity(id: "<id>") { id }`). Collect nulls.

### Output template
```
## Stale relations
Scanned: {N} entities, {R} outgoing relations.
Stale: {S} (target no longer exists).

| From | Relation type | Dangling target id | Edge id |
|---|---|---|---|
| ... |

Reply **go** to write + dry-run a cleanup that deletes the stale edges.
```

Cleanup ops use `Graph.deleteRelation({ id })` with the edge id.

---

## Operation: Delete space data (mass-destructive, RARE)

Used when wiping a test space. **Never used on a DAO space or someone else's space.**

### Gate — Explicit confirmation
The editor must type the space NAME exactly, not the ID. Skill computes the name via Pattern C on the space ID and asks:

> About to delete **every entity** in space **"{space name}"** ({entity count} entities). This includes ALL entities authored to that space, including ones referenced by other spaces (their incoming relations from other spaces will go stale).
>
> Type the space name **exactly** to confirm. Anything else cancels.

### Plan template
```
## Delete-space plan
Space: "{name}" ({id})
Will delete: {N} entities, {R} relations.
Outgoing breakage: {X} relations from OTHER spaces will go stale (those need a follow-up "Find stale relations" pass).

Reply **go** to write + dry-run. (Then type the space name again to **publish**.)
```

Two confirmations: space-name-typed once before Plan, again before publish.

---

## Required output template — universal scaffold

Every operation emits ONE message in this shape before any Write/Bash:

````
## Operation: {Find duplicates | Merge duplicates | Delete orphan | Fix data type | ...}

## Discovery
{operation-specific block: row counts, sampled entities, decisions}

## Gates
- {gate name}: PASS | FIRE — {reason or list}
- {gate name}: PASS | FIRE — {reason or list}

If any gate is FIRE, STOP HERE. Run the gate dialog and wait.

## Plan (only if gates all PASS or were waived)
- Ops: {createEntity=n, createRelation=n, updateEntity=n, deleteRelation=n, deleteEntity=n}
- Script path: scripts/<YYYY-MM-DD>-<slug>.ts (will be written AFTER you reply `go`)
- Dry-run command: bun run scripts/<file>.ts (I run this — you will NOT)

Reply **go** to authorize.
````

After `go`, the skill writes + dry-runs, surfaces the log lines (`[MERGE]` / `[DELETE]` / `[SKIP]` / `[FIX]`), then waits for `publish` or `stop`.

## Script generation rules

- **One file, one job.** `scripts/<YYYY-MM-DD>-<operation>-<slug>.ts`. Successful scripts become a pattern library.
- **Top of file**: comment block restating the operation, the discovery counts, and the gate results. Future-you needs this.
- **TypeScript**, runs with `bun run scripts/<file>.ts`.
- **`DRY_RUN` constant at the top, defaults `true`**.
- **Collect ALL ops in one array, publish ONCE.** Never `await publishOps` inside a loop.
- **Import battle-tested helpers** from `content-management/src/`:
  - `mergeEntities` (entity merging)
  - `OpsBatch` (batching + per-space transaction routing)
  - `deleteEntity`, `deleteRelation` (cleanup)
  Don't reimplement these.

## Critical gotchas

1. **Backlinks are paginated.** A naive query returning 50 backlinks doesn't mean only 50 exist. For a Main-selection decision, paginate the backlink query to completion.
2. **Edge id ≠ entity id** for relation deletes. Use the relation's own `id`, not `toEntity.id`.
3. **Cross-space relations on merged entities**: when porting a member's relations to Main, preserve the `toSpace` field if the target lives in a different space.
4. **"Find duplicates" must group across spaces** — same name in different spaces is still a duplicate candidate unless the user explicitly scoped to one space.
5. **`Graph.deleteEntity` doesn't delete incoming relations** automatically. If you bypass the orphan gate via "force delete", you must also delete each incoming edge or the UI will show ghosts.
6. **Mass merges should be batched per Main's target space.** All ops with a given target space go in one transaction. The `OpsBatch` helper handles this.

## What this skill does NOT do

- Skip Discovery, Gates, or Plan to "save time".
- Auto-publish without an explicit `publish` reply (separate from `go`).
- Force-delete entities with backlinks unless the editor typed `force delete {id}` exactly.
- Touch DAO spaces unless the wallet is an editor of that DAO and the editor explicitly named the DAO space.
- Reimplement merge/delete logic — use `content-management/src/` helpers.

## When something fails mid-publish

If `bun run` errors with a network host blocked by the host platform's sandbox, the editor adds that host to the platform's network allowlist and retries. (Exact config location varies by platform — settings UI, a `config.toml`, or similar.) Do not suggest disabling the sandbox.
