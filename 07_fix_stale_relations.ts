import { Graph, Position, type Op } from '@geoprotocol/geo-sdk';
import { gql, publishOps, printOps, getPublishableSpaceIds } from './src/functions.js';
import path from 'node:path';
import { SPACES, TYPES, PROPERTIES } from './src/constants.js';
import * as fs from 'fs';

// ─── Configuration ──────────────────────────────────────────────────────────
// Finds and fixes stale relations caused by the wrong-space publishing bug
// in mergeEntities/changeEntityId.
//
// The bug: cross-space backlink ops were published to mainSpaceId instead of
// the relation's own spaceId. This caused:
//   1. Stale relations in their original space (still pointing to deleted secondaries)
//   2. Wrong-space duplicates in mainSpaceId (new relations created there)
//
// This script:
//   Phase 1: Detect stale relations (toEntity has no name AND no typeIds = deleted)
//   Phase 2: Find the correct target by matching (fromEntityId, typeId) across spaces
//   Phase 3: Delete stale + wrong-space duplicate, create correct relation in proper space
//
// Run with: bun run 07_fix_stale_relations.ts

const DRY_RUN = false;

const spaceName = new Map(SPACES.map(s => [s.id, s.name]));

// ─── Types ──────────────────────────────────────────────────────────────────

interface StaleRelation {
  id: string;
  entityId: string;
  spaceId: string;
  fromEntityId: string;
  fromEntityName: string;
  toEntityId: string;
  typeId: string;
  typeName: string;
  toSpaceId: string | null;
  fromSpaceId: string | null;
  toVersionId: string | null;
  fromVersionId: string | null;
  position: string | null;
}

interface FixCase {
  stale: StaleRelation;
  correctTargetId: string;
  correctTargetName: string;
  wrongSpaceRelId: string | null;
  wrongSpaceId: string | null;
  /** True if a correct relation already exists in the stale relation's space */
  correctAlreadyExists: boolean;
}

// ─── Skip constants ─────────────────────────────────────────────────────────

const TEXT_BLOCK_TYPE = '76474f2f00894e77a0410b39fb17d0bf';
const IMAGE_TYPE      = 'ba4e41460010499da0a3caaa7f579d0e';
const VIDEO_TYPE      = 'd7a4817c9795405b93e212df759c43f8';
const MARKDOWN_PROP   = 'e3e363d1dd294ccb8e6ff3b76d99bc33';
const IPFS_URL_PROP   = '8a743832c0944a62b6650c3cc2f9c7bc';
const NAME_PROP       = 'a126ca530c8e48d5b88882c734c38935';

