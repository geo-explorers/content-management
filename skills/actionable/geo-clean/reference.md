# geo-clean — reference

Deep detail split out of `SKILL.md`. Read this before generating any cleanup script. Paths are relative to the cloned `content-management` repo (the skill runs from there).

## Script-generation rules

- **One file, one job.** `scripts/<YYYY-MM-DD>-<operation>-<slug>.ts`. Successful scripts become a pattern library.
- **Top of file**: a comment block restating the operation, the discovery counts, and the gate results. Future-you needs this.
- **TypeScript**, runs with `bun run scripts/<file>.ts`.
- **`DRY_RUN` constant at the top, defaults `true`.**
- **Collect ALL ops in one `OpsBatch`, publish ONCE per space at the end.** Never `await publishOps` inside a per-entity loop.
- **Exports go to `.json`** (`scripts/<date>-*.json`) — `*.csv` and `*.txt` are gitignored in this repo, and HARD RULE 7 requires the script to read the list file at runtime anyway.
- **Import battle-tested helpers** from `src/` — don't reimplement these:
  - `mergeEntities`, `deleteEntity`, `changeEntityId`, `moveEntity` (move/copy), `OpsBatch` — `src/entity_ops.ts`
  - `fetchCandidateMeta`, `buildScoringContext`, `selectCanonicalTopic`, `managedSpaces`, `survivingSpaces` — `src/select_canonical.ts`
  - `gql`, `publishOps`, `printOps`, `getPublishableSpaceIds`, `getSpaceOwnerInfo` — `src/functions.ts`
  - `DATASET_SPACE_IDS`, `CANONICAL_SPACE_IDS`, `EXCLUDED_VALUE_PROPERTY_IDS`, `EXCLUDED_RELATION_TYPE_IDS` — `src/constants.ts`
  - `validate_migration.ts` (repo root) — post-merge verification CLI.

## Canonical selection — helper contract

```typescript
import { fetchCandidateMeta, buildScoringContext, selectCanonicalTopic, survivingSpaces } from '../src/select_canonical.js';
import { DATASET_SPACE_IDS } from '../src/constants.js';

const metaMap = await fetchCandidateMeta(allCandidateIds);          // 1 gql call per id (concurrent)
const allSpaceIds = new Set([...metaMap.values()].flatMap(m => m.spaceIds));
const ctx = await buildScoringContext(allSpaceIds);                 // canonical-space topicIds + personal spaces
const untouchable = new Set([...DATASET_SPACE_IDS, ...ctx.personalSpaceIds]);

const sel = selectCanonicalTopic(group.ids, ctx, metaMap, forcedCanonicalId /* optional editor override */);
// sel.status: 'ok' | 'escalate' (both-scored) | 'no-candidate' (all excluded)
// sel.canonicalId, sel.anchorSpaceId, sel.secondaries (ONE ENTRY PER MANAGED RESIDENCY),
// sel.excluded (left untouched), sel.vacated (survive in personal/dataset spaces), sel.scored (escalations)
```

`fetchCandidateMeta` returns per candidate: `spaceIds`, `representsSpaces` (spaces whose `topicId` is this entity — never vacated from those), `backlinkCount` (true `relationsConnection.totalCount`), `dataCount` (values+relations), `createdAt`, `hasFeatured`/`hasCurated` (Tags relations), `scoreValues`. That one call IS the selection-metadata query — don't hand-write it.

`status === 'escalate'` → append the group to `scripts/<date>-escalations.txt` (group name, ids, scores, spaces, reason) and skip. `status === 'no-candidate'` → same file, reason `no-eligible-candidate`.

## `mergeEntities` helper contract

```typescript
import { mergeEntities, type OpsBatch } from '../src/entity_ops.js';

const opsBatch: OpsBatch = new Map();          // spaceId → Op[]
const out: { canonicalId?: string; canonicalName?: string } = {};

await mergeEntities({
  mainEntityId: sel.canonicalId!,              // the cascade's pick
  mainSpaceId: sel.anchorSpaceId!,             // anchor space from selection
  secondaries: sel.secondaries!.map(s => {
    const m = metaMap.get(s.id)!;
    return { entityId: s.id, spaceId: s.spaceId,
             residentSpaceIds: m.spaceIds, keptSpaceIds: survivingSpaces(m, ctx) };
  }),
  untouchableSpaceIds: untouchable,            // personal + dataset spaces — never receive ops
  disableAutoSelect: true,                     // MANDATORY: respect the cascade's pick (see gotcha 9)
  allowCanonicalDelete: AUTHORIZED,            // true ONLY after `go` on a plan whose END STATE named the removals
  opsBatch,                                    // accumulate; publishing happens separately below
  dryRun: false,                               // safe with opsBatch: accumulate-only, nothing publishes
  out,                                         // filled with the canonical id/name for follow-ups (e.g. rename)
  seedIds: new Set(group.ids),                 // cosmetic: [csv]/[snapshot] origin tags in logs
});
```

