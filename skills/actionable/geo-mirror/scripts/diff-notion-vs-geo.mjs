#!/usr/bin/env node
// geo-mirror Part 2 — DIFF (Notion → Geo). READ-ONLY. TYPE-GENERIC.
// For every "Geo … — {space}" database under the parent page, compares each
// editable text/url column of each row against the CURRENT Geo entity value, and
// writes a change plan (old → new) for review. No writes anywhere.
//
// Editable = title + rich_text + url columns (except Geo ID / Geo URL / Review
// status / Cover). Relations, dates, numbers, checkboxes are NOT diffed in v1.
//
// Env:  NOTION_TOKEN=secret_...
// Usage: node scripts/diff-notion-vs-geo.mjs --parent <PAGE_ID> --space <SPACE_ID> [--out plan.json]
import { writeFileSync } from 'node:fs';

const NOTION = 'https://api.notion.com/v1';
const VERSION = '2022-06-28';
const GEO = 'https://api-testnet.geobrowser.io/graphql';
const TOKEN = process.env.NOTION_TOKEN;
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const parentPage = opt('--parent') ?? process.env.NOTION_PARENT_PAGE;
const spaceId = opt('--space');
const outFile = opt('--out');
if (!TOKEN) { console.error('NOTION_TOKEN missing from env'); process.exit(1); }
if (!parentPage || !spaceId) { console.error('usage: diff-notion-vs-geo.mjs --parent <PAGE_ID> --space <SPACE_ID> [--out plan.json]'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function notion(path, method = 'GET', body, attempt = 0) {
  const r = await fetch(`${NOTION}${path}`, { method, headers: { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': VERSION, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json();
  if (r.ok) return j;
  if ((r.status === 429 || r.status >= 500) && attempt < 6) { await sleep(Math.min(1000 * 2 ** attempt, 30000)); return notion(path, method, body, attempt + 1); }
  throw new Error(`Notion ${method} ${path} → ${r.status}: ${JSON.stringify(j).slice(0, 200)}`);
}
async function gql(query) {
  const r = await fetch(GEO, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 300));
  return j.data;
}

const SKIP_COLS = new Set(['Geo ID', 'Geo URL', 'Review status', 'Cover']);
const readProp = (p) => {
  if (!p) return null;
  if (p.type === 'title') return p.title.map((t) => t.plain_text).join('');
  if (p.type === 'rich_text') return p.rich_text.map((t) => t.plain_text).join('');
  if (p.type === 'url') return p.url ?? null;
  return undefined;                     // not an editable text column
};
const norm = (v) => (v == null ? '' : String(v)).replace(/\s+/g, ' ').trim();

async function allRows(dbId) {
  const rows = []; let cursor;
  do { const res = await notion(`/databases/${dbId}/query`, 'POST', cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 }); rows.push(...res.results); cursor = res.has_more ? res.next_cursor : null; } while (cursor);
  return rows;
}

async function main() {
  const spaceName = (await gql(`{ space(id: "${spaceId}") { page { name } } }`)).space?.page?.name ?? '(space)';
  // find every "Geo … — {spaceName}" database under the parent
  const found = await notion('/search', 'POST', { filter: { property: 'object', value: 'database' } });
  const dbs = found.results.filter((d) => {
    const t = d.title?.[0]?.plain_text ?? '';
    return t.startsWith('Geo ') && t.endsWith(` — ${spaceName}`) && d.parent?.page_id?.replace(/-/g, '') === parentPage.replace(/-/g, '');
  });
  if (!dbs.length) throw new Error(`No "Geo … — ${spaceName}" databases found under the page — mirror this space first.`);

  const plan = [];
  for (const db of dbs) {
    const dbTitle = db.title[0].plain_text;
    const rows = await allRows(db.id);
    const notionByGeo = new Map();
    for (const row of rows) {
      const geoId = readProp(row.properties['Geo ID']);
      if (!geoId) continue;
      const vals = {};
      for (const [name, prop] of Object.entries(row.properties)) {
        if (SKIP_COLS.has(name)) continue;
        const v = readProp(prop); if (v !== undefined) vals[name] = v;   // only text/url columns
      }
      notionByGeo.set(geoId, { reviewStatus: row.properties['Review status']?.select?.name ?? null, vals });
    }
    const ids = [...notionByGeo.keys()];
    for (let i = 0; i < ids.length; i += 40) {
      const chunk = ids.slice(i, i + 40);
      const q = '{' + chunk.map((id, k) => `e${k}: entity(id:"${id}"){ id spaceIds values(first:60){nodes{ property{ id name dataTypeName } spaceId text }} }`).join(' ') + '}';
      const data = await gql(q);
      chunk.forEach((id, k) => {
        const ge = data[`e${k}`];
        // An entity's values can exist in several spaces (a space and its sibling
        // "… datasets" space). Compare against the space the editor asked for, but
        // fall back to another space's copy rather than dropping the property —
        // some values live only in the sibling space.
        const vnodes = ge?.values?.nodes ?? [];
        const ordered = [...vnodes.filter((v) => v.spaceId !== spaceId), ...vnodes.filter((v) => v.spaceId === spaceId)];
        const geoProp = new Map(ordered.map((v) => [v.property.name, v.property]));
        const geoText = new Map(ordered.map((v) => [v.property.name, v.text]));
        const nrow = notionByGeo.get(id);
        const changes = [];
        for (const [name, nv] of Object.entries(nrow.vals)) {
          const gv = geoText.get(name) ?? null;
          if (norm(nv) === norm(gv)) continue;
          if (norm(nv) === '') continue;                 // never blank a Geo field from an empty cell
          const prop = geoProp.get(name);
          if (!prop) continue;                            // column not a Geo value property (skip)
          changes.push({ property: name, propertyId: prop.id, dataType: prop.dataTypeName, old: gv, new: nv });
        }
        // Write back to the space the editor named whenever the entity lives there,
        // never to whichever space happens to sort first (that would edit the
        // sibling dataset copy and leave the space the editor is looking at stale).
        const target = (ge?.spaceIds ?? []).includes(spaceId) ? spaceId : (ge?.spaceIds ?? [spaceId])[0];
        if (changes.length) plan.push({ geoId: id, spaceId: target, db: dbTitle, reviewStatus: nrow.reviewStatus, changes });
      });
    }
  }

  const out = { space: { id: spaceId, name: spaceName }, generatedAt: new Date().toISOString(), counts: { entities: plan.length, changes: plan.reduce((n, p) => n + p.changes.length, 0) }, plan };
  const json = JSON.stringify(out, null, 2);
  if (outFile) { writeFileSync(outFile, json); process.stderr.write(`wrote ${outFile}\n`); } else console.log(json);
  process.stderr.write(`\n${spaceName}: ${plan.length} entities changed, ${out.counts.changes} field edits\n`);
  for (const p of plan.slice(0, 30)) { process.stderr.write(`\n[${p.db}] ${p.geoId}\n`); for (const c of p.changes) process.stderr.write(`  ${c.property}: "${norm(c.old).slice(0, 50)}" → "${norm(c.new).slice(0, 50)}"\n`); }
  if (!plan.length) process.stderr.write('No edits detected — Notion matches Geo.\n');
}
main().catch((e) => { console.error('❌', e?.message ?? e); process.exit(1); });