interface NameFix {
  entityId: string;
  spaceId: string;
  name: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function optionalRelationFields(r: StaleRelation) {
  return {
    ...(r.toSpaceId ? { toSpace: r.toSpaceId } : {}),
    ...(r.fromSpaceId ? { fromSpace: r.fromSpaceId } : {}),
    ...(r.toVersionId ? { toVersion: r.toVersionId } : {}),
    ...(r.fromVersionId ? { fromVersion: r.fromVersionId } : {}),
    ...(r.position ? { position: r.position } : {}),
  };
}

// ─── Phase 1: Detect ────────────────────────────────────────────────────────

async function getAllEntityIdsInSpace(spaceId: string): Promise<string[]> {
  // Split by typeId so each sub-query stays well under 2000 results,
  // working around the API's offset ≤ 1000 hard cap.
  const knownTypeIds = [
    ...Object.values(TYPES),
    TEXT_BLOCK_TYPE,
    IMAGE_TYPE,
    VIDEO_TYPE,
  ];

  const seen = new Set<string>();
  const PAGE = 1000;

  for (const typeId of knownTypeIds) {
    let offset = 0;
    while (true) {
      const data = await gql(`{
        entities(spaceId: "${spaceId}" typeId: "${typeId}" first: ${PAGE} offset: ${offset}) { id }
      }`);
      const entities = data.entities ?? [];
      for (const e of entities) seen.add(e.id);
      if (entities.length < PAGE) break;
      offset += PAGE;
      if (offset > 1000) break; // API hard cap
    }
  }

  return [...seen];
}

async function findStaleRelationsInSpace(spaceId: string): Promise<{ stale: StaleRelation[], nameFixes: NameFix[] }> {
  const stale: StaleRelation[] = [];
  const nameFixes: NameFix[] = [];

  // Paginate entity IDs first, then query relations per-batch of entities.
  // This avoids the API's offset ≤ 1000 cap on the relations query itself,
  // since no single entity will have anywhere near 2000 outgoing relations.
  const entityIds = await getAllEntityIdsInSpace(spaceId);

  const BATCH = 20;
  for (let i = 0; i < entityIds.length; i += BATCH) {
    const batch = entityIds.slice(i, i + BATCH);
    const filterIds = batch.map(id => `"${id}"`).join(', ');

    let offset = 0;
    const PAGE = 1000;
    while (true) {
      const data = await gql(`{
        relations(
          filter: {
            spaceId: { is: "${spaceId}" }
            fromEntityId: { in: [${filterIds}] }
          }
          first: ${PAGE}
          offset: ${offset}
        ) {
          id
          entityId
          fromEntityId
          fromEntity { name }
          toEntityId
          toEntity { name typeIds }
          typeId
          typeEntity { name }
          toSpaceId
          fromSpaceId
          toVersionId
          fromVersionId
          position
        }
      }`);

      const rels = data.relations ?? [];
      for (const r of rels) {
        const toName = (r.toEntity?.name ?? '').trim();
        if (toName) continue;

        const toTypeIds: string[] = r.toEntity?.typeIds ?? [];

        // Text block: if markdown content is present, fix name instead of treating as stale
        if (toTypeIds.includes(TEXT_BLOCK_TYPE)) {
          const valData = await gql(`{
            values(filter: {
              entityId: { is: "${r.toEntityId}" }
              propertyId: { is: "${MARKDOWN_PROP}" }
            }) { text }
          }`);
          const text = ((valData.values ?? [])[0]?.text ?? '').trim();
          if (text) {
            nameFixes.push({ entityId: r.toEntityId, spaceId, name: text.slice(0, 20) });
            continue;
          }
        }

        // Image or video: if IPFS url is present, leave the relation alone
        if (toTypeIds.includes(IMAGE_TYPE) || toTypeIds.includes(VIDEO_TYPE)) {
          const valData = await gql(`{
            values(filter: {
              entityId: { is: "${r.toEntityId}" }
              propertyId: { is: "${IPFS_URL_PROP}" }
            }) { text }
          }`);
          const url = ((valData.values ?? [])[0]?.text ?? '').trim();
          if (url) continue;
        }

        stale.push({
          id: r.id,
          entityId: r.entityId,
          spaceId,
          fromEntityId: r.fromEntityId,
          fromEntityName: r.fromEntity?.name ?? '(unnamed)',
          toEntityId: r.toEntityId,
          typeId: r.typeId,
          typeName: r.typeEntity?.name ?? r.typeId,
          toSpaceId: r.toSpaceId ?? null,
          fromSpaceId: r.fromSpaceId ?? null,
          toVersionId: r.toVersionId ?? null,
          fromVersionId: r.fromVersionId ?? null,
          position: r.position ?? null,
        });
      }

      if (rels.length < PAGE) break;
      offset += PAGE;
    }
  }

  return { stale, nameFixes };
}

// ─── Phase 2: Resolve ───────────────────────────────────────────────────────

async function findCorrectTarget(stale: StaleRelation): Promise<FixCase | null> {
  // Find all relations from the same fromEntity with the same typeId (across all spaces)
  const data = await gql(`{
    relations(filter: {
      fromEntityId: { is: "${stale.fromEntityId}" }
      typeId: { is: "${stale.typeId}" }
    }) {
      id
      entityId
      spaceId
      toEntityId
      toEntity { name }
      toSpaceId
      fromSpaceId
      toVersionId
      fromVersionId
      position
    }
  }`);

  const rels = data.relations ?? [];

  // Check if a correct relation already exists in the stale relation's space
  const sameSpaceValid = rels.find((r: any) => {
    const name = (r.toEntity?.name ?? '').trim();
    return name && r.spaceId === stale.spaceId && r.id !== stale.id;
  });

  // First try: match by entityId (the bug reuses bl.entityId for the wrong-space duplicate)
  const exactMatch = rels.find((r: any) => {
    const name = (r.toEntity?.name ?? '').trim();
    return name && r.entityId === stale.entityId && r.spaceId !== stale.spaceId;
  });

  if (exactMatch) {
    return {
      stale,
      correctTargetId: exactMatch.toEntityId,
      correctTargetName: exactMatch.toEntity?.name ?? '',
      wrongSpaceRelId: exactMatch.id,
      wrongSpaceId: exactMatch.spaceId,
      correctAlreadyExists: !!sameSpaceValid,
    };
  }

  // Fallback: match by (fromEntityId, typeId) — same from entity + same relation type,
  // different space, pointing to a valid (named) entity
  const fallback = rels.find((r: any) => {
    const name = (r.toEntity?.name ?? '').trim();
    return name && r.spaceId !== stale.spaceId && r.toEntityId !== stale.toEntityId;
  });

  if (fallback) {
    return {
      stale,
      correctTargetId: fallback.toEntityId,
      correctTargetName: fallback.toEntity?.name ?? '',
      wrongSpaceRelId: fallback.id,
      wrongSpaceId: fallback.spaceId,
      correctAlreadyExists: !!sameSpaceValid,
    };
  }

  if (sameSpaceValid) {
    // A correct relation already exists in this space — just need to delete the stale one
    return {
      stale,
      correctTargetId: sameSpaceValid.toEntityId,
      correctTargetName: sameSpaceValid.toEntity?.name ?? '',
      wrongSpaceRelId: null,
      wrongSpaceId: null,
      correctAlreadyExists: true,
    };
  }

  return null;
}

// ─── Phase 2b: Resolve via version history ─────────────────────────────────

async function resolveViaVersionHistory(stale: StaleRelation): Promise<FixCase | null> {
  // Look up the stale entity's old name and old type relations
  const versionData = await gql(`{
    valueVersions(
      filter: { entityId: { is: "${stale.toEntityId}" }, propertyId: { is: "${PROPERTIES.name}" } }
    ) {
      text
    }
    relationVersions(
      filter: { fromEntityId: { is: "${stale.toEntityId}" }, typeId: { is: "${PROPERTIES.types}" } }
    ) {
      toEntityId
    }
  }`);

  const names = (versionData.valueVersions ?? [])
    .map((v: any) => (v.text ?? '').trim())
    .filter((t: string) => t.length > 0);
  const typeIds = [...new Set(
    (versionData.relationVersions ?? []).map((r: any) => r.toEntityId).filter(Boolean)
  )] as string[];

  if (names.length === 0) return null;

  // Use the most recent name (first result)
  const oldName = names[0];

  // Search for a live entity with matching name + type.
  // The entities endpoint uses top-level args (spaceId, typeId), not a filter object,
  // so we query each (typeId × space) combination and match by name client-side.
  const searchTypeIds = typeIds.length > 0 ? typeIds : [null];
  const candidates: Array<{ id: string; name: string }> = [];
  const PAGE = 500;

  outer:
  for (const tid of searchTypeIds) {
    for (const space of SPACES) {
      const typeArg = tid ? `typeId: "${tid}"` : '';
      let offset = 0;
      while (true) {
        const data = await gql(`{
          entities(spaceId: "${space.id}" ${typeArg} first: ${PAGE} offset: ${offset}) {
            id
            name
          }
        }`);
        const entities = data.entities ?? [];
        for (const e of entities) {
          const eName = (e.name ?? '').trim();
          if (eName === oldName && e.id !== stale.toEntityId) {
            candidates.push({ id: e.id, name: eName });
            break outer;
          }
        }
        if (entities.length < PAGE) break;
        offset += PAGE;
      }
    }
  }

  if (candidates.length === 0) return null;

  // Pick the first matching live entity
  const match = candidates[0];
  return {
    stale,
    correctTargetId: match.id,
    correctTargetName: match.name,
    wrongSpaceRelId: null,
    wrongSpaceId: null,
    correctAlreadyExists: false,
  };
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? '*** DRY RUN ***\n' : '*** LIVE RUN ***\n');

