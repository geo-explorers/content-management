#!/usr/bin/env node
// Active curators over a window. Profiles = personal spaces (createdById) that authored
// edits in the window. Writes two CSVs at repo root:
//   active-curators-last-30d.csv        — all active profiles (raw)
//   active-curators-last-30d-clean.csv  — real profiles only (drops blank / *test* / +<n> staging)
// Usage: node scripts/active-curators-30d.mjs [START_ISO]   (default 2026-06-14)
import { writeFileSync } from 'node:fs';

const API = 'https://api-testnet.geobrowser.io/graphql';
const START = (process.argv[2] ?? '2026-06-14') + 'T00:00:00Z';

async function gql(query) {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 300));
  return j.data;
}

// 1. paginate all edit versions in the window
const edits = [];
let after = null;
for (;;) {
  const data = await gql(`{
    editVersionsConnection(first:1000, orderBy:CREATED_AT_DESC,
      filter:{ createdAt:{ greaterThanOrEqualTo:"${START}" } }
      ${after ? `, after:"${after}"` : ''}) {
      pageInfo{ hasNextPage endCursor }
      edges{ node{ name createdAt createdById } }
    } }`);
  const c = data.editVersionsConnection;
  for (const e of c.edges) edits.push(e.node);
  process.stderr.write(`\rfetched ${edits.length} edits`);
  if (!c.pageInfo.hasNextPage) break;
  after = c.pageInfo.endCursor;
}
process.stderr.write('\n');

// 2. group by author (createdById = personal space id)
const groups = new Map();
for (const e of edits) {
  if (!groups.has(e.createdById)) groups.set(e.createdById, []);
  groups.get(e.createdById).push(e);
}

// 3. resolve each space id -> name + type (batched)
const ids = [...groups.keys()];
const meta = new Map();
for (let i = 0; i < ids.length; i += 50) {
  const chunk = ids.slice(i, i + 50);
  const q = '{' + chunk.map((id, k) => `s${k}: space(id:"${id}"){ type page{ name } }`).join(' ') + '}';
  const data = await gql(q);
  chunk.forEach((id, k) => { const s = data[`s${k}`]; meta.set(id, { name: s?.page?.name ?? '', type: s?.type ?? '' }); });
}

// 4. build rows
const day = (s) => s.slice(0, 10);
const bucket = (name) => (name.trim().split(/\s+/)[0] || '').replace(/:$/, '');
const rows = [];
for (const [id, list] of groups) {
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const hist = {};
  for (const e of list) { const b = bucket(e.name); if (b) hist[b] = (hist[b] || 0) + 1; }
  const sorted = Object.entries(hist).sort((a, b) => b[1] - a[1]);
  const { name, type } = meta.get(id);
  rows.push({
    profile_name: name, space_type: type, space_id: id, edit_count: list.length,
    first_edit_date: day(list[list.length - 1].createdAt), last_edit_date: day(list[0].createdAt),
    distinct_edit_types: sorted.length,
    edit_types: sorted.map(([k, v]) => `${k}(${v})`).join('; '),
    e1: list[0], e2: list[1], e3: list[2],
  });
}
rows.sort((a, b) => b.edit_count - a.edit_count);

// 5. write CSVs
const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const en = (e) => e ? e.name : '';
const ed = (e) => e ? day(e.createdAt) : '';

const rawHeader = 'profile_name,space_type,space_id,edit_count,edit_1,edit_1_date,edit_2,edit_2_date,edit_3,edit_3_date';
const rawLines = rows.map((r) => [q(r.profile_name), q(r.space_type), q(r.space_id), r.edit_count,
  q(en(r.e1)), q(ed(r.e1)), q(en(r.e2)), q(ed(r.e2)), q(en(r.e3)), q(ed(r.e3))].join(','));
writeFileSync('active-curators-last-30d.csv', [rawHeader, ...rawLines].join('\n') + '\n');

const isTest = (n) => !n.trim() || /test/i.test(n) || /\+\d+/.test(n);
const clean = rows.filter((r) => !isTest(r.profile_name));
const cleanHeader = 'profile_name,space_type,space_id,edit_count,first_edit_date,last_edit_date,distinct_edit_types,edit_types,edit_1,edit_2,edit_3';
const cleanLines = clean.map((r) => [q(r.profile_name), q(r.space_type), q(r.space_id), r.edit_count,
  q(r.first_edit_date), q(r.last_edit_date), r.distinct_edit_types, q(r.edit_types),
  q(en(r.e1)), q(en(r.e2)), q(en(r.e3))].join(','));
writeFileSync('active-curators-last-30d-clean.csv', [cleanHeader, ...cleanLines].join('\n') + '\n');

console.log(`window ${START.slice(0, 10)} → now | ${edits.length} edits | raw ${rows.length} profiles | clean ${clean.length} (dropped ${rows.length - clean.length})`);
