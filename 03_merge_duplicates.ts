import { gql } from './src/functions.js';
import { TYPES, DATA_TYPE_PROPERTY, DATA_TYPE_TO_SDK } from './src/constants.js';
import { mergeEntities } from './src/entity_ops.js';

// ─── Configuration ──────────────────────────────────────────────────────────
// Finds duplicate Type and Property entities and merges them automatically.
// Property duplicates with data type mismatches are SKIPPED (logged as warnings).
// Run with: bun run 03_merge_duplicates.ts

const DRY_RUN = true; // Set to false to actually publish merges

// Spaces in ranked order (highest priority first)
const SPACES = [
  { name: 'Root',          id: 'a19c345ab9866679b001d7d2138d88a1' },
  { name: 'Geo Education', id: '784bfddae3f3976118c561bf28195b44' },
  { name: 'Crypto',        id: 'c9f267dcb0d270718c2a3c45a64afd32' },
  { name: 'AI',            id: '41e851610e13a19441c4d980f2f2ce6b' },
  { name: 'Health',        id: '52c7ae149838b6d47ce0f3b2a5974546' },
  { name: 'Podcasts',      id: 'b5a31f8182b042437ede0f84ee02f104' },
  { name: 'Software',      id: '9b611b848b12491b9b6b43f3cf019b8b' },
  { name: 'Technology',    id: '870e3b3068661e6280fad2ab456829bc' },
  { name: 'Industries',    id: 'd69608290513c2a91102c939b3265bd7' },
];

const spaceRank = new Map(SPACES.map((s, i) => [s.id, i]));
const spaceName = new Map(SPACES.map(s => [s.id, s.name]));

// ─── Types ──────────────────────────────────────────────────────────────────

interface EntityHit {
  id: string;
  name: string;
  spaceId: string;
  dataType?: string | null;
}

interface DuplicateGroup {
  name: string;
  main: EntityHit;
  secondaries: EntityHit[];
  hasDataTypeMismatch: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchEntitiesOfType(typeId: string, spaceId: string): Promise<EntityHit[]> {
  const hits: EntityHit[] = [];
  let offset = 0;
  const PAGE = 100;

  while (true) {
    const data = await gql(`{
      entities(
        spaceId: "${spaceId}"
        typeId: "${typeId}"
        first: ${PAGE}
        offset: ${offset}
      ) {
        id
        name
      }
    }`);

    const entities = data.entities ?? [];
    for (const e of entities) {
      const name = (e.name ?? '').trim();
      if (!name) continue;
      hits.push({ id: e.id, name, spaceId });
    }

    if (entities.length < PAGE) break;
    offset += PAGE;
  }

  return hits;
}

async function getPropertyDataType(propertyId: string): Promise<string | null> {
  const data = await gql(`{
    relations(filter: {
      fromEntityId: { is: "${propertyId}" }
      typeId: { is: "${DATA_TYPE_PROPERTY}" }
    }) {
      toEntityId
      toEntity { name }
    }
  }`);
  const rels = data.relations ?? [];
  if (rels.length === 0) return null;
  const toEntityId = rels[0].toEntityId;
  const mapped = DATA_TYPE_TO_SDK[toEntityId];
  if (mapped) return mapped;
  const name = rels[0].toEntity?.name;
  return name ? name.toLowerCase() : null;
}

async function countBacklinks(entityId: string): Promise<number> {
  const data = await gql(`{
    relations(filter: {
      toEntityId: { is: "${entityId}" }
    }) {
      id
    }
  }`);
  return (data.relations ?? []).length;
}

async function findDuplicates(label: string, typeId: string): Promise<DuplicateGroup[]> {
  console.log(`\nSearching for duplicate ${label} entities across ${SPACES.length} spaces...\n`);

  const allHits: EntityHit[] = [];
  for (const space of SPACES) {
    const hits = await fetchEntitiesOfType(typeId, space.id);
    console.log(`  ${space.name}: ${hits.length} ${label} entities`);
    allHits.push(...hits);
  }

  console.log(`  Total: ${allHits.length}`);

  // Group by lowercase name
  const byName = new Map<string, EntityHit[]>();
  for (const hit of allHits) {
    const key = hit.name.toLowerCase();
    const list = byName.get(key) ?? [];
    list.push(hit);
    byName.set(key, list);
  }

  // Deduplicate: same entity ID across multiple spaces
  for (const [key, hits] of byName) {
    const uniqueById = new Map<string, EntityHit>();
    for (const hit of hits) {
      const existing = uniqueById.get(hit.id);
      if (!existing || (spaceRank.get(hit.spaceId) ?? 999) < (spaceRank.get(existing.spaceId) ?? 999)) {
        uniqueById.set(hit.id, hit);
      }
    }
    byName.set(key, [...uniqueById.values()]);
  }

  // Filter to groups with 2+ distinct entity IDs
  const duplicateEntries = [...byName.entries()]
    .filter(([, hits]) => hits.length > 1)
    .sort(([a], [b]) => a.localeCompare(b));

  const groups: DuplicateGroup[] = [];

  for (const [, hits] of duplicateEntries) {
    // For properties, fetch data types
    if (typeId === TYPES.property) {
      await Promise.all(hits.map(async h => {
        h.dataType = await getPropertyDataType(h.id);
      }));
    }

    // Sort by space rank
    hits.sort((a, b) => (spaceRank.get(a.spaceId) ?? 999) - (spaceRank.get(b.spaceId) ?? 999));

    // Determine main entity
    const bestRank = spaceRank.get(hits[0].spaceId) ?? 999;
    const topTied = hits.filter(h => (spaceRank.get(h.spaceId) ?? 999) === bestRank);

    let mainEntity: EntityHit;

    if (topTied.length > 1) {
      const counts = await Promise.all(
        topTied.map(async h => ({ hit: h, backlinks: await countBacklinks(h.id) }))
      );
      counts.sort((a, b) => b.backlinks - a.backlinks);
      mainEntity = counts[0].hit;
      console.log(`  (Tiebreak in ${spaceName.get(mainEntity.spaceId)}: ${counts.map(c => `${c.hit.id}=${c.backlinks} backlinks`).join(', ')})`);
    } else {
      mainEntity = topTied[0];
    }

    const secondaries = hits.filter(h => h !== mainEntity);

    let hasDataTypeMismatch = false;
    if (typeId === TYPES.property) {
      const dataTypes = new Set(hits.map(h => h.dataType ?? 'relation'));
      hasDataTypeMismatch = dataTypes.size > 1;
    }

    groups.push({ name: hits[0].name, main: mainEntity, secondaries, hasDataTypeMismatch });
  }

  return groups;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? '*** DRY RUN — no changes will be published ***\n' : '*** LIVE RUN — merges will be published ***\n');

