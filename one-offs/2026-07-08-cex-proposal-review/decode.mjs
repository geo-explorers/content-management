import { readFileSync, writeFileSync } from 'fs';
import { decodeEdit } from '@geoprotocol/grc-20';

const buf = readFileSync('/private/tmp/claude-501/-Users-moh-work-projects-geo/a5d684fe-c00c-4041-a7bb-2fe6098db838/scratchpad/edit_try.bin');
const edit = decodeEdit(new Uint8Array(buf));
writeFileSync('/private/tmp/claude-501/-Users-moh-work-projects-geo/a5d684fe-c00c-4041-a7bb-2fe6098db838/scratchpad/edit.json',
  JSON.stringify(edit, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
console.log('name:', edit.name);
console.log('ops:', edit.ops?.length);
const counts = {};
for (const op of edit.ops || []) { const t = Object.keys(op).find(k=>op[k]!==undefined && k!=='case'); counts[op.case || t] = (counts[op.case || t]||0)+1; }
console.log(JSON.stringify(counts));
