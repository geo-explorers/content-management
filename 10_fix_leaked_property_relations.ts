/**
 * Fix leaked property relations from the 04_merge_duplicates_properties run.
 *
 * The cross-space backlink bug in mergeEntities caused backlink migration ops
 * to be published to Root space when they belonged to other spaces. This created
 * 60 erroneous "Properties → Topics" relations in Root from entities that don't
 * live in Root.
 *
 * Full audit results (merge_properties_ops_copy.txt):
 *   - 96 duplicate createRelation ops, 96 duplicate deleteRelation ops, 6 duplicate updateEntity ops
 *   - All duplicates involve Root getting copies of ops from other spaces
 *   - 60 of the 96 leaked creates actually materialized in Root (all Properties → Topics)
 *   - 0 leaked creates materialized in non-Root spaces (all correct copies)
 *   - The 3 DOI relations in AI are legitimate (changeEntityId, entity lives in AI)
 *   - The 6 duplicate updates were no-ops (entities don't have values in the wrong spaces)
 *   - The Podcasts<->Podcasts duplicate doesn't exist in either space
 *
 * Run with: bun run 10_fix_leaked_property_relations.ts
 */

import { Graph, type Op } from '@geoprotocol/geo-sdk';
import { publishOps } from './src/functions.js';

const DRY_RUN = false; // Set to false to actually publish

const ROOT_SPACE_ID = 'a19c345ab9866679b001d7d2138d88a1';

// ─── 60 leaked "Properties → Topics" relations in Root ──────────────────────
// These are backlink migration ops from the "Topics" property merge that were
// erroneously published to Root. The from-entities live in other spaces.

const LEAKED_ROOT_RELATION_IDS = [
  '6da1380836d3420f9413a2ca7ecb0be0',
  '7dbbf99a8fd040e98f62a9bc9c6b0e07',
  'ce171ff3fd3a44b18e3fff4e150b7e1e',
  '23a44900fe414f85a54d4afe30516f87',
  '290c939ce9414a0da73dee96a52e068f',
  '41dc73e99d084bb985e7b0953360b99f',
  'd0d22877146c4b9a939f2a5c5f330c75',
  'ea120024dfb041159942b1bee83ee46f',
  '18200137683d495d8c82efea765cb51c',
  '4ed2110761f14363b64840df73e7fb1b',
  '827ebd24ce054efdb62a1045096af033',
  'a6987c44c6914ea6bf21a181dededf34',
  'a70a1485b7f3494388f47109595106d1',
  '2a8a32c174cb4907b6f905b408548029',
  '5d21ae605f2843c0ab98f379f47f7e07',
  '9279c0eb7ded445690be22e836f10b14',
  'aac6d48b9c1b465a99a405b19445cc00',
  'fe576d627f94495fbabb8d5b0bebbe64',
  '47ff90bb5316430d9ae035904f301f39',
  '4d67878008804e3683f108b338d2cf77',
  '723a57498ecf4df3bacc858604ae9ad8',
  '9a1414c94eb44f6aba507e961e6e95a7',
  'a9f3452ac29c46e7b473e041646a23f1',
  '3a89e4cc379042dd96d686283973ebb0',
  '41ffc0883ba6490a8397c9261e211244',
  '70d7159088a64432a29277aba020564b',
  'a31ba86e9b5e4d67ae5cc4dfa0bf4bda',
  'd69867ee38de4deba33bdb427c26929f',
  '038e8a4886b44854b324e2deff357164',
  '2e0501f74cec42059656c8b83354186e',
  '49be5252fb2d4cbf9a695bd55b68d685',
  '49cab0cc6e024b9ea7965a58671a1b13',
  '59ba592bcf824af5b3c4b78b654b7b75',
  '306afcd23e404e36b4840b7cada41f17',
  '69ce11dc147b417994ca423042a4b601',
  'af3359384c7844ae85ad7d3299b263d6',
  'ba26b4852dee465796660151d455c302',
  'd4449c645edf4915af8f2d50dbc741b9',
  '022e651898584120909d54e9698cba67',
  '537d850df1064c23bb33e741faced993',
  '74294c21b8c14aaeac37cc6d4302a15a',
  'aafdaf838d924f468d2fa9186bf5bd0d',
  'da867a62936c4b26b84dfeb2dda93f20',
  '39471169c0b54d589fde94a57e059a2d',
  '9ece78a2df8a4bdba16378694d1c3ee0',
  'db0b026d2fb74b7aa8323d7fd18bd200',
  'dcff1097d1b041b88c9825038b9de856',
  'f90bf68d7d5844e7869450599054a519',
  '0dcb96fc5de94ee2851de9e7490d7c30',
  '17da4551bdcd4de99ec22316c8995054',
  '526e71a35cfa4bd0a31609a0d64da7b7',
  '74f848c9beb140ee90cab70f0390966b',
  'cfe4cbe8756d47e3864925923668b5c3',
  '17f4c282eb7c4008a76c31ad2fd357cb', // Polity → Topics
  '38b1fbc875694e37b4ad72e3d621e660',
  '4092fa248234494a930a24b25255cbce', // Artifact → Topics
  '541bc412a4be4480a0fe4f91e95fe16d',
  'cf040c1eb9a344b08bd259eb9be2f487',
  '8c933b49447c4972a29dae2f65e00818',
  'e7f113df8a554f5eb11c7ba2fda926a2', // Era → Topics
];

// Note: The 3 DOI relations in AI (1e44a5d1, cefa30fa, e03629da) were initially
// flagged as leaked but are LEGITIMATE — the DOI entity lives in both Root and AI
// (created by changeEntityId during cross-space merge). No cleanup needed.

async function main() {
  console.log(`*** ${DRY_RUN ? 'DRY RUN' : 'LIVE RUN'} ***\n`);

  // ─── Root space cleanup ──────────────────────────────────────────────────
  const rootOps: Op[] = [];
  console.log(`Deleting ${LEAKED_ROOT_RELATION_IDS.length} leaked relations from Root space...`);
  for (const id of LEAKED_ROOT_RELATION_IDS) {
    const result = Graph.deleteRelation({ id });
    rootOps.push(...result.ops);
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log(`\nTotal: ${rootOps.length} ops`);

  if (DRY_RUN) {
    console.log('\nDRY RUN — no changes published.');
    console.log('Set DRY_RUN = false to publish.');
  } else {
    console.log('\nPublishing Root space cleanup...');
    await publishOps(rootOps, 'Delete leaked property merge relations', ROOT_SPACE_ID);
    console.log('Done.');
  }
}

main().catch(console.error);