What it does: same-space losers have missing values + non-duplicate relations copied to Main (soft-duplicate detection: same relation type + same-named same-typed target; Avatar/Cover singletons never duplicated), backlinks re-pointed (paginated to completion, deduped against Main's existing edges, votes skipped), Main's own relations pointing at losers removed, then the loser is stripped + protocol-deleted with recursive orphan cleanup. Foreign-space (non-anchor) residencies are vacated **references-only** via `changeEntityId(migrateValuesAndRelations: false)` — the canonical gains no residency. Backlinks in a secondary's `keptSpaceIds` are left pointing at the surviving copy. Data-block filters and (for Property mains) property references are migrated across all spaces. A pre-merge snapshot of every involved entity is written to `snapshots/merges/`.

**Rendering the Cross-Space-Impact gate:** count ops per space from the batch —

```typescript
for (const [spaceId, ops] of opsBatch) {
  const n = (t: string) => ops.filter((o: any) => o.type === t).length;
  console.log(`${spaceId}: total=${ops.length} createRel=${n('createRelation')} update=${n('updateEntity')} delRel=${n('deleteRelation')} delEntity=${n('deleteEntity')}`);
}
```

**Publishing the batch** (only when `DRY_RUN = false`):

```typescript
import { publishOps, printOps, getPublishableSpaceIds, getSpaceOwnerInfo } from '../src/functions.js';

const publishable = await getPublishableSpaceIds([...opsBatch.keys()]);
for (const [spaceId, ops] of opsBatch) {
  if (!ops.length) continue;
  printOps(ops, 'scripts', `<date>-ops-${spaceId}.json`);          // always dump for review
  if (!publishable.has(spaceId)) { /* fix package — see below */ continue; }
  if (!DRY_RUN) {
    const proposalId = await publishOps(ops, editName, spaceId);   // returns proposalId for DAO spaces, txHash for personal
    console.log(`https://www.geobrowser.io/space/${spaceId}/governance?proposalId=${String(proposalId).replace(/^0x/, '')}`);
  }
}
```

**Fix packages** (spaces without editor access): write `scripts/fix-packages/<space-name>/<date>/ops.json` + `report.txt` (what merges produced them, total ops, and the space's editors from `getSpaceOwnerInfo`). Never force-publish, never silently drop.

## Voting-data scrub pass (safety net)

The helpers exclude voting data at op-generation time; scripts add a final scrub before publishing in case a future code path slips:

```typescript
import { EXCLUDED_VALUE_PROPERTY_IDS, EXCLUDED_RELATION_TYPE_IDS } from '../src/constants.js';
const hex = (b: any) => typeof b === 'string' ? b.replace(/-/g, '') :
  Array.from(b as Uint8Array).map(n => n.toString(16).padStart(2, '0')).join('');