  const lines: string[] = [];
  const log = (msg: string = '') => { console.log(msg); lines.push(msg); };

  // ═══ Phase 1: Detect stale relations ═══
  log('═'.repeat(80));
  log('Phase 1: Scanning for stale relations (pointing to deleted entities)');
  log('═'.repeat(80));

  const allStale: StaleRelation[] = [];
  const allNameFixes: NameFix[] = [];
  for (const space of SPACES) {
    const { stale, nameFixes } = await findStaleRelationsInSpace(space.id);
    log(`  ${space.name}: ${stale.length} stale relation(s), ${nameFixes.length} name fix(es)`);
    allStale.push(...stale);
    allNameFixes.push(...nameFixes);
  }

  log(`\n  Total: ${allStale.length} stale relation(s)\n`);

  if (allStale.length === 0) {
    log('No stale relations found. Nothing to fix.');
    writeReport(lines);
    return;
  }

  // ═══ Phase 2: Find correct targets ═══
  log('═'.repeat(80));
  log('Phase 2: Resolving correct targets for each stale relation');
  log('═'.repeat(80));

  const fixCases: FixCase[] = [];
  const unfixable: StaleRelation[] = [];

  // Deduplicate lookups: group stale relations by (fromEntityId, typeId)
  const grouped = new Map<string, StaleRelation[]>();
  for (const s of allStale) {
    const key = `${s.fromEntityId}:${s.typeId}`;
    const list = grouped.get(key) ?? [];
    list.push(s);
    grouped.set(key, list);
  }

