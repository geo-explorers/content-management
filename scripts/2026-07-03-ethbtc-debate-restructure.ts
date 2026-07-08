/**
 * OPERATION: Restructure the ETH-vs-BTC debate to the canonical model — Crypto only
 * Question: d79139fa… "Is Ethereum's position against Bitcoin structurally weakening, or fundamentally sound?"
 * MODE: Two-phase. DRY_RUN=true batches + prints, publishes NOTHING. Flip to false for ONE crypto proposal.
 *
 * Target model (confirmed): claims ARE the answers. Question.Answers -> all 8 claims.
 * The two pro/against collections (🔴 Weakening / 🟢 Fundamentally sound) already hold the claims.
 * The two bare label-answers ("Weakening" / "Fundamentally sound") are retired.
 *
 * CHANGES:
 *  1) Tag "Is factual?" (da4a6c1f…, boolean) on all 8 claims.  [6 factual, 2 opinion]
 *  2) Answers (73609ae8…): retire the 2 label-answers, add Question->claim for all 8 claims.
 *  3) Delete the 2 orphaned label-answers (their only backlink is the Answers edge, removed in step 2).
 *
 * NOT in this run: reframing the Question description off the price ratio (Mohammed to word).
 */
import { Graph } from '@geoprotocol/geo-sdk';
import { deleteEntity } from '../src/entity_ops.js';
import { publishOps } from '../src/functions.js';

const DRY_RUN = false; // flip to false to submit the crypto proposal

const CRYPTO = 'c9f267dcb0d270718c2a3c45a64afd32';
const QUESTION = 'd79139fafc1343828e90a5daf4ac7a13';
const FACTUAL = 'da4a6c1f9d4446f9832ff3b49a4400ef'; // "Is factual?" (boolean)
const ANSWERS = '73609ae8644c4463a50a90a3ee585746'; // Answers relation type

// claim id -> is-factual boolean (true = verifiable fact, false = opinion/value-judgment)
const CLAIMS: Array<[string, boolean, string]> = [
  // Weakening side
  ['ec0930fd85374dd4b78c2b64b0255ba9', true,  'Solana overtook ETH on core usage (metrics)'],
  ['062deb4e43eb4655a74a86d02023472b', false, 'Standard Chartered structural-decline framing (analyst view)'],
  ['79a928ad5d714647a74a709cd33c2a1c', false, 'BTC is the reserve asset / ETH lacks a defined value prop (judgment)'],
  ['47147956f67e4f96bebb3730bbd8f067', true,  'L2s remove ~$50B in fees (estimate)'],
  // Sound side
  ['aa00b6a1ea4e475bb335c8d175e8896b', true,  'Largest developer ecosystem'],
  ['8559cb33270145bcbd7a8407fec852e1', true,  '~56% of on-chain RWA value'],
  ['8e01c6f808404b31ab2cfd30301ccf6f', true,  '~30% staked across ~900k validators'],
  ['ca7786612eed4c9881dca6690810f17a', true,  '>$160B in stablecoins'],
];

const LABEL_ANSWERS = [
  'a3db3df99a4b4c89bd2210cd7dc73eba', // "Weakening"
  'ebcf1b80069f49dfa9999ea75e39407a', // "Fundamentally sound"
];

const ops: any[] = [];

// 1) is-factual tags
for (const [id, factual] of CLAIMS) {
  ops.push(...Graph.updateEntity({ id, values: [{ property: FACTUAL, type: 'boolean', value: factual }] }).ops);
}
console.log(`[1] is-factual: ${CLAIMS.length} updateEntity ops (${CLAIMS.filter(c => c[1]).length} factual, ${CLAIMS.filter(c => !c[1]).length} opinion)`);

// 2) Answers -> the 8 claims (additive). Old label edges are removed by the deletes in step 3.
for (const [id] of CLAIMS) {
  ops.push(...Graph.createRelation({ fromEntity: QUESTION, toEntity: id, type: ANSWERS }).ops);
}
console.log(`[2] Answers: ${CLAIMS.length} createRelation ops (Question -> each claim)`);

// 3) retire the 2 label-answers (removes their values, Types edge, and incoming Answers edge)
for (const labelId of LABEL_ANSWERS) {
  const delOps = await deleteEntity({ entityId: labelId, spaceId: CRYPTO, dryRun: true, skipOrphanCleanup: true });
  ops.push(...delOps);
}
console.log(`[3] retire 2 label-answers`);

const byType: Record<string, number> = {};
for (const op of ops) { const k = (op as any)?.type ?? Object.keys(op)[0] ?? 'unknown'; byType[k] = (byType[k] ?? 0) + 1; }
console.log(`\n=== COMBINED (Crypto): ${ops.length} ops ===`, byType);

if (DRY_RUN) {
  console.log('\nDRY RUN — nothing published. Review the is-factual split above, then flip DRY_RUN=false.');
} else {
  const proposalId = await publishOps(ops, 'ETH-BTC debate: is-factual + answers=claims + retire labels', CRYPTO);
  console.log('\nPUBLISHED crypto proposal. proposalId:', proposalId);
}
