/**
 * Find and delete duplicate Topics/Subtopics/Broader topics relations across spaces.
 *
 * After the property merges, many entities ended up with duplicate relations
 * pointing to the same target. This script finds all duplicates and deletes
 * the extras, keeping one per (fromEntity, toEntity) pair.
 *
 * Run with: bun run 11_fix_duplicate_subtopics.ts
 */

import { Graph, type Op } from '@geoprotocol/geo-sdk';
import { gql, publishOps } from './src/functions.js';

const DRY_RUN = false; // Set to false to actually publish

// Set to an entity ID to only clean up duplicates on that entity (for testing).
// Set to null to clean up all duplicates in the space.
const TEST_ENTITY_ID: string | null = null;

const PROPERTIES_TO_CHECK = [
  { name: 'Topics',         id: '806d52bc27e94c9193c057978b093351' },
  { name: 'Subtopics',      id: '39e40cadb23d4f63ab2faea1596436c7' },
  { name: 'Broader topics', id: 'b35bd6d39fb64f3a8aeaf5a9b91b5ef6' },
];

const SPACES_TO_CHECK = [
  { name: 'Crypto',        id: 'c9f267dcb0d270718c2a3c45a64afd32' },
  { name: 'World Affairs', id: '89bd89bf28ff8a0963faf92a8c905e20' },
];

interface RelationHit {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  fromName: string;
  toName: string;
}

async function fetchRelations(typeId: string, spaceId: string): Promise<RelationHit[]> {
  // Single-entity test mode: use simple relations query
  if (TEST_ENTITY_ID) {
    const data = await gql(`{
      relations(filter: {
        fromEntityId: { is: "${TEST_ENTITY_ID}" }
        spaceId: { is: "${spaceId}" }
        typeId: { is: "${typeId}" }
      }) {
        id fromEntityId toEntityId
        fromEntity { name }
        toEntity { name }
      }
    }`);
    const hits: RelationHit[] = [];
    for (const n of data.relations ?? []) {
      hits.push({
        id: n.id,
        fromEntityId: n.fromEntityId,
        toEntityId: n.toEntityId,
        fromName: n.fromEntity?.name ?? n.fromEntityId,
        toName: n.toEntity?.name ?? n.toEntityId,
      });
    }
    console.log(`    Fetched ${hits.length} relations (test entity mode)`);
    return hits;
  }

  // Full scan: use cursor-paginated connection
  const hits: RelationHit[] = [];
  let cursor: string | null = null;

  while (true) {
    const afterClause = cursor ? `after: "${cursor}"` : '';
    const data = await gql(`{
      relationsConnection(
        filter: {
          spaceId: { is: "${spaceId}" }
          typeId: { is: "${typeId}" }
        }
        first: 500
        ${afterClause}
      ) {
        nodes {
          id
          fromEntityId
          toEntityId
          fromEntity { name }
          toEntity { name }
        }
        pageInfo { hasNextPage endCursor }
      }
    }`);

    const conn = data.relationsConnection;
    for (const n of conn?.nodes ?? []) {
      hits.push({
        id: n.id,
        fromEntityId: n.fromEntityId,
        toEntityId: n.toEntityId,
        fromName: n.fromEntity?.name ?? n.fromEntityId,
        toName: n.toEntity?.name ?? n.toEntityId,
      });
    }

    console.log(`    Fetched ${hits.length} relations...`);

    if (!conn?.pageInfo?.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }

  return hits;
}

function findDuplicates(relations: RelationHit[]): RelationHit[] {
  const groups = new Map<string, RelationHit[]>();
  for (const r of relations) {
    const key = `${r.fromEntityId}:${r.toEntityId}`;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }

  const toDelete: RelationHit[] = [];
  let dupGroupCount = 0;

  for (const [, rels] of groups) {
    if (rels.length <= 1) continue;
    dupGroupCount++;
    // Keep the first, delete the rest
    for (let i = 1; i < rels.length; i++) {
      toDelete.push(rels[i]);
    }
  }

  console.log(`    Duplicate groups: ${dupGroupCount}`);
  console.log(`    Extra relations to delete: ${toDelete.length}`);

  // Show a sample
  const sampleGroups = [...groups.values()].filter(v => v.length > 1).slice(0, 3);
  for (const rels of sampleGroups) {
    console.log(`      ${rels[0].fromName} → ${rels[0].toName}: ${rels.length} copies`);
  }

  return toDelete;
}

async function main() {
  console.log(`*** ${DRY_RUN ? 'DRY RUN' : 'LIVE RUN'} ***`);
  if (TEST_ENTITY_ID) {
    console.log(`*** TEST MODE: only entity ${TEST_ENTITY_ID} ***`);
  }
  console.log();

  let totalDeleted = 0;

  for (const space of SPACES_TO_CHECK) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Space: ${space.name} (${space.id})`);
    console.log(`${'='.repeat(60)}`);

    const spaceToDelete: RelationHit[] = [];

    for (const prop of PROPERTIES_TO_CHECK) {
      console.log(`\n  ${prop.name}:`);

      const relations = await fetchRelations(prop.id, space.id);
      console.log(`    Total: ${relations.length}`);

      if (relations.length === 0) continue;

      const toDelete = findDuplicates(relations);
      spaceToDelete.push(...toDelete);
    }

    if (spaceToDelete.length === 0) {
      console.log('\n  No duplicates in this space.');
      continue;
    }

    // Generate delete ops
    const ops: Op[] = [];
    for (const r of spaceToDelete) {
      const result = Graph.deleteRelation({ id: r.id });
      ops.push(...result.ops);
    }

    if (DRY_RUN) {
      console.log(`\n  DRY RUN — ${spaceToDelete.length} duplicates found.`);
    } else {
      console.log(`\n  Publishing ${ops.length} ops to ${space.name}...`);
      await publishOps(ops, `Delete duplicate topic relations`, space.id);
      console.log('  Done.');
    }

    totalDeleted += spaceToDelete.length;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Total: ${totalDeleted} duplicate relations ${DRY_RUN ? 'found' : 'deleted'}`);
  console.log(`${'='.repeat(60)}`);
}

main().catch(console.error);