  for (const [, staleGroup] of grouped) {
    // Resolve one, apply to all in the group
    const fix = await findCorrectTarget(staleGroup[0]);

    for (const stale of staleGroup) {
      if (fix) {
        fixCases.push({
          stale,
          correctTargetId: fix.correctTargetId,
          correctTargetName: fix.correctTargetName,
          // Only the first in the group should delete the wrong-space dup
          wrongSpaceRelId: stale === staleGroup[0] ? fix.wrongSpaceRelId : null,
          wrongSpaceId: stale === staleGroup[0] ? fix.wrongSpaceId : null,
          correctAlreadyExists: fix.correctAlreadyExists,
        });
      } else if (stale.typeId === PROPERTIES.types && stale.toEntityId === '8e7ed5cde92d4903962f773bd80d96e4') {
        // Deleted Topic duplicate → remap to the correct Topic type
        fixCases.push({
          stale,
          correctTargetId: TYPES.topic,
          correctTargetName: 'Topic',
          wrongSpaceRelId: null,
          wrongSpaceId: null,
          correctAlreadyExists: false,
        });
      } else if (stale.typeId === PROPERTIES.types && stale.toEntityId === '4d0076ff1e824585b03066f6bf6420ce') {
        // Deleted Project duplicate → remap to the correct Project type
        fixCases.push({
          stale,
          correctTargetId: '484a18c5030a499cb0f2ef588ff16d50',
          correctTargetName: 'Project',
          wrongSpaceRelId: null,
          wrongSpaceId: null,
          correctAlreadyExists: false,
        });
      } else if (stale.typeId === PROPERTIES.types && stale.toEntityId === '4faff0b210cb49958e20109409b8699c') {
        // Deleted Person duplicate → remap to the correct Person type
        fixCases.push({
          stale,
          correctTargetId: '7ed45f2bc48b419e8e4664d5ff680b0d',
          correctTargetName: 'Person',
          wrongSpaceRelId: null,
          wrongSpaceId: null,
          correctAlreadyExists: false,
        });
      } else if (stale.typeId === PROPERTIES.types && stale.toEntityId === 'af47cf1c2f57403393668d900ccc1a0f') {
        // Deleted Claim duplicate → remap to the correct Claim type
        fixCases.push({
          stale,
          correctTargetId: '96f859efa1ca4b229372c86ad58b694b',
          correctTargetName: 'Claim',
          wrongSpaceRelId: null,
          wrongSpaceId: null,
          correctAlreadyExists: false,
        });
      } else if (stale.typeId === PROPERTIES.types && stale.toEntityId === 'e9cd276d2e554b58b2d47ab03f5ddeb6') {
        // Deleted Episode duplicate → remap to the correct Episode type
        fixCases.push({
          stale,
          correctTargetId: '972d201ad78045689e01543f67b26bee',
          correctTargetName: 'Episode',
          wrongSpaceRelId: null,
          wrongSpaceId: null,
          correctAlreadyExists: false,
        });
      } else if (stale.typeId === PROPERTIES.types && stale.toEntityId === 'f29fc15e849941cf912aead23beadd77') {
        // Deleted Role duplicate → remap to the correct Role type
        fixCases.push({
          stale,
          correctTargetId: 'e4e366e9d5554b6892bf7358e824afd2',
          correctTargetName: 'Role',
          wrongSpaceRelId: null,
          wrongSpaceId: null,
          correctAlreadyExists: false,
        });
      } else if (stale.typeId === PROPERTIES.types && stale.toEntityId === 'af31eefce19745199fcbc0062cf2173b') {
        // Deleted Podcast duplicate → remap to the correct Podcast type
        fixCases.push({
          stale,
          correctTargetId: '4c81561d1f9541319cdddd20ab831ba2',
          correctTargetName: 'Podcast',
          wrongSpaceRelId: null,
          wrongSpaceId: null,
          correctAlreadyExists: false,
        });
      } else if (stale.typeId === PROPERTIES.types && stale.toEntityId === '937e2a85ced04f159c33ff9b9a96c5d0') {
        // Deleted Source duplicate → remap to the correct Source type
        fixCases.push({
          stale,
          correctTargetId: '706779bf537744a68694ea06cf87a3a2',
          correctTargetName: 'Source',
          wrongSpaceRelId: null,
          wrongSpaceId: null,
          correctAlreadyExists: false,
        });
      } else if (stale.typeId === PROPERTIES.types && stale.toEntityId === '8e23e802a20b494c8cda5d4a22d51206') {
        // Deleted Claim relation duplicate → remap to the correct Claim relation type
        fixCases.push({
          stale,
          correctTargetId: '31ce915d47bc4f28bd7842a10cb5d14c',
          correctTargetName: 'Claim relation',
          wrongSpaceRelId: null,
          wrongSpaceId: null,
          correctAlreadyExists: false,
        });
      } else if (stale.typeId === '8f637e6a629743c08eb9c49e971b2b54') {
        // Stale Perspectives relation → just delete, no replacement needed
        fixCases.push({
          stale,
          correctTargetId: '',
          correctTargetName: '(delete only)',
          wrongSpaceRelId: null,
          wrongSpaceId: null,
          correctAlreadyExists: true, // skip create
        });
      } else if (stale.typeId === '1155befffad549b7a2e0da4777b8792c') {
        // Stale Avatar relation → just delete, no replacement needed
        fixCases.push({
          stale,
          correctTargetId: '',
          correctTargetName: '(delete only)',
          wrongSpaceRelId: null,
          wrongSpaceId: null,
          correctAlreadyExists: true, // skip create
        });
      } else {
        unfixable.push(stale);
      }
    }
  }

