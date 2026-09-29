/** Geo Crypto news cleanup. A `go` permits only this dry run; `publish` is a separate gate. */
import { readFileSync, writeFileSync } from 'node:fs';
import type { Op } from '@geoprotocol/geo-sdk';
import { deleteEntity } from '../src/entity_ops.ts';
import { getAnchoredEntityIds, publishOps } from '../src/functions.ts';

const DRY_RUN = true;
const taskFile = (name: string) => new URL(`../../../tasks/2026-09-29-crypto-news-cleanup/${name}`, import.meta.url);
const read = (name: string) => JSON.parse(readFileSync(taskFile(name), 'utf8'));
const config = read('candidates.json');
const preflight = read('cascade-preflight.json');
const live = read('live-state.json');
const newsType = 'e550fe517e904b2c8fffdf13408f5634';
const allowedOrphanTypes = new Set([
  '96f859efa1ca4b229372c86ad58b694b', // Claim
  'b8803a8665de412bbb357e0c84adf473', // Data block
  'a2a5ed0cacef46b1835de457956ce915', // Article
  'ba4e41460010499da0a3caaa7f579d0e', // Image
]);
const forbiddenProperties = new Set([
  '85a4668a42fa4f488969c0a9de0c294b', // Score
  '49ee1b8918204e75a1ae38a2dcaad4a5', // vote ordinal
  '103701ddcabe4a8e835b10345327b647', // weighted vote
]);
const forbiddenRelationType = '19a4cfff45f24150abf2af0f43eb2eec';
const selected = new Set<string>(preflight.selectedIds);
const selectedRelations = new Set<string>(preflight.selectedRelationIds);
const direct = new Set<string>(config.rows.map((r: any) => r.id));
const retained = new Set<string>(config.rows.map((r: any) => r.earlierId).filter(Boolean));
const borderline = new Set(['1589eba5d4b844079cdb56cc07751687', '248b63af96e4422895b8638a1ae83328']);
const protectedIds = new Set([...retained, ...borderline]);

function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(`SAFETY STOP: ${message}`);
}
function hex(bytes: any): string {
  assert(bytes && typeof bytes === 'object' && Array.from({ length: 16 }, (_, i) => bytes[i]).every(v => Number.isInteger(v) && v >= 0 && v <= 255), 'malformed op UUID');
  return Buffer.from(Array.from({ length: 16 }, (_, i) => bytes[i])).toString('hex');
}
function sameSet<T>(actual: Set<T>, expected: Set<T>): boolean {
  return actual.size === expected.size && [...actual].every(x => expected.has(x));
}

assert(config.rows.length === 12 && direct.size === 12 && retained.size === 6, 'candidate inventory changed');
assert(preflight.selectedEntities === 259 && selected.size === 259, 'deletion closure changed; review a new plan');
assert(selectedRelations.size === preflight.outgoingRelations, 'relation inventory is incomplete');
assert([...direct].every(id => selected.has(id)), 'direct story missing from deletion closure');
assert([...protectedIds].every(id => !selected.has(id)), 'retained or borderline story selected');
assert(Date.now() - Date.parse(preflight.checkedAt) < 30 * 60_000, 'preflight older than 30 minutes');
assert(Date.now() - Date.parse(live.checkedAt) < 30 * 60_000, 'candidate check older than 30 minutes');
assert(live.entitiesConnection.totalCount === 18, 'candidate/canonical live inventory incomplete');
const liveById = new Map<string, any>(live.entitiesConnection.nodes.map((e: any) => [e.id, e]));
for (const id of direct) {
  const e = liveById.get(id);
  assert(e?.typeIds.includes(newsType), `candidate ${id} is no longer News`);
  assert(e.spaceIds.length === 1 && e.spaceIds[0] === config.spaceId, `candidate ${id} has another residency`);
  assert(e.incoming.totalCount === 0, `candidate ${id} gained a backlink`);
}
for (const id of retained) assert(liveById.get(id)?.typeIds.includes(newsType), `retained story ${id} missing`);
for (const e of preflight.details) {
  assert(e.spaceIds.length === 1 && e.spaceIds[0] === config.spaceId, `dependent ${e.id} has another residency`);
  assert(e.types.some((t: any) => direct.has(e.id) ? t.id === newsType : allowedOrphanTypes.has(t.id)), `unexpected type on ${e.id}`);
  assert(e.incoming.every((r: any) => selected.has(r.from) || r.typeId === forbiddenRelationType), `external backlink on ${e.id}`);
}

