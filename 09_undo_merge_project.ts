/**
 * Undo the merge of "Project" type entities.
 *
 * What the merge did:
 *   1. Added 10 relations from the secondary to the main entity (Properties → ...)
 *   2. Deleted the secondary entity (unset 2 values, deleted 16 relations)
 *   3. Generated 20 ops (fix package) to repoint 10 entities in space 997f4334...
 *      from the secondary Project type to the main Project type
 *
 * What this script does:
 *   1. Re-creates the secondary entity with its original values and relations
 *   2. Deletes the 10 relations that were added to the main entity
 *   3. Reverts the backlinks in space 997f4334... back to the secondary Project type
 *      (only if the fix package was published — detected automatically)
 *
 * Run with: bun run 09_undo_merge_project.ts
 */

import { Graph, type Op } from '@geoprotocol/geo-sdk';
import { gql, publishOps } from './src/functions.js';

const DRY_RUN = false; // Set to false to actually publish

const SPACE_ID = 'a19c345ab9866679b001d7d2138d88a1'; // Root
const MAIN_ENTITY_ID = '484a18c5030a499cb0f2ef588ff16d50';       // Project (kept)
const SECONDARY_ENTITY_ID = 'b9a456d44ee44f418f9cca322871cafa';   // Project (deleted)

// ─── Relations that were ADDED to the main entity (need to delete) ───────────
// These are the relations logged as "Adding relation:" in the merge output.
// We identify them by typeId + toEntityId on the main entity.

const ADDED_RELATION_NAMES = [
  'Start Date',
  'Description',
  'Project status',
  'Tasks',
  'Lead',
  'Priority',
  'Name',
  'Deadline',
  'Completed at',
  'Milestones',
];