  log(`\n  Fixable: ${fixCases.length}`);
  log(`  Unfixable (no matching relation found): ${unfixable.length}\n`);

  // ═══ Phase 2b: Resolve unfixable via version history ═══
  log('═'.repeat(80));
  log('Phase 2b: Resolving remaining via version history (old name + old types)');
  log('═'.repeat(80));

  let deleteOnlyCount = 0;
  // Deduplicate version lookups by stale toEntityId
  const unfixableByTarget = new Map<string, StaleRelation[]>();
  for (const s of unfixable) {
    const list = unfixableByTarget.get(s.toEntityId) ?? [];
    list.push(s);
    unfixableByTarget.set(s.toEntityId, list);
  }

  for (const [, staleGroup] of unfixableByTarget) {
    const fix = await resolveViaVersionHistory(staleGroup[0]);
    if (fix) {
      log(`  RESOLVED via history: DELETED(${staleGroup[0].toEntityId}) → "${fix.correctTargetName}" (${fix.correctTargetId})`);
      for (const stale of staleGroup) {
        fixCases.push({
          stale,
          correctTargetId: fix.correctTargetId,
          correctTargetName: fix.correctTargetName,
          wrongSpaceRelId: null,
          wrongSpaceId: null,
          correctAlreadyExists: false,
        });
      }
    } else {
      log(`  DELETE ONLY: DELETED(${staleGroup[0].toEntityId}) — no replacement found, will delete stale relation(s)`);
      deleteOnlyCount += staleGroup.length;
      for (const stale of staleGroup) {
        fixCases.push({
          stale,
          correctTargetId: '',
          correctTargetName: '(delete only)',
          wrongSpaceRelId: null,
          wrongSpaceId: null,
          correctAlreadyExists: true, // skip create, just delete
        });
      }
    }
  }

  log(`\n  Resolved via history: ${unfixable.length - deleteOnlyCount}`);
  log(`  Delete only (no replacement found): ${deleteOnlyCount}\n`);

  // Log fixable cases
  for (const fix of fixCases) {
    log(`  FIX: "${fix.stale.fromEntityName}" --[${fix.stale.typeName}]--> DELETED(${fix.stale.toEntityId})`);
    log(`    Stale in: ${spaceName.get(fix.stale.spaceId) ?? fix.stale.spaceId}  relation: ${fix.stale.id}`);
    log(`    Correct target: "${fix.correctTargetName}" (${fix.correctTargetId})`);
    if (fix.wrongSpaceRelId) {
      log(`    Wrong-space duplicate in: ${spaceName.get(fix.wrongSpaceId!) ?? fix.wrongSpaceId}  relation: ${fix.wrongSpaceRelId}`);
    }
    log();
  }

  // ═══ Phase 3: Fix ═══
  log('═'.repeat(80));
  log('Phase 3: Generating fix ops');
  log('═'.repeat(80));

  const opsBySpace = new Map<string, Op[]>();
  const addOps = (spaceId: string, ops: Op[]) => {
    const existing = opsBySpace.get(spaceId) ?? [];
    existing.push(...ops);
    opsBySpace.set(spaceId, existing);
  };

  // Track relations we've already decided to create in this batch
  // Key: "spaceId:fromEntityId:typeId:toEntityId"
  const createdInBatch = new Set<string>();
  let skippedDuplicates = 0;

  for (const fix of fixCases) {
    // 1. Delete the stale relation in its space
    const delStale = Graph.deleteRelation({ id: fix.stale.id });
    addOps(fix.stale.spaceId, delStale.ops);

    // 2. Create the corrected relation — but only if it doesn't already exist
    //    in the space (from the API) or from a prior fix in this batch
    const createKey = `${fix.stale.spaceId}:${fix.stale.fromEntityId}:${fix.stale.typeId}:${fix.correctTargetId}`;
    if (fix.correctAlreadyExists || createdInBatch.has(createKey)) {
      log(`  SKIP CREATE (already exists): "${fix.stale.fromEntityName}" --[${fix.stale.typeName}]--> "${fix.correctTargetName}" in ${spaceName.get(fix.stale.spaceId) ?? fix.stale.spaceId}`);
      skippedDuplicates++;
    } else {
      const createCorrect = Graph.createRelation({
        fromEntity: fix.stale.fromEntityId,
        toEntity: fix.correctTargetId,
        type: fix.stale.typeId,
        entityId: fix.stale.entityId,
        ...optionalRelationFields(fix.stale),
      });
      addOps(fix.stale.spaceId, createCorrect.ops);
      createdInBatch.add(createKey);
    }

    // 3. Delete the wrong-space duplicate (if found)
    if (fix.wrongSpaceRelId && fix.wrongSpaceId) {
      const delWrong = Graph.deleteRelation({ id: fix.wrongSpaceRelId });
      addOps(fix.wrongSpaceId, delWrong.ops);
    }
  }