const anchors = await getAnchoredEntityIds(config.spaceId);
const anchoredExcluded = [...anchors].filter(id => selected.has(id));
assert(anchoredExcluded.length === 0, `anchored entity selected: ${anchoredExcluded.join(', ')}`);
assert(live.space.page?.id && anchors.has(live.space.page.id), 'space home anchor unresolved');
const deletingIds = new Set(direct);
const generated: Op[] = [];
for (const row of config.rows) {
  console.log(`[DELETE] ${liveById.get(row.id)?.name} (${row.id}, 0 backlinks; ${row.reason})`);
  generated.push(...await deleteEntity({
    entityId: row.id,
    spaceId: config.spaceId,
    dryRun: true,
    deletingIds,
    excludeFromOrphanCheck: [...protectedIds, ...anchors],
    orphanTypeFilter: allowedOrphanTypes,
  }));
}

// Incoming and outgoing traversals can generate the same edge deletion twice.
const byKey = new Map<string, Op>();
for (const op of generated as any[]) {
  assert(op.type === 'deleteRelation' || op.type === 'updateEntity', `unexpected op type ${op.type}`);
  const id = hex(op.id);
  const key = `${op.type}:${id}`;
  if (op.type === 'updateEntity') {
    assert(selected.has(id) && !anchors.has(id) && !protectedIds.has(id), `unexpected updated entity ${id}`);
    assert(!op.set?.length && op.unset?.length, `unexpected update payload on ${id}`);
    for (const u of op.unset) assert(!forbiddenProperties.has(hex(u.property)), `vote property unset on ${id}`);
  } else {
    assert(selectedRelations.has(id), `unexpected deleted relation ${id}`);
  }
  if (byKey.has(key)) assert(JSON.stringify(byKey.get(key)) === JSON.stringify(op), `conflicting duplicate operation ${key}`);
  else byKey.set(key, op);
}
const ops = [...byKey.values()];
const updated = new Set([...byKey.keys()].filter(k => k.startsWith('updateEntity:')).map(k => k.slice(13)));
const removedRelations = new Set([...byKey.keys()].filter(k => k.startsWith('deleteRelation:')).map(k => k.slice(15)));
assert(sameSet(updated, selected), `entity op mismatch: generated ${updated.size}, expected ${selected.size}`);
assert(sameSet(removedRelations, selectedRelations), `relation op mismatch: generated ${removedRelations.size}, expected ${selectedRelations.size}`);
assert([...deletingIds].every(id => selected.has(id)), 'orphan helper discovered an unapproved entity');
assert(sameSet(deletingIds, selected), `orphan selection mismatch: helper ${deletingIds.size}, preflight ${selected.size}`);
for (const id of [...selected].filter(id => !direct.has(id))) {
  const e = preflight.details.find((x: any) => x.id === id);
  console.log(`[DELETE] ${e?.name ?? '(unnamed)'} (${id}, story-owned orphan)`);
}
for (const id of protectedIds) console.log(`[SKIP] ${liveById.get(id)?.name ?? '(protected story)'} (${id}, retained)`);
for (const id of anchors) console.log(`[SKIP] ${id} (space identity anchor)`);
const report = {
  generatedAt: new Date().toISOString(),
  preflightAt: preflight.checkedAt,
  dryRun: DRY_RUN,
  directStories: direct.size,
  selectedEntities: selected.size,
  byType: preflight.selectedByType,
  updatedEntities: updated.size,
  deletedRelations: removedRelations.size,
  duplicateRelationOpsRemoved: generated.length - ops.length,
  totalOps: ops.length,
  retainedStories: retained.size,
  borderlineStories: borderline.size,
  anchoredEntitiesExcluded: anchoredExcluded.length,
  spaceAnchorsProtected: anchors.size,
  scoreBearingIdsPreserved: preflight.scoreBearingIds,
  selectedIds: [...selected],
  selectedRelationIds: [...selectedRelations],
};
writeFileSync(taskFile('dryrun-report.json'), JSON.stringify(report, null, 2));
console.log(`\nCLEANUP SUMMARY ${JSON.stringify({ ...report, selectedIds: undefined, selectedRelationIds: undefined })}`);
if (DRY_RUN) {
  console.log('DRY RUN ONLY — no Geo proposal submitted. A separate publish reply is required.');
} else {
  assert(process.env.CONFIRM_DESTRUCTIVE === '1', 'CONFIRM_DESTRUCTIVE is required for confirmed publish');
  const proposalId = await publishOps(ops, 'Remove duplicate and irrelevant Crypto News stories (29 Sep 2026)', config.spaceId);
  console.log(`PROPOSAL ID ${proposalId}`);
}
