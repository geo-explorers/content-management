# Geo Content Management

Tools for managing entities in the [Geo knowledge graph](https://geobrowser.io) via the [GRC-20 SDK](https://github.com/geobrowser/grc-20).

## Prerequisites

- `.env` configured with `PK_SW` (see `.env.example`)
- `bun` installed, dependencies available (`bun install`)
- A personal space on testnet (or membership/editorship in a DAO space)

## Entity Operations

All operations live in `01_entity_operations.ts`. Uncomment the operation you want, fill in the IDs, and run:

```bash
bun run 01_entity_operations.ts
```

### 1. Delete Entity

Delete an entity and all its properties/relations from a space. Optionally performs recursive orphan cleanup for entities that become unreferenced.

```ts
const ops = await deleteEntity({
  entityId: 'ENTITY_ID',
  spaceId: 'SPACE_ID',
  // dryRun: true,           // preview without publishing
  // skipOrphanCleanup: true, // skip recursive orphan deletion
});
```

### 2. Change Entity ID

Move an entity to a new ID within the same space. Recreates all properties, relations, and backlinks under the new ID, then deletes the old one.

```ts
const ops = await changeEntityId({
  oldEntityId: 'OLD_ENTITY_ID',
  newEntityId: 'NEW_ENTITY_ID',
  spaceId: 'SPACE_ID',
  // dryRun: true,
});
```

### 3. Change Space

Move an entity from one space to another, keeping the same entity ID. Recreates all data in the destination space and cleans up the source.

```ts
const { createOps, deleteOps } = await changeSpace({
  entityId: 'ENTITY_ID',
  fromSpaceId: 'FROM_SPACE_ID',
  toSpaceId: 'TO_SPACE_ID',
  // dryRun: true,
});
```

### 4. Merge Entities

Merge one or more secondary entities into a main entity. Handles both same-space and cross-space merges. If the main entity is a Property type, automatically migrates property references across all accessible spaces.

**Same-space merge logic:**
- Auto-selects the main entity among same-space candidates by backlink count, then by property+relation count
- Value properties on the main entity remain unchanged
- Missing value properties from secondaries are added to the main entity
- Non-duplicate relations from secondaries are appended to the main entity
- Duplicate relation detection checks both exact entity ID matches and "soft duplicates" (same name + type on the target entity)
- Backlinks pointing to secondaries are redirected to the main entity
- Secondary entities are deleted after merging

**Cross-space merge logic:**
- Multiple secondaries in the same foreign space are merged within that space first
- Each remaining foreign secondary is moved to the main entity's ID via `changeEntityId`

**Ops batching:** All operations accept an optional `opsBatch` parameter (`Map<string, Op[]>`) to accumulate ops across multiple merges and publish once per space at the end.

```ts
const ops = await mergeEntities({
  mainEntityId: 'MAIN_ENTITY_ID',
  mainSpaceId: 'MAIN_SPACE_ID',
  secondaries: [
    { entityId: 'SECONDARY_1', spaceId: 'SPACE_A' },
    { entityId: 'SECONDARY_2', spaceId: 'SPACE_B' },
  ],
  // dryRun: true,
  // addPropertiesToMain: false, // skip copying properties/relations from secondaries
});
```

## Find Duplicates

`02_find_duplicates.ts` scans a ranked list of spaces for Type and Property entities with duplicate names (case-insensitive). For each duplicate group it identifies a main entity (by space rank, then backlink count) and lists secondaries. For Property entities it also displays the data type and flags mismatches.

```bash
bun run 02_find_duplicates.ts
```

## Auto-Merge Duplicates

`03_merge_duplicates.ts` combines duplicate detection with automatic merging. It finds all duplicate Type and Property entities, then calls `mergeEntities` for each group. Property duplicates with data type mismatches are skipped. All ops are batched and published once per space.

```bash
bun run 03_merge_duplicates.ts
```

Set `DRY_RUN = true` at the top of the file to preview without publishing.

## Project Structure

```
01_entity_operations.ts     # Entry point — uncomment an operation and run
02_find_duplicates.ts       # Find duplicate Type/Property entities across spaces
03_merge_duplicates.ts      # Auto-merge detected duplicates
src/
  entity_ops.ts             # Core operation logic (delete, move, merge, migrate)
  constants.ts              # Ontology IDs (types, properties, data types, views)
  functions.ts              # Shared helpers (GraphQL client, publishing, ops serialization)
knowledge-graph-ontology.md # Full ontology specification
```

## References

- [GRC-20 Serialization Spec](https://github.com/geobrowser/grc-20/blob/main/spec.md)
- [Knowledge Graph Ontology](knowledge-graph-ontology.md)