  if (skippedDuplicates > 0) {
    log(`\n  Skipped ${skippedDuplicates} duplicate create(s)`);
  }

  // Name fixes: set name on text-block entities that have markdown content
  const seenNameFix = new Set<string>();
  for (const fix of allNameFixes) {
    if (seenNameFix.has(fix.entityId)) continue;
    seenNameFix.add(fix.entityId);
    log(`  NAME FIX: ${fix.entityId} → "${fix.name}"`);
    const result = Graph.updateEntity({
      id: fix.entityId,
      values: [{ property: NAME_PROP, type: 'text', value: fix.name }],
    });
    addOps(fix.spaceId, result.ops);
  }

  // ─── Phase 4: Orphan cleanup ─────────────────────────────────────────────
  // Collect stale toEntityIds that we're fixing — check if they become orphaned
  const staleEntityIds = [...new Set(fixCases.map(f => f.stale.toEntityId))];
  // Also track which spaces each stale entity appears in
  const staleEntitySpaces = new Map<string, Set<string>>();
  for (const fix of fixCases) {
    const set = staleEntitySpaces.get(fix.stale.toEntityId) ?? new Set();
    set.add(fix.stale.spaceId);
    staleEntitySpaces.set(fix.stale.toEntityId, set);
  }

  log(`\n${'═'.repeat(80)}`);
  log('Phase 4: Checking for orphaned stale entities');
  log('═'.repeat(80));

  let orphanCount = 0;
  for (const entityId of staleEntityIds) {
    // Check if any relations still point TO this entity (excluding ones we're deleting)
    const deletedRelIds = new Set(
      fixCases.filter(f => f.stale.toEntityId === entityId).map(f => f.stale.id)
    );
    const data = await gql(`{
      relations(filter: { toEntityId: { is: "${entityId}" } }) {
        id
      }
    }`);
    const remainingRels = (data.relations ?? []).filter((r: any) => !deletedRelIds.has(r.id));
    if (remainingRels.length === 0) {
      orphanCount++;
      log(`  ORPHAN: ${entityId} — deleting entity`);
      // Delete the orphaned entity in each space it appeared
      const spaces = staleEntitySpaces.get(entityId) ?? new Set();
      for (const spaceId of spaces) {
        const delEntity = await Graph.deleteEntity({ id: entityId, spaceId });
        addOps(spaceId, delEntity.ops);
      }
    }
  }
  log(`  ${orphanCount} orphaned entit${orphanCount === 1 ? 'y' : 'ies'} to delete\n`);

  // Determine which spaces we can publish to
  const spaceIdsWithOps = [...opsBySpace.keys()].filter(id => (opsBySpace.get(id)?.length ?? 0) > 0);
  const publishable = await getPublishableSpaceIds(spaceIdsWithOps);

  // Publish to spaces we have editor access; export fix packages for the rest
  for (const [spaceId, ops] of opsBySpace) {
    if (ops.length === 0) continue;
    const name = spaceName.get(spaceId) ?? spaceId;

    // Always export fix packages for spaces we can't publish to
    if (!publishable.has(spaceId)) {
      log(`  ${name}: ${ops.length} ops — NO EDITOR ACCESS, exporting fix package...`);
      const spaceFixCases = fixCases.filter(f => f.stale.spaceId === spaceId);
      exportFixPackage(spaceId, name, ops, spaceFixCases);
      log(`    Exported to output/fix_packages/${name.replace(/\s+/g, '_')}/`);
    } else if (DRY_RUN) {
      log(`  ${name}: ${ops.length} ops (dry run)`);
    } else {
      log(`  ${name}: ${ops.length} ops — publishing...`);
      await publishOps(ops, `Fix stale relations from wrong-space bug`, spaceId);
      log(`    Published.`);
    }
  }

