/**
 * Publish the empty Quotes table schema extracted from the supplied PDF.
 *
 * The PDF is read at runtime and fingerprinted so the dry-run and publish use
 * the same source artifact. The empty "Untitled" placeholder row is omitted.
 */

import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename } from 'node:path';
import { Graph, type Op } from '@geoprotocol/geo-sdk';
import { publishOps } from '../src/functions.js';

const DRY_RUN = false;

const SOURCE = process.argv[2]
  ?? '/Users/Vytautas/Downloads/Private & Shared 4/Test Databases (types) 15e273e214eb80a5b901e918a53dada6.pdf';
const TARGET_SPACE = 'ad4bd3902613b19081fd65db609588ee';
const TYPE_META = 'e7d737c536764c609fa16aa64a8c90ad';
const PROPERTY_META = '808a04ceb21c4d888ad12e240613e5ca';
const PROPERTIES_RELATION = '01412f8381894ab1836565c7fd358cc1';

const bytes = readFileSync(SOURCE);
if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
  throw new Error(`${SOURCE} is not a PDF file.`);
}

const sha256 = createHash('sha256').update(bytes).digest('hex');
const stableId = (kind: string, name: string) => createHash('sha256')
  .update(`${TARGET_SPACE}:${sha256}:${kind}:${name.toLocaleLowerCase('en-US')}`)
  .digest('hex')
  .slice(0, 32);

const table = {
  name: 'Quotes',
  description: 'A table for quotes and their related claims, URLs, article sources, and authors.',
  properties: [
    { name: 'Claims', description: 'Claims related to a quote.' },
    { name: 'URL', description: 'URLs related to a quote.' },
    { name: 'Article sources', description: 'Article sources related to a quote.' },
    { name: 'Authors', description: 'Authors related to a quote.' },
  ],
};

const allOps: Op[] = [];
const tableId = stableId('type', table.name);
const tableResult = Graph.createEntity({
  id: tableId,
  name: table.name,
  description: table.description,
  types: [TYPE_META],
});
allOps.push(...tableResult.ops);

const propertyIds: Record<string, string> = {};
const schemaRelations: Array<{ property: string; relationId: string; relationEntityId: string }> = [];

for (const property of table.properties) {
  const propertyId = stableId('property', property.name);
  propertyIds[property.name] = propertyId;

  const propertyResult = Graph.createEntity({
    id: propertyId,
    name: property.name,
    description: property.description,
    types: [PROPERTY_META],
  });
  allOps.push(...propertyResult.ops);

  const relationEntityId = `${tableId.slice(0, 16)}${propertyId.slice(0, 16)}`;
  const relationResult = Graph.createRelation({
    fromEntity: tableId,
    toEntity: propertyId,
    type: PROPERTIES_RELATION,
    entityId: relationEntityId,
  });
  allOps.push(...relationResult.ops);
  schemaRelations.push({
    property: property.name,
    relationId: relationResult.id,
    relationEntityId,
  });
}

console.log(JSON.stringify({
  dryRun: DRY_RUN,
  source: basename(SOURCE),
  sourceBytes: statSync(SOURCE).size,
  sourceSha256: sha256,
  targetSpace: TARGET_SPACE,
  table: { id: tableId, name: table.name },
  properties: propertyIds,
  schemaRelations,
  emptyPlaceholderRowsSkipped: 1,
  opCount: allOps.length,
  firstOp: allOps[0],
}, null, 2));

if (DRY_RUN) {
  console.log('DRY_RUN — no Geo write performed.');
} else {
  const tx = await publishOps(allOps, `Add empty table schema: ${table.name}`, TARGET_SPACE);
  if (!tx) throw new Error('Geo publish did not return a transaction hash.');
  console.log('tx', tx);
  console.log('verify', `https://www.geobrowser.io/space/${TARGET_SPACE}/${tableId}`);
}
