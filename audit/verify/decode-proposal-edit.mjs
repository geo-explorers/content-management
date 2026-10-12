import { readFileSync } from 'node:fs';
import { decodeEditAuto, decodeEdit } from 'file:///X:/work/content-management/node_modules/@geoprotocol/grc-20/dist/index.js';
const buf = readFileSync(process.argv[2]);
let edit;
try { edit = await decodeEditAuto(new Uint8Array(buf)); } catch (e) { try { edit = decodeEdit(new Uint8Array(buf)); } catch (e2) { console.log('decode failed:', e.message, '|', e2.message); process.exit(1); } }
const summary = { keys: Object.keys(edit), id: edit.id, name: edit.name, authors: edit.authors, opsCount: edit.ops?.length };
console.log(JSON.stringify(summary));
const kinds = {};
for (const op of edit.ops ?? []) { const k = Object.keys(op).filter(x => op[x] != null && x !== 'type').join('+') || op.type; kinds[k] = (kinds[k] ?? 0) + 1; }
console.log('op kinds:', JSON.stringify(kinds));
console.log('first 2 ops:', JSON.stringify((edit.ops ?? []).slice(0, 2)).slice(0, 1500));