  // ═══ Summary ═══
  log(`\n${'═'.repeat(80)}`);
  log('SUMMARY');
  log('═'.repeat(80));
  log(`  Stale relations found: ${allStale.length}`);
  log(`  Fixed (Phase 2): ${fixCases.length - (unfixable.length)}`);
  log(`  Fixed (Phase 2b via history): ${unfixable.length - deleteOnlyCount}`);
  log(`  Delete only (no replacement): ${deleteOnlyCount}`);
  log(`  Total fixed: ${fixCases.length}`);
  log(`  Orphaned entities deleted: ${orphanCount}`);
  log(`  Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);

  let totalOps = 0;
  for (const [spaceId, ops] of opsBySpace) {
    totalOps += ops.length;
    log(`    ${spaceName.get(spaceId) ?? spaceId}: ${ops.length} ops`);
  }
  log(`  Total ops: ${totalOps}`);

  // ═══ Most frequent stale toEntityIds ═══
  log(`\n${'═'.repeat(80)}`);
  log('Most frequent stale toEntityIds');
  log('═'.repeat(80));

  const toEntityCounts = new Map<string, number>();
  for (const s of allStale) {
    toEntityCounts.set(s.toEntityId, (toEntityCounts.get(s.toEntityId) ?? 0) + 1);
  }
  const sortedToEntities = [...toEntityCounts.entries()]
    .sort((a, b) => b[1] - a[1]);

  for (const [toEntityId, count] of sortedToEntities) {
    log(`  ${count}x  ${toEntityId}`);
  }

  writeReport(lines);
}

function exportFixPackage(
  spaceId: string,
  name: string,
  ops: Op[],
  spaceFixCases: FixCase[],
) {
  const dirName = name.replace(/\s+/g, '_');
  const dir = path.join('output', 'fix_packages', dirName);
  fs.mkdirSync(dir, { recursive: true });

  // 1. Write ops JSON
  printOps(ops, dir, 'ops.json');

  // 2. Write report
  const report: string[] = [
    `Fix Package: ${name}`,
    `Space ID: ${spaceId}`,
    `Generated: ${new Date().toISOString()}`,
    `Total ops: ${ops.length}`,
    '',
    '═'.repeat(70),
    'What this fixes:',
    '═'.repeat(70),
    '',
  ];
  for (const fix of spaceFixCases) {
    report.push(`  "${fix.stale.fromEntityName}" --[${fix.stale.typeName}]--> DELETED(${fix.stale.toEntityId})`);
    report.push(`    Relation ID: ${fix.stale.id}`);
    if (fix.correctTargetId) {
      report.push(`    → Replace with: "${fix.correctTargetName}" (${fix.correctTargetId})`);
    } else {
      report.push(`    → Delete only (no replacement)`);
    }
    report.push('');
  }
  fs.writeFileSync(path.join(dir, 'report.txt'), report.join('\n'));

  // 3. Write README
  const readme = `# Fix Package: ${name}

This folder contains a set of pre-generated operations to fix stale relations
in the **${name}** space (\`${spaceId}\`).

Stale relations point to entities that have been deleted. This package either
remaps them to the correct live entity or removes them entirely.

## Contents

| File | Description |
|------|-------------|
| \`README.md\` | This file |
| \`report.txt\` | Detailed list of every relation being fixed and what the fix does |
| \`ops.json\` | The raw operations to publish (${ops.length} ops) |
| \`publish.ts\` | A self-contained script that publishes the ops on-chain |

## Prerequisites

- [Bun](https://bun.sh) installed
- You must be an **editor** of the ${name} space
- A smart wallet private key (\`PK_SW\`) with access to that space

## How to run

1. Clone or copy the \`content_management\` project (this folder relies on its
   \`node_modules\` for the Geo SDK).

2. Install dependencies from the project root if you haven't already:
   \`\`\`
   bun install
   \`\`\`

3. Create a \`.env\` file in the project root (or add to an existing one) with
   your smart wallet private key:
   \`\`\`
   PK_SW=0xYOUR_PRIVATE_KEY_HERE
   \`\`\`

4. Run the publish script:
   \`\`\`
   bun run output/fix_packages/${dirName}/publish.ts
   \`\`\`

5. The script will:
   - Load the ops from \`ops.json\`
   - Detect your space membership and editor status
   - Submit a proposal to the DAO (or publish directly for personal spaces)
   - If you are an editor, it will also auto-vote YES to approve the proposal

## What gets fixed

See \`report.txt\` for the full list. In summary: **${spaceFixCases.length}** stale
relation(s) are being fixed across **${ops.length}** operations.

## Questions?

If something goes wrong, check that:
- Your \`PK_SW\` is correct and the associated wallet is an editor of this space
- You have run \`bun install\` from the project root
- The Geo testnet API is reachable (\`https://testnet-api.geobrowser.io/graphql\`)
`;
  fs.writeFileSync(path.join(dir, 'README.md'), readme);

  // 4. Write standalone publish script
  const script = `#!/usr/bin/env bun
/**
 * Fix Package Publisher — ${name}
 * Space ID: ${spaceId}
 *
 * This script publishes pre-generated fix ops to the "${name}" space.
 * You must be an editor of this space to run it.
 *
 * Setup:
 *   1. Make sure you have bun installed
 *   2. Run: bun install (from the content_management root)
 *   3. Copy .env.example to .env and fill in your PK_SW (smart wallet private key)
 *   4. Run: bun run output/fix_packages/${dirName}/publish.ts
 */
import { daoSpace, getSmartAccountWalletClient, personalSpace, type Op } from '@geoprotocol/geo-sdk';
import dotenv from 'dotenv';
import * as fs from 'fs';
import path from 'node:path';

dotenv.config();

const TESTNET_RPC_URL = 'https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz';
const SPACE_ID = '${spaceId}';
const SPACE_NAME = '${name}';

async function gql(query: string, variables?: Record<string, any>) {
  const res = await fetch('https://testnet-api.geobrowser.io/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(\`API error: \${res.status} \${res.statusText}\\n\${body}\`);
  }
  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
    throw new Error(\`GraphQL: \${json.errors[0].message}\`);
  }
  return json.data;
}

async function main() {
  const privateKey = process.env.PK_SW as \`0x\${string}\`;
  if (!privateKey) throw new Error('PK_SW not set in .env');

  // Load ops and restore UUID hex strings to Uint8Array(16)
  const opsPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'ops.json');
  const raw = JSON.parse(fs.readFileSync(opsPath, 'utf-8'));
  const hexToBytes = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return bytes;
  };
  const restoreUuids = (obj: any): any => {
    if (typeof obj === 'string' && /^[0-9a-f]{32}$/i.test(obj)) return hexToBytes(obj);
    if (Array.isArray(obj)) return obj.map(restoreUuids);
    if (obj && typeof obj === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(obj)) out[k] = restoreUuids(v);
      return out;
    }
    return obj;
  };
  const ops: Op[] = restoreUuids(raw);
  console.log(\`Loaded \${ops.length} ops for space "\${SPACE_NAME}" (\${SPACE_ID})\`);

  const client = await getSmartAccountWalletClient({ privateKey, rpcUrl: TESTNET_RPC_URL });
  const author = client.account.address;

  const personalSpaceData = await gql(\`{ spaces(filter: { address: { is: "\${author}" } }) { id type } }\`);
  const callerSpace = personalSpaceData.spaces?.find((s: any) => s.type === 'PERSONAL');
  if (!callerSpace) throw new Error(\`No personal space found for wallet \${author}.\`);
  const callerSpaceId: string = callerSpace.id;

  const spaceData = await gql(\`{
    space(id: "\${SPACE_ID}") { type address editorsList { memberSpaceId } }
  }\`);
  if (!spaceData.space) throw new Error(\`Space \${SPACE_ID} not found\`);

  const { type: spaceType, address: daoAddress } = spaceData.space;
  console.log(\`Space type: \${spaceType}\`);

  let to: \`0x\${string}\`;
  let calldata: \`0x\${string}\`;

  if (spaceType === 'PERSONAL') {
    if (SPACE_ID !== callerSpaceId) throw new Error('This is not your personal space.');
    const result = await personalSpace.publishEdit({
      name: 'Fix stale relations',
      spaceId: SPACE_ID,
      ops,
      author: SPACE_ID,
      network: 'TESTNET',
    });
    console.log('CID:', result.cid);
    console.log('Edit ID:', result.editId);
    to = result.to;
    calldata = result.calldata;
  } else {
    const editors: Array<{ memberSpaceId: string }> = spaceData.space.editorsList ?? [];
    const isEditor = editors.some((e: any) => e.memberSpaceId === callerSpaceId);
    console.log(\`Caller space: \${callerSpaceId}, is editor: \${isEditor}\`);

    const result = await daoSpace.proposeEdit({
      name: 'Fix stale relations',
      ops,
      author: callerSpaceId,
      network: 'TESTNET',
      callerSpaceId: \`0x\${callerSpaceId}\` as \`0x\${string}\`,
      daoSpaceId: \`0x\${SPACE_ID}\` as \`0x\${string}\`,
      daoSpaceAddress: daoAddress as \`0x\${string}\`,
    });
    console.log('Proposal ID:', result.proposalId);
    console.log('CID:', result.cid);
    console.log('Edit ID:', result.editId);
    to = result.to;
    calldata = result.calldata;

    const txHash = await client.sendTransaction({ to, data: calldata });
    console.log('Proposal TX:', txHash);

    if (isEditor) {
      const voteResult = daoSpace.voteProposal({
        authorSpaceId: callerSpaceId,
        spaceId: SPACE_ID,
        proposalId: result.proposalId,
        vote: 'YES',
      });
      const voteTx = await client.sendTransaction({ to: voteResult.to, data: voteResult.calldata });
      console.log('Vote TX:', voteTx);
    }

    console.log('\\nDone!');
    return;
  }

  const txHash = await client.sendTransaction({ to, data: calldata });
  console.log('TX:', txHash);
  console.log('\\nDone!');
}

main().catch(console.error);
`;
  fs.writeFileSync(path.join(dir, 'publish.ts'), script);
}

function writeReport(lines: string[]) {
  const outPath = 'output/07_fix_stale_relations.txt';
  fs.mkdirSync('output', { recursive: true });
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log(`\nReport written to ${outPath}`);
}

main().catch(console.error);