  const categories = [
    { label: 'Type', typeId: TYPES.type },
    { label: 'Property', typeId: TYPES.property },
  ];

  let mergedCount = 0;
  let skippedCount = 0;

  for (const { label, typeId } of categories) {
    const groups = await findDuplicates(label, typeId);

    if (groups.length === 0) {
      console.log(`  No duplicate ${label} names found.\n`);
      continue;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`${label} — ${groups.length} duplicate name(s)`);
    console.log(`${'='.repeat(80)}\n`);

    for (const group of groups) {
      const dtLabel = (h: EntityHit) =>
        typeId === TYPES.property ? `  dataType=${h.dataType ?? 'relation'}` : '';

      // Skip property duplicates with data type mismatch
      if (group.hasDataTypeMismatch) {
        console.log(`SKIPPED "${group.name}" — DATA TYPE MISMATCH`);
        console.log(`  Main:       entityId=${group.main.id}  spaceId=${group.main.spaceId} (${spaceName.get(group.main.spaceId)})${dtLabel(group.main)}`);
        for (const sec of group.secondaries) {
          console.log(`  Secondary:  entityId=${sec.id}  spaceId=${sec.spaceId} (${spaceName.get(sec.spaceId)})${dtLabel(sec)}`);
        }
        console.log();
        skippedCount++;
        continue;
      }

      console.log(`MERGING "${group.name}"`);
      console.log(`  Main:       entityId=${group.main.id}  spaceId=${group.main.spaceId} (${spaceName.get(group.main.spaceId)})${dtLabel(group.main)}`);
      for (const sec of group.secondaries) {
        console.log(`  Secondary:  entityId=${sec.id}  spaceId=${sec.spaceId} (${spaceName.get(sec.spaceId)})${dtLabel(sec)}`);
      }

      try {
        await mergeEntities({
          mainEntityId: group.main.id,
          mainSpaceId: group.main.spaceId,
          secondaries: group.secondaries.map(s => ({ entityId: s.id, spaceId: s.spaceId })),
          dryRun: DRY_RUN,
        });
        mergedCount++;
        console.log(`  Done.\n`);
      } catch (err: any) {
        console.error(`  ERROR merging "${group.name}": ${err.message}\n`);
        skippedCount++;
      }
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Summary: ${mergedCount} merged, ${skippedCount} skipped${DRY_RUN ? ' (dry run)' : ''}`);
  console.log(`${'='.repeat(80)}`);
}

main().catch(console.error);
