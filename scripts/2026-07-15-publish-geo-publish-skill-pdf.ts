/**
 * Publish the supplied "geo-publish skill" PDF to Vytautas's personal Geo space.
 *
 * Discovery (2026-07-15):
 * - PDF type: 14a39e59d9874596956ac2dd4165c210
 * - IPFS URL: 8a743832c0944a62b6650c3cc2f9c7bc (Text -> SDK `text`)
 * - Target: ad4bd3902613b19081fd65db609588ee (PERSONAL)
 * - Duplicate gate: PASS; two substring matches were unrelated test entities.
 * - Schema gate: PASS. Relation-target gate: PASS.
 *
 * The PDF is read from disk at runtime. A dry-run never uploads the file or
 * publishes ops. The publish phase uploads the PDF to IPFS once, then publishes
 * the resulting PDF entity in one edit.
 */

import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import { Blob } from 'node:buffer';
import { Graph, Ipfs, type Op } from '@geoprotocol/geo-sdk';
import { publishOps } from '../src/functions.js';

const DRY_RUN = true;

const SOURCE = process.argv[2]
  ?? '/Users/Vytautas/Downloads/7ec48dcb-62f1-45a2-8a4d-b8ae764c149c_geo-publish_skill.pdf';
const TARGET_SPACE = 'ad4bd3902613b19081fd65db609588ee';
const PDF_TYPE = '14a39e59d9874596956ac2dd4165c210';
const IPFS_URL = '8a743832c0944a62b6650c3cc2f9c7bc';
const ENTITY_NAME = 'geo-publish skill';

const bytes = readFileSync(SOURCE);
if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
  throw new Error(`${SOURCE} is not a PDF file.`);
}

const file = statSync(SOURCE);
const sha256 = createHash('sha256').update(bytes).digest('hex');

async function buildOps(): Promise<{ entityId: string; ops: Op[]; cid: string }> {
  const cid = DRY_RUN
    ? 'ipfs://dry-run-not-uploaded'
    : (await Ipfs.uploadImage({
        blob: new Blob([bytes], { type: 'application/pdf' }),
      }, 'TESTNET')).cid;

  const { id, ops } = Graph.createEntity({
    name: ENTITY_NAME,
    types: [PDF_TYPE],
    values: [{ property: IPFS_URL, type: 'text', value: cid }],
  });

  return { entityId: id, ops, cid };
}

const { entityId, ops, cid } = await buildOps();

console.log(JSON.stringify({
  dryRun: DRY_RUN,
  source: basename(SOURCE),
  bytes: file.size,
  sha256,
  targetSpace: TARGET_SPACE,
  entityId,
  cid,
  opCount: ops.length,
  firstOp: ops[0],
}, null, 2));

if (DRY_RUN) {
  console.log('DRY_RUN — no IPFS upload and no Geo write performed.');
} else {
  const tx = await publishOps(ops, `Add PDF: ${ENTITY_NAME}`, TARGET_SPACE);
  if (!tx) throw new Error('Geo publish did not return a transaction hash.');
  console.log('tx', tx);
  console.log('verify', `https://www.geobrowser.io/space/${TARGET_SPACE}/${entityId}`);
}
