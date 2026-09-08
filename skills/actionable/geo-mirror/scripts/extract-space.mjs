#!/usr/bin/env node
// geo-mirror — extract half (Geo → structured JSON). READ-ONLY, no key needed.
// TYPE-GENERIC: mirrors ANY entity type (News story, Episode, Event, Person, …),
// not just News stories. For each entity it captures its own scalar values
// (→ columns), its relations grouped by type (→ linked DBs + page body), and its
// composed page Blocks (→ grouped body sections). Related entities are enriched
// with their own scalar values so their DBs have real columns.
//
// Usage:
//   node scripts/extract-space.mjs <SPACE_ID> --type <TYPE_ID> [scope] [--out file.json]
// Scope (at least one REQUIRED — Geo spaces are huge, never mirror everything):
//   --since YYYY-MM-DD [--until YYYY-MM-DD]   date range on the type's date property
//   --related <ENTITY_ID>                     only entities with a relation to this (topic, podcast, …)
//   --limit N                                 newest N
//   --all                                     explicit whole-type override (rarely wanted)
//   --date-prop "<name>"                      override the date property (auto: Publish datetime / Air date)
// Examples:
//   node extract-space.mjs 89bd89bf28ff8a0963faf92a8c905e20 --since 2026-08-19          # News (default type)
//   node extract-space.mjs b5a31f8182b042437ede0f84ee02f104 --type 972d201ad78045689e01543f67b26bee --related <podcastId> --limit 3   # podcast episodes
import { writeFileSync } from 'node:fs';

const API = 'https://api-testnet.geobrowser.io/graphql';
const NEWS_STORY = 'e550fe517e904b2c8fffdf13408f5634';
const BLOCKS_REL = 'beaba5cba67741a8b35377030613fc70';
const COLLECTION_ITEM = 'a99f9ce12ffa4dac8c61f6310d46064a';
const COVER_REL_NAMES = ['Cover', 'Avatar'];                  // image relation, in preference order
const DATE_PROP_CANDIDATES = ['Publish datetime', 'Air date', 'Date'];

const args = process.argv.slice(2);
const spaceId = args[0];
if (!spaceId || spaceId.startsWith('--')) { console.error('usage: extract-space.mjs <SPACE_ID> --type <TYPE_ID> [--since …|--related …|--limit N|--all] [--out file.json]'); process.exit(1); }
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const typeId = opt('--type', NEWS_STORY);
const since = opt('--since');
const until = opt('--until');
const related = opt('--related');
const dateProp = opt('--date-prop');
const limit = parseInt(opt('--limit', '0')) || 0;
const allFlag = args.includes('--all');
const outFile = opt('--out');

// SAFETY GATE — refuse an unbounded whole-type mirror.
if (!since && !until && !related && !limit && !allFlag) {
  console.error(
    `REFUSING to mirror an entire type/space — Geo is large and grows daily.\n` +
    `Narrow with at least one of: --since YYYY-MM-DD [--until …] | --related <ENTITY_ID> | --limit N.\n` +
    `Or pass --all to deliberately mirror the whole type (rarely wanted).`);
  process.exit(2);
}

async function gql(query, variables = {}) {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 400));
  return j.data;
}
const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
const toHttps = (u) => (u && u.startsWith('ipfs://')) ? `${IPFS_GATEWAY}/${u.slice('ipfs://'.length)}` : u;
const uniqTargets = (nodes) => { const s = new Set(); return nodes.filter((r) => { const id = r.toEntity?.id; if (!id || s.has(id)) return false; s.add(id); return true; }); };

// pull a scalar value out of a values node (whichever field is populated)
const scalar = (n) => n.text ?? n.datetime ?? n.float ?? n.integer ?? (n.boolean != null ? n.boolean : null);
// collect an entity's scalar values as { propName: { value, dataType } }
function collectValues(valueNodes) {
  const out = {};
  for (const v of valueNodes) out[v.property.name] = { value: scalar(v), dataType: v.property.dataTypeName, propertyId: v.property.id };
  return out;
}

