/** Six reviewed Crypto News → timeline Topics links. `go` authorizes this dry run only. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { Graph } from '@geoprotocol/geo-sdk';
import type { Op } from '@geoprotocol/geo-sdk';
import { publishOps } from '../src/functions.ts';

const DRY_RUN = true;
const SPACE = 'c9f267dcb0d270718c2a3c45a64afd32';
const NEWS = 'e550fe517e904b2c8fffdf13408f5634';
const TOPICS = '806d52bc27e94c9193c057978b093351';
const TAGS = '257090341ba5406f94e4d4af90042fba';
const FEATURED_TOPIC = 'b69b8b1659df4e6d99d79956a30e8932';
const APPROVED_DECISIONS_SHA256 = '40d236ab279238c4ac4acdd7b021f9266a9b4fbf9fc11cb5fa0402f1372562b9';

const rootFile = (path: string) => new URL(`../../../${path}`, import.meta.url);
const taskFile = (name: string) => rootFile(`tasks/2026-09-29-crypto-timelines/${name}`);
const decisionsFile = rootFile('spaces/crypto/ops/timelines/runs/2026-09-29-decisions.json');
const read = (url: URL) => JSON.parse(readFileSync(url, 'utf8'));
function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(`SAFETY STOP: ${message}`);
}

const decisionBytes = readFileSync(decisionsFile);
const decisionHash = createHash('sha256').update(decisionBytes).digest('hex');
assert(decisionHash === APPROVED_DECISIONS_SHA256, 'decision file changed since editorial review');
const decisions = JSON.parse(decisionBytes.toString('utf8'));
const state = read(taskFile('story-state.json'));
const cleanup = read(rootFile('tasks/2026-09-29-crypto-news-cleanup/candidates.json'));
assert(SPACE === cleanup.spaceId, 'Crypto space disagrees with cleanup review');
assert(Date.now() - Date.parse(state.checkedAt) < 30 * 60_000, 'live snapshot older than 30 minutes; rerun inspect.mjs');
assert(decisions.links.length === 6 && decisions.feature.length === 0 && decisions.unfeature.length === 0,
  'reviewed batch must contain exactly six additions and no feature or deletion ops');

const excluded = new Set(cleanup.rows.map((row: any) => row.id));
const stories = new Map<string, any>(state.stories.map((story: any) => [story.id, story]));
const timelines = new Map<string, any>(state.timelines.map((timeline: any) => [timeline.id, timeline]));
assert(timelines.size === 2, 'featured timeline inventory changed');
const seenPairs = new Set<string>();
const ops: Op[] = [];
const links: Array<{ story: string; timeline: string; relationId: string }> = [];
for (const link of decisions.links) {
  const pair = `${link.story_id}:${link.timeline_id}`;
  const story = stories.get(link.story_id);
  const timeline = timelines.get(link.timeline_id);
  assert(story && timeline && !seenPairs.has(pair), `missing or repeated pair ${pair}`);
  seenPairs.add(pair);
  assert(!excluded.has(story.id), `story selected for News cleanup: ${story.id}`);
  assert(story.name === link.story_name && timeline.name === link.timeline_name, `name changed for ${pair}`);
  assert(story.spaceIds.includes(SPACE) && story.types.some((type: any) => type.id === NEWS),
    `story no longer typed Crypto News: ${story.id}`);
  assert(timeline.relations.nodes.some((edge: any) =>
    edge.typeId === TAGS && edge.toEntity.id === FEATURED_TOPIC && edge.spaceId === SPACE),
    `timeline no longer featured: ${timeline.id}`);
  assert(!story.relations.pageInfo.hasNextPage && !timeline.backlinks.pageInfo.hasNextPage,
    `incomplete relation inventory for ${pair}`);
  assert(!story.relations.nodes.some((edge: any) =>
    edge.typeId === TOPICS && edge.toEntity.id === timeline.id && edge.spaceId === SPACE),
    `story already linked to timeline: ${pair}`);
  assert(!timeline.backlinks.nodes.some((edge: any) =>
    edge.typeId === TOPICS && edge.fromEntity.id === story.id && edge.spaceId === SPACE),
    `timeline already has story backlink: ${pair}`);
  assert(story.publishDate.nodes[0]?.datetime, `story missing Publish datetime: ${story.id}`);
  const relationId = `${story.id.slice(0, 16)}${timeline.id.slice(0, 16)}`;
  const generated = Graph.createRelation({
    id: relationId, fromEntity: story.id, toEntity: timeline.id, type: TOPICS,
  }).ops;
  assert(generated.length === 1 && generated[0].type === 'createRelation',
    `unexpected generated ops for ${pair}`);
  ops.push(...generated);
  links.push({ story: story.name, timeline: timeline.name, relationId });
  console.log(`[ADD TOPICS] ${story.name} → ${timeline.name} (${relationId})`);
}
assert(ops.length === 6 && ops.every(op => op.type === 'createRelation'), 'non-additive or incorrect op batch');

const report = {
  generatedAt: new Date().toISOString(),
  liveSnapshotAt: state.checkedAt,
  decisionsSha256: decisionHash,
  dryRun: DRY_RUN,
  targetSpace: SPACE,
  createEntity: 0,
  createRelation: ops.length,
  updateEntity: 0,
  deleteRelation: 0,
  featureChanges: 0,
  links,
};
writeFileSync(taskFile('dryrun-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`\nSUMMARY ${JSON.stringify({ ...report, links: undefined })}`);
if (DRY_RUN) {
  console.log('DRY RUN ONLY — no Geo proposal or vote submitted. A separate publish reply is required.');
} else {
  const proposalId = await publishOps(ops, 'Link six reviewed Crypto News stories to featured timelines (29 Sep 2026)', SPACE);
  assert(proposalId, 'proposal was not submitted');
  console.log(`PROPOSAL ID ${proposalId}`);
}
