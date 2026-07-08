import { readFileSync, writeFileSync } from 'fs';
import { decodeEdit } from '@geoprotocol/grc-20';

const hex = (o) => {
  if (!o || typeof o !== 'object') return o;
  const keys = Object.keys(o);
  if (keys.length && keys.every(k => /^\d+$/.test(k))) {
    return Array.from({length: keys.length}, (_,i) => o[i].toString(16).padStart(2,'0')).join('');
  }
  return o;
};
const clean = (v) => {
  if (v instanceof Uint8Array) return Buffer.from(v).toString('hex');
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object') {
    const h = hex(v); if (typeof h === 'string') return h;
    const out = {};
    for (const [k,val] of Object.entries(v)) out[k] = clean(val);
    return out;
  }
  if (typeof v === 'bigint') return v.toString();
  return v;
};

const buf = readFileSync('/private/tmp/claude-501/-Users-moh-work-projects-geo/a5d684fe-c00c-4041-a7bb-2fe6098db838/scratchpad/edit_try.bin');
const edit = clean(decodeEdit(new Uint8Array(buf)));
writeFileSync('/private/tmp/claude-501/-Users-moh-work-projects-geo/a5d684fe-c00c-4041-a7bb-2fe6098db838/scratchpad/edit-clean.json', JSON.stringify(edit, null, 2));

const counts = {};
for (const op of edit.ops) counts[op.type] = (counts[op.type]||0)+1;
console.log('op counts:', JSON.stringify(counts));
// distinct entities touched, relation types, properties
const rels = {}, props = {}, ents = new Set();
for (const op of edit.ops) {
  if (op.type === 'createRelation') { rels[op.relationType] = (rels[op.relationType]||0)+1; ents.add(op.from); }
  if (op.type === 'updateEntity' || op.type === 'createEntity') {
    ents.add(op.entity?.id || op.id);
    for (const v of (op.entity?.values || op.values || [])) props[v.property] = (props[v.property]||0)+1;
  }
  if (op.type === 'createProperty') console.log('CREATE PROPERTY:', JSON.stringify(op));
  if (op.type === 'updateProperty') console.log('UPDATE PROPERTY:', JSON.stringify(op));
}
console.log('relationTypes:', JSON.stringify(rels));
console.log('properties:', JSON.stringify(props));
console.log('entities touched:', ents.size);