// ── space + type names ──────────────────────────────────────────────────────
const meta = await gql(`{ space(id: "${spaceId}") { page { name } } type: entity(id: "${typeId}") { name } }`);
if (!meta.space) throw new Error(`space ${spaceId} not found`);
const spaceName = meta.space.page?.name ?? '(space)';
const typeNameResolved = meta.type?.name ?? '(type)';

// ── sweep primary entities (scoped by type+space; bounded nested relations) ──
process.stderr.write(`Space: ${spaceName} (${spaceId}) · type ${typeId}\n`);
const raw = [];
let after = null;
for (;;) {
  const data = await gql(`query($after: Cursor) {
    entitiesConnection(typeId: "${typeId}", spaceId: "${spaceId}", first: 100, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id name
        values(first: 30) { nodes { property { id name dataTypeName } text datetime float integer boolean } }
        relations(first: 200) { nodes { type { id name } toEntity { id name types { name } } } }
      }
    }
  }`, { after });
  const c = data.entitiesConnection;
  for (const n of c.nodes) raw.push(n);
  process.stderr.write(`\rfetched ${raw.length} entities`);
  if (!c.pageInfo.hasNextPage) break;
  after = c.pageInfo.endCursor;
}
process.stderr.write('\n');

// ── auto-detect the date property for this type (for --since/--until) ────────
let effectiveDateProp = dateProp;
if (!effectiveDateProp && (since || until) && raw.length) {
  const names = new Set(raw.flatMap((e) => e.values.nodes.filter((v) => v.property.dataTypeName === 'Datetime').map((v) => v.property.name)));
  effectiveDateProp = DATE_PROP_CANDIDATES.find((c) => names.has(c)) ?? [...names][0];
  if (effectiveDateProp) process.stderr.write(`date filter on: "${effectiveDateProp}"\n`);
}
const dateOf = (e) => { const v = e.values.nodes.find((x) => x.property.name === effectiveDateProp); return v?.datetime ?? null; };
const inRange = (iso) => { if (!iso) return !since && !until; const d = iso.slice(0, 10); if (since && d < since) return false; if (until && d > until) return false; return true; };

// ── normalize + scope filters (date, --related) ─────────────────────────────
let primary = raw.map((e) => {
  const relsByType = {};
  for (const r of uniqTargets(e.relations.nodes)) {
    const t = r.type?.name ?? '(rel)';
    (relsByType[t] ??= []).push({ geoId: r.toEntity.id, name: r.toEntity.name, typeName: r.toEntity.types?.[0]?.name ?? null });
  }
  let coverId = null;
  for (const cn of COVER_REL_NAMES) { if (relsByType[cn]?.length) { coverId = relsByType[cn][0].geoId; break; } }
  return { geoId: e.id, name: e.name,
    values: collectValues(e.values.nodes), relations: relsByType, coverImageId: coverId, coverUrl: null,
    dateValue: dateOf(e) };
});
if (effectiveDateProp) primary = primary.filter((e) => inRange(e.dateValue));
if (related) primary = primary.filter((e) => Object.values(e.relations).some((list) => list.some((t) => t.geoId === related)));
primary.sort((a, b) => (b.dateValue ?? '').localeCompare(a.dateValue ?? ''));
if (limit) primary = primary.slice(0, limit);

// ── enrich related entities that become their OWN linked DBs ─────────────────
// Only "core content" relations get a dedicated DB (default: Notable claims →
// Claim, Sources → Article) — this keeps the clean ~3-DB model. Every OTHER
// relation (Topics, Related people/entities, Hosts, Guests, Podcast…) is still
// mirrored in the page BODY (name + link), just not as a separate database.
// Override with --link "Notable claims,Sources,Hosts,Guests" to add more.
const LINK = (opt('--link') || 'Notable claims,Sources').split(',').map((s) => s.trim()).filter(Boolean);
const LINKSET = new Set(LINK);
const relatedIds = [...new Set(primary.flatMap((e) => Object.entries(e.relations)
  .filter(([t]) => LINKSET.has(t)).flatMap(([, list]) => list.map((x) => x.geoId))))];
