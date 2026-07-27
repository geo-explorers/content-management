/**
 * Publish the structured content extracted from "Copy of cards.pdf".
 *
 * Discovery (2026-07-15):
 * - Person: 7ed45f2bc48b419e8e4664d5ff680b0d
 * - Website: eed38e74e67946bf8a42ea3e4f8fb5fb (Text -> SDK `text`)
 * - Target: ad4bd3902613b19081fd65db609588ee (PERSONAL)
 * - Duplicate gate: PASS; no name matches for Vytautas Mikalainis.
 * - Schema gate: PASS. Relation-target gate: PASS.
 */

import { createHash } from 'node:crypto';
import { Graph, type Op } from '@geoprotocol/geo-sdk';
import { publishOps } from '../src/functions.js';

const DRY_RUN = false;

const TARGET_SPACE = 'ad4bd3902613b19081fd65db609588ee';
const PERSON_TYPE = '7ed45f2bc48b419e8e4664d5ff680b0d';
const WEBSITE = 'eed38e74e67946bf8a42ea3e4f8fb5fb';
const NAME = 'Vytautas Mikalainis';
const DESCRIPTION = 'Co-founder and CEO at Unbound Autonomy. Contact: vytautas@unboundautonomy.com. Social handle: vytautas.78.';
const WEB_URL = 'https://unboundautonomy.com';

// Stable across dry-run and publish; prevents reruns from creating duplicates.
const ENTITY_ID = createHash('sha256')
  .update(`${TARGET_SPACE}:person:${NAME.toLocaleLowerCase('en-US')}`)
  .digest('hex')
  .slice(0, 32);

const allOps: Op[] = [];
const { id: entityId, ops } = Graph.createEntity({
  id: ENTITY_ID,
  name: NAME,
  description: DESCRIPTION,
  types: [PERSON_TYPE],
  values: [{ property: WEBSITE, type: 'text', value: WEB_URL }],
});
allOps.push(...ops);

console.log(JSON.stringify({
  dryRun: DRY_RUN,
  targetSpace: TARGET_SPACE,
  entityId,
  entity: {
    name: NAME,
    description: DESCRIPTION,
    type: { id: PERSON_TYPE, name: 'Person' },
    website: WEB_URL,
  },
  opCount: allOps.length,
  firstOp: allOps[0],
}, null, 2));

if (DRY_RUN) {
  console.log('DRY_RUN — no Geo write performed.');
} else {
  const tx = await publishOps(allOps, `Add Person: ${NAME}`, TARGET_SPACE);
  if (!tx) throw new Error('Geo publish did not return a transaction hash.');
  console.log('tx', tx);
  console.log('verify', `https://www.geobrowser.io/space/${TARGET_SPACE}/${entityId}`);
}
