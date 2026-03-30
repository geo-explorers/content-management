/**
 * Delete all entities in a space, except the home entity
 * and any entities directly referenced by it.
 *
 * Fetches all values and relations in the space upfront (2 API calls),
 * then builds delete ops locally — no per-entity API calls needed.
 * Orphan cleanup is unnecessary since all entities in the space are
 * already included in the bulk fetch.
 *
 * Usage:
 *   bun run 08_delete_space_data.ts              # delete everything (prompts for confirmation)
 *   bun run 08_delete_space_data.ts --dry-run    # count entities without deleting
 *   bun run 08_delete_space_data.ts --limit 10   # delete at most N entities (for testing)
 */

import { Graph, type Op } from "@geoprotocol/geo-sdk";
import { gql, publishOps, printOps } from "./src/functions";

const SPACE_ID = "bd5529695e011fdf76637d4addca733a";
const HOME_ENTITY_ID = "3a65270068774755bf4f379ef2b0f371";

//const SPACE_ID = "bd5529695e011fdf76637d4addca733a";
//const HOME_ENTITY_ID = "3a65270068774755bf4f379ef2b0f371";

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT_ARG = process.argv.indexOf("--limit");
const LIMIT = LIMIT_ARG !== -1 ? parseInt(process.argv[LIMIT_ARG + 1], 10) : Infinity;

// ── Types for bulk-fetched space data ────────────────────────────────────────

interface SpaceValue { entityId: string; propertyId: string }
interface SpaceRelation { id: string; entityId: string; toEntityId: string }

interface SpaceData {
  values: SpaceValue[];
  relations: SpaceRelation[];
  entities: { id: string; name: string }[];
}

// ── Fetch all space data in bulk ─────────────────────────────────────────────

async function fetchSpaceData(spaceId: string): Promise<SpaceData> {
  // Step A: fetch all values and relations in the space (2 API calls)
  const [valuesData, relationsData] = await Promise.all([
    gql(`{ values(filter: { spaceId: { is: "${spaceId}" } }) { entityId propertyId } }`),
    gql(`{ relations(filter: { spaceId: { is: "${spaceId}" } }) { id entityId toEntityId } }`),
  ]);

  const values: SpaceValue[] = valuesData.values ?? [];
  const relations: SpaceRelation[] = relationsData.relations ?? [];

  // Collect all entity IDs
  const idSet = new Set<string>();
  for (const v of values) idSet.add(v.entityId);
  for (const r of relations) {
    idSet.add(r.entityId);
    idSet.add(r.toEntityId);
  }
  const ids = [...idSet];

  if (ids.length === 0) return { values, relations, entities: [] };

  // Step B: fetch names in batches of 200
  const BATCH = 200;
  const entities: { id: string; name: string }[] = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const filter = batch.map(id => `"${id}"`).join(", ");
    const data = await gql(`{ entities(filter: { id: { in: [${filter}] } }) { id name } }`);
    entities.push(...(data.entities ?? []));
  }

  return { values, relations, entities };
}

// ── Build delete ops from prefetched data ────────────────────────────────────