async function fetchEntities(ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 40) {
    const chunk = ids.slice(i, i + 40);
    const q = '{' + chunk.map((id, k) => `e${k}: entity(id:"${id}"){ id name types{name} values(first:20){nodes{property{id name dataTypeName} text datetime float integer boolean}} }`).join(' ') + '}';
    const data = await gql(q);
    chunk.forEach((id, k) => out.set(id, data[`e${k}`]));
  }
  return out;
}
process.stderr.write(`enriching ${relatedIds.length} related entities…\n`);
const relMeta = await fetchEntities(relatedIds);
const related_out = {};
for (const id of relatedIds) {
  const e = relMeta.get(id); if (!e) continue;
  related_out[id] = { typeName: e.types?.[0]?.name ?? '(entity)', name: e.name, values: collectValues(e.values.nodes) };
}

// ── cover images (Cover/Avatar → Image → https) ─────────────────────────────
const coverIds = [...new Set(primary.map((e) => e.coverImageId).filter(Boolean))];
const coverMeta = await fetchEntities(coverIds);
for (const e of primary) {
  if (!e.coverImageId) continue;
  const c = coverMeta.get(e.coverImageId);
  const ipfs = (c?.values?.nodes ?? []).find((v) => ['IPFS URL', 'URL'].includes(v.property.name))?.text;
  e.coverUrl = toHttps(ipfs);
}

// ── page Blocks → grouped sections (heading + intro + its collection items) ──
process.stderr.write('resolving page blocks…\n');
let bn = 0;
for (const e of primary) {
  const data = await gql(`{ entity(id: "${e.geoId}") {
    relations(first: 80, filter: { typeId: { is: "${BLOCKS_REL}" } }, orderBy: POSITION_ASC) {
      nodes { toEntity {
        id name
        values(first: 10) { nodes { property { name } text } }
        relations(first: 160, filter: { typeId: { is: "${COLLECTION_ITEM}" } }, orderBy: POSITION_ASC) { nodes { toEntity { id name } } }
      } }
    } } }`);
  e.blocks = uniqTargets(data.entity?.relations?.nodes ?? []).map((r) => {
    const b = r.toEntity; const bv = b.values.nodes;
    const nm = bv.find((v) => v.property.name === 'Name')?.text ?? b.name;
    const desc = bv.find((v) => v.property.name === 'Description')?.text ?? null;
    return { heading: nm, description: desc, items: uniqTargets(b.relations.nodes).map((ci) => ({ geoId: ci.toEntity.id, name: ci.toEntity.name })) };
  });
  process.stderr.write(`\r  blocks ${++bn}/${primary.length}`);
}
process.stderr.write('\n');

// clean the primary shape for output
for (const e of primary) { delete e.coverImageId; delete e.dateValue; }

const result = {
  space: { id: spaceId, name: spaceName },
  type: { id: typeId, name: typeNameResolved },
  scope: { since: since ?? null, until: until ?? null, related: related ?? null, limit: limit || null, dateProp: effectiveDateProp ?? null },
  extractedAt: new Date().toISOString(),
  counts: { entities: primary.length, related: Object.keys(related_out).length },
  entities: primary, related: related_out,
};
const json = JSON.stringify(result, null, 2);
if (outFile) { writeFileSync(outFile, json); process.stderr.write(`wrote ${outFile}\n`); } else console.log(json);
process.stderr.write(`\n${spaceName} · ${result.type.name}: ${primary.length} entities | ${Object.keys(related_out).length} related${since ? ` | since ${since}` : ''}${related ? ` | related ${related.slice(0, 8)}…` : ''}\n`);