for (const [spaceId, ops] of opsBatch) {
  opsBatch.set(spaceId, (ops as any[]).filter(o => {
    if (o.type === 'createRelation' && EXCLUDED_RELATION_TYPE_IDS.has(hex(o.relationType))) return false;
    if (o.type === 'createValueRef' && EXCLUDED_VALUE_PROPERTY_IDS.has(hex(o.property))) return false;
    if (o.type === 'updateEntity') {
      o.set = (o.set ?? []).filter((v: any) => !EXCLUDED_VALUE_PROPERTY_IDS.has(hex(v.property)));
      o.unset = (o.unset ?? []).filter((v: any) => !EXCLUDED_VALUE_PROPERTY_IDS.has(hex(v.property)));
      if (!o.set.length && !o.unset.length) return false;
    }
    return true;
  }));
}
```

Log what was dropped; a non-zero count means a helper bug — report it.

## `validate_migration.ts` — post-merge verification

Three rules per (source → target): (1) every source property value exists on target; (2) every outgoing relation exists with same type + target + relation-props (+ position: warn, or FAIL with `--strict-position`); (3) every backlink now points at target.

The merge leaves the source a husk, so validating AFTER publish needs a pre-merge snapshot:

```bash
# during the dry-run, per secondary:
bun run validate_migration.ts <secondaryId> <canonicalId> --save-snapshot scripts/<date>-snap-<secondaryId>.json
# after publish:
bun run validate_migration.ts <secondaryId> <canonicalId> --snapshot scripts/<date>-snap-<secondaryId>.json
```

Run it live (no snapshot) BEFORE a merge as a pre-flight: it lists exactly what the merge must migrate (expected to FAIL pre-merge). Flags: `--source-space` / `--target-space` (scope to one space), `--match-space` (values must match in the same space), `--ignore-properties <id,…>` (skip system values), `--json` (machine-readable; exit 0 = all pass).

## Critical gotchas

1. **Backlinks are paginated.** A naive query returning 50 backlinks doesn't mean only 50 exist. Paginate to completion AND cross-check against `relationsConnection.totalCount`.
2. **Edge id ≠ entity id** for relation deletes. Use the relation's own `id`, not `toEntity.id`.
3. **Cross-space relations on merged entities**: when porting a member's relations to Main, preserve the `toSpace` field if the target lives in a different space.
4. **"Find duplicates" must group across spaces** — same name in different spaces is still a duplicate candidate unless the user explicitly scoped to one space.
5. **`Graph.deleteEntity` doesn't delete incoming relations** automatically. If you bypass the orphan gate via "force delete", you must also delete each incoming edge or the UI will show ghosts.
6. **Mass merges are batched per target space.** All ops with a given target space go in one transaction. The `OpsBatch` map handles this.
7. **`typeIds` dedupes; type *edges* do not.** To find duplicate-type relations, read the raw Types-relation edges (`relationsConnection` filtered by `typeId = 8f151ba4…`), not the entity's `typeIds` array — the array collapses repeats and hides the duplicate.
8. **No working server-side "untyped" filter.** `types` isn't a field (it's `typeIds`); `typeIds: { isNull: true }` and `entitiesConnection.totalCount` both 504; the `relationsByTypeIdConnection: { none }` filter returns false positives. Paginate the space and check `typeIds.length === 0` client-side.
9. **Without `disableAutoSelect: true`, `mergeEntities` re-picks the Main itself** (Featured > Curated > blocks > backlinks > props) for same-space groups — silently overriding the plan the editor approved. Cascade-driven scripts must always pass it (plus `out` to read back what was used).
10. **Inline `relations { nodes }` / `backlinks { nodes }` cap at ~100 rows.** The helpers re-fetch capped entries via paginated queries before caching (prevents false-positive orphan deletion of heavily-linked targets); hand-written discovery queries must do the same — treat exactly-100 row counts as "probably truncated".
11. **Vote edges are incoming relations too.** When counting backlinks for the orphan gate or Main selection sanity, split out `typeId = 19a4cfff…` (Rank Votes) — they are non-blocking, never migrated, and remain after deletion by design.
12. **`gql` retries hard.** Up to 50 attempts, exponential backoff capped at 16 s, and it retries *every* transient failure (the testnet API 504s/stalls under load). Deterministic GraphQL errors (bad query/filter shape) fail fast — a long retry loop in the log means network trouble, not a bad query.
13. **`publishOps` returns the proposalId for DAO spaces** (txHash only for personal spaces). Build governance links as `https://www.geobrowser.io/space/{spaceId}/governance?proposalId={id-without-0x}` and include them in the publish report.

## When something fails mid-publish

If `bun run` errors with a network host blocked by the host platform's sandbox, the editor adds that host to the platform's network allowlist and retries. (Exact config location varies by platform — settings UI, a `config.toml`, or similar.) Do not suggest disabling the sandbox.

If a multi-space publish fails partway (some spaces proposed, others not), do NOT rerun blindly: re-run the dry-run, diff the per-space op files against what already landed (proposal URLs from the partial run), and publish only the missing spaces. Deterministic relation ids (HARD RULE 5) make the re-publish idempotent.