function buildDeleteOps(
  entityIds: Set<string>,
  values: SpaceValue[],
  relations: SpaceRelation[],
): Op[] {
  // Group values by entity: entityId → Set<propertyId>
  const valuesByEntity = new Map<string, Set<string>>();
  for (const v of values) {
    if (!entityIds.has(v.entityId)) continue;
    let props = valuesByEntity.get(v.entityId);
    if (!props) { props = new Set(); valuesByEntity.set(v.entityId, props); }
    props.add(v.propertyId);
  }

  // Group relations by fromEntity: entityId → relationId[]
  const relationsByEntity = new Map<string, string[]>();
  for (const r of relations) {
    if (!entityIds.has(r.entityId)) continue;
    let rels = relationsByEntity.get(r.entityId);
    if (!rels) { rels = []; relationsByEntity.set(r.entityId, rels); }
    rels.push(r.id);
  }

  const ops: Op[] = [];

  for (const entityId of entityIds) {
    const propertyIds = valuesByEntity.get(entityId);
    if (propertyIds && propertyIds.size > 0) {
      const result = Graph.updateEntity({
        id: entityId,
        unset: [...propertyIds].map(p => ({ property: p })),
      });
      ops.push(...result.ops);
    }

    const relationIds = relationsByEntity.get(entityId);
    if (relationIds) {
      for (const relId of relationIds) {
        const result = Graph.deleteRelation({ id: relId });
        ops.push(...result.ops);
      }
    }
  }

  return ops;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`  Delete Space Data`);
  console.log(`  Space:      ${SPACE_ID}`);
  console.log(`  Home:       ${HOME_ENTITY_ID}`);
  console.log(`  Mode:       ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE"}`);
  if (LIMIT !== Infinity) console.log(`  Limit:      ${LIMIT} entities`);
  console.log(`═══════════════════════════════════════════════════════\n`);

  // Step 1: Fetch all space data in bulk
  console.log("── Step 1: Fetching all space data ──");
  const spaceData = await fetchSpaceData(SPACE_ID);
  console.log(`  Found ${spaceData.entities.length} entities, ${spaceData.values.length} values, ${spaceData.relations.length} relations\n`);

  // Step 2: Determine protected entities (home + its direct targets)
  console.log("── Step 2: Determining protected entities ──");
  const homeTargets = new Set<string>();
  for (const r of spaceData.relations) {
    if (r.entityId === HOME_ENTITY_ID) homeTargets.add(r.toEntityId);
  }
  const protectedIds = new Set([HOME_ENTITY_ID, ...homeTargets]);
  console.log(`  Home entity has ${homeTargets.size} relation targets (will be protected)`);
  console.log(`  Total protected: ${protectedIds.size} entities\n`);

  // Step 3: Filter to entities we should delete
  const toDelete = spaceData.entities.filter(e => !protectedIds.has(e.id));
  const limited = toDelete.slice(0, LIMIT === Infinity ? toDelete.length : LIMIT);

  console.log(`── Step 3: Deletion plan ──`);
  console.log(`  Entities to delete: ${toDelete.length}`);
  if (LIMIT !== Infinity && limited.length < toDelete.length) {
    console.log(`  (Limited to: ${limited.length})`);
  }
  console.log(`  Skipping (protected): ${protectedIds.size}`);

  // Step 4: Build delete ops from prefetched data (no API calls)
  const deleteIds = new Set(limited.map(e => e.id));
  const ops = buildDeleteOps(deleteIds, spaceData.values, spaceData.relations);

  console.log(`\n── Step 4: Generated ${ops.length} delete ops for ${limited.length} entities ──`);
  for (let i = 0; i < limited.length; i++) {
    console.log(`  [${i + 1}/${limited.length}] ${limited[i].name ?? limited[i].id}`);
  }

  if (DRY_RUN) {
    printOps(ops, ".", "delete_ops_dryrun.txt");
    console.log(`\n  ${limited.length} entities, ${ops.length} ops written to delete_ops_dryrun.txt`);
    console.log("  Run without --dry-run to execute.");
    return;
  }

  // Confirmation prompt (skip when piped / non-interactive)
  if (process.stdin.isTTY) {
    const readline = await import("readline");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise<string>(resolve =>
      rl.question(`\n  Delete ${limited.length} entities from space ${SPACE_ID}? (yes/no): `, resolve)
    );
    rl.close();
    if (answer.trim().toLowerCase() !== "yes") {
      console.log("  Aborted.");
      return;
    }
  }

  // Step 5: Publish all ops in a single call
  console.log(`\n── Step 5: Publishing ${ops.length} ops ──`);
  await publishOps(ops, "Delete space data", SPACE_ID);

  console.log(`\n── Done ──`);
  console.log(`  Entities deleted: ${limited.length}`);
  console.log(`  Ops published:    ${ops.length}`);
  console.log(`  Protected (skipped): ${protectedIds.size}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