async function main() {
  console.log(`*** ${DRY_RUN ? 'DRY RUN' : 'LIVE RUN'} ***\n`);

  const ops: Op[] = [];

  // ─── Step 1: Query the main entity's current relations to find the ones to delete ──
  console.log('Step 1: Finding relations to remove from main entity...');

  const mainData = await gql(`{
    relations(filter: {
      fromEntityId: { is: "${MAIN_ENTITY_ID}" }
      spaceId: { is: "${SPACE_ID}" }
    }) {
      id
      typeId
      toEntityId
      toEntity { name }
      typeEntity { name }
    }
  }`);

  const mainRelations = mainData.relations ?? [];
  console.log(`  Main entity has ${mainRelations.length} outgoing relations`);

  // Find relations whose target name matches the ones added during merge
  const relationsToDelete: Array<{ id: string; typeName: string; targetName: string }> = [];
  for (const r of mainRelations) {
    const targetName = r.toEntity?.name ?? '';
    if (ADDED_RELATION_NAMES.includes(targetName)) {
      relationsToDelete.push({
        id: r.id,
        typeName: r.typeEntity?.name ?? r.typeId,
        targetName,
      });
    }
  }

  console.log(`  Found ${relationsToDelete.length} relations to delete:`);
  for (const r of relationsToDelete) {
    console.log(`    ${r.typeName} → ${r.targetName} (${r.id})`);
    const result = Graph.deleteRelation({ id: r.id });
    ops.push(...result.ops);
  }

  // ─── Step 2: Recreate the secondary entity ────────────────────────────────
  console.log('\nStep 2: Querying secondary entity to check current state...');

  // Check if the secondary entity still exists (may have values/relations cleared but entity row might exist)
  const existingCheck = await gql(`{
    entities(filter: { id: { is: "${SECONDARY_ENTITY_ID}" } }) {
      id
      name
      typeIds
    }
  }`);

  const existing = existingCheck.entities?.[0];
  if (existing) {
    console.log(`  Secondary entity still exists: name="${existing.name}", types=${JSON.stringify(existing.typeIds)}`);
    console.log('  Will re-add its values and relations.');
  } else {
    console.log('  Secondary entity not found — will recreate from scratch.');
  }

  // The merge deleted the secondary's values and relations.
  // From the merge output:
  //   - 2 values across 2 properties were unset
  //   - 16 outgoing relations were deleted
  //
  // We need to recreate:
  //   1. The entity name (value on the Name property)
  //   2. The Types relation (→ Type)
  //   3. The Properties relations (the 16 relations that were on the secondary)
  //
  // The secondary had these relations (from merge output):
  //   Properties → Start Date
  //   Properties → Description
  //   Properties → Team members      (was also on main — skipped during merge)
  //   Properties → Project status
  //   Properties → Tags              (was also on main)
  //   Properties → Tasks
  //   Properties → Lead
  //   Properties → Topics            (was also on main)
  //   Properties → Priority
  //   Properties → Name
  //   Properties → Deadline
  //   Properties → Broader projects  (was also on main)
  //   Properties → Completed at
  //   Properties → Types → Type      (was also on main)
  //   Properties → Milestones
  //   Properties → Subprojects       (was also on main)

  // To recreate properly, we need to know the entity IDs of these property targets.
  // Let's look them up from the main entity (which now has all of them).

  console.log('\nStep 3: Looking up property entity IDs from main entity...');

  // All the property names that were on the secondary (both added and skipped-duplicate)
  const ALL_SECONDARY_PROPERTY_NAMES = [
    'Start Date',
    'Description',
    'Team members',
    'Project status',
    'Tags',
    'Tasks',
    'Lead',
    'Topics',
    'Priority',
    'Name',
    'Deadline',
    'Broader projects',
    'Completed at',
    'Milestones',
    'Subprojects',
  ];

  // Build a map of property name → { toEntityId, typeId } from the main entity's relations
  const propertyMap = new Map<string, { toEntityId: string; typeId: string; entityId: string }>();
  for (const r of mainRelations) {
    const targetName = r.toEntity?.name ?? '';
    if (ALL_SECONDARY_PROPERTY_NAMES.includes(targetName)) {
      propertyMap.set(targetName, {
        toEntityId: r.toEntityId,
        typeId: r.typeId,
        entityId: r.entityId,
      });
    }
  }

  // Also find the Types → Type relation
  const typesRelation = mainRelations.find(
    (r: any) => r.typeEntity?.name === 'Types' && r.toEntity?.name === 'Type'
  );

  console.log(`  Resolved ${propertyMap.size} property targets from main entity`);
  const missing = ALL_SECONDARY_PROPERTY_NAMES.filter(n => !propertyMap.has(n));
  if (missing.length > 0) {
    console.warn(`  WARNING: Could not find targets for: ${missing.join(', ')}`);
    console.warn('  These relations will NOT be recreated. You may need to look them up manually.');
  }

  // Recreate the secondary entity with name "Project"
  console.log('\n  Recreating secondary entity with name and type...');

  // Set the name value
  const createResult = Graph.updateEntity({
    id: SECONDARY_ENTITY_ID,
    values: [
      { property: 'a126ca530c8e48d5b88882c734c38935', type: 'text', value: 'Project' },
    ],
  });
  ops.push(...createResult.ops);

  // Add Types → Type relation
  if (typesRelation) {
    console.log(`  Adding Types → Type relation`);
    const result = Graph.createRelation({
      fromEntity: SECONDARY_ENTITY_ID,
      toEntity: typesRelation.toEntityId,
      type: typesRelation.typeId,
      entityId: typesRelation.entityId,
    });
    ops.push(...result.ops);
  } else {
    console.warn('  WARNING: Could not find Types → Type relation on main entity');
  }

  // Add all Properties relations
  for (const propName of ALL_SECONDARY_PROPERTY_NAMES) {
    const target = propertyMap.get(propName);
    if (!target) continue;

    console.log(`  Adding relation: Properties → ${propName}`);
    const result = Graph.createRelation({
      fromEntity: SECONDARY_ENTITY_ID,
      toEntity: target.toEntityId,
      type: target.typeId,
    });
    ops.push(...result.ops);
  }

  // ─── Step 4: Revert backlinks — entities whose Types relation was repointed ──
  // The merge updated entities that had a Types relation pointing to the secondary
  // Project type, changing them to point to the main. We need to find those and
  // repoint them back to the secondary.
  //
  // We look for backlinks TO the main entity with relationType = Types (8f151ba4...)
  // that were NOT there before the merge (i.e. the entity was originally typed as
  // the secondary Project).

  console.log('\nStep 4: Reverting backlinks (Types relations repointed to main)...');

  // The fix package lists the 10 entities whose Types relations were changed.
  // These "from" entities had their Types relation repointed: secondary → main.
  // We need to find the current relation on each and repoint back to secondary.
  const REPOINTED_ENTITIES = [
    { from: '53e79587679a47fa96e33c0656d9d51a', position: 'a03EU' },
    { from: 'a26696c83f9e410fac009fe7f46419e2', position: 'a09Lm' },
    { from: 'd6e6354820674b10bbbde1bebd31e162', position: 'a07pf' },
    { from: '127eff1fb97b4712a05d8f697fe7662f', position: 'a0321' },
    { from: '4a77a392f383472cb17109a191600abf', position: 'a05Sc' },
    { from: 'b483808efb9c4fd0bcb08518c9a5468b', position: 'a013V' },
    { from: '415b7324de6b4e7eaf7a6aca203b6167', position: 'a0B8y' },
    { from: '5d01f4df00ad4260b0f67bfd29bf3047', position: 'a05lD' },
    { from: '0ed4ad0687354e9099529a1558dd0fb6', position: 'a04qi' },
    { from: 'c01d797094a549409437b309a054367a', position: 'a05dN' },
  ];

  const TYPES_RELATION_TYPE = '8f151ba4de204e3c9cb499ddf96f48f1';
  let backlinkRevertCount = 0;

  for (const entry of REPOINTED_ENTITIES) {
    // Find the current Types relation from this entity → main Project
    const relData = await gql(`{
      relations(filter: {
        fromEntityId: { is: "${entry.from}" }
        typeId: { is: "${TYPES_RELATION_TYPE}" }
        toEntityId: { is: "${MAIN_ENTITY_ID}" }
      }) {
        id
        entityId
        fromEntity { name }
      }
    }`);

    const rels = relData.relations ?? [];
    if (rels.length === 0) {
      console.log(`  Entity ${entry.from}: no Types → main relation found (may not have been published)`);
      continue;
    }

    for (const r of rels) {
      const entityName = r.fromEntity?.name ?? entry.from;
      console.log(`  Reverting "${entityName}": Types → main Project → secondary Project`);

      // Delete the relation pointing to main
      const delResult = Graph.deleteRelation({ id: r.id });
      ops.push(...delResult.ops);

      // Recreate pointing to secondary
      const createResult = Graph.createRelation({
        fromEntity: entry.from,
        toEntity: SECONDARY_ENTITY_ID,
        type: TYPES_RELATION_TYPE,
        entityId: r.entityId,
        position: entry.position,
      });
      ops.push(...createResult.ops);
      backlinkRevertCount++;
    }
  }

  console.log(`  Reverted ${backlinkRevertCount} backlinks`);

  // ─── Summary & Publish ────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Total ops: ${ops.length}`);
  console.log(`  - ${relationsToDelete.length} relation deletions (from main entity)`);
  console.log(`  - ${backlinkRevertCount * 2} backlink revert ops (${backlinkRevertCount} delete + ${backlinkRevertCount} create)`);
  console.log(`  - ${ops.length - relationsToDelete.length - backlinkRevertCount * 2} creates (recreating secondary entity)`);
  console.log(`${'='.repeat(80)}`);

  if (ops.length === 0) {
    console.log('No ops to publish.');
    return;
  }

  if (DRY_RUN) {
    console.log('\nDRY RUN — no changes published.');
    console.log('Set DRY_RUN = false to publish.');
  } else {
    console.log('\nPublishing...');
    await publishOps(ops, 'Undo Project entity merge', SPACE_ID);
    console.log('Done.');
  }
}

main().catch(console.error);
