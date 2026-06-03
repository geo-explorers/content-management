/**
 * Press Review — Geo Coverage Map (read-only)
 * ============================================
 *
 * The Geo-side half of the press-review skill. Given a Space and a date range,
 * it pulls every News story published in that window, with its publish date,
 * topics, sources (tagged by outlet), and claim count. This is the denominator
 * the press-review skill compares external press against — "what have we
 * already covered?"
 *
 * It WRITES NOTHING to Geo. Pure read. Safe to run anytime, no .env, no wallet.
 *
 * Usage:
 *   bun run scripts/press-review-coverage-map.ts --space AI --from 2026-05-01 --to 2026-05-08
 *   bun run scripts/press-review-coverage-map.ts --space 41e851610e13a19441c4d980f2f2ce6b --days 7
 *   bun run scripts/press-review-coverage-map.ts --space AI --from 2026-05-01 --to 2026-05-08 --json out.json
 *
 * Flags:
 *   --space   Space name (fuzzy) or space ID. Required.
 *   --from    ISO date (YYYY-MM-DD) lower bound on Publish date. Optional.
 *   --to      ISO date (YYYY-MM-DD) upper bound on Publish date. Optional.
 *   --days N  Shortcut: last N days up to today (overrides --from/--to if set together is avoided).
 *   --json F  Also write a machine-readable JSON artifact to file F (for the dashboard / orchestrator).
 *
 * Discovered schema (AI space, verified 2026-05-08):
 *   News story type id : 8f151ba4de204e3c9cb499ddf96f48f1 is the Types relation type;
 *                        the News story *type entity* is matched by name below.
 *   Publish date prop  : 94e43fe8faf241009eb887ab4f999723  (datetime)
 *   Name prop          : a126ca530c8e48d5b88882c734c38935
 *   Description prop    : 9b1f76ff9711404c861e59dc3fa7d037
 *   Summary prop        : aa5da9278af44294a8a9b79421762c3a
 *   Topics relation    : 806d52bc27e94c9193c057978b093351
 *   Sources relation   : (matched by type name "Sources")
 *   Claims relation    : e1371bcda7044396adb7ea7ecc8fe3d4  (type name "Notable claims")
 */

import * as fs from 'fs';

const API_URL = 'https://testnet-api.geobrowser.io/graphql';

// ─── Known IDs ───────────────────────────────────────────────────────────────
const PUBLISH_DATE_PROP = '94e43fe8faf241009eb887ab4f999723';
// The News story *type* entity lives in Root, but News story entities live in
// topical spaces (AI, Crypto, …). Use the type ID directly — don't look it up
// per-space, it won't be defined there.
const NEWS_STORY_TYPE_ID = 'e550fe517e904b2c8fffdf13408f5634';

// Spaces (name → id). Mirror of content-management/src/constants.ts plus the
// AI space the brief referenced.
const SPACES: Record<string, string> = {
  geo:        'a19c345ab9866679b001d7d2138d88a1',
  ai:         '41e851610e13a19441c4d980f2f2ce6b',
  crypto:     'c9f267dcb0d270718c2a3c45a64afd32',
  health:     '52c7ae149838b6d47ce0f3b2a5974546',
  industries: 'd69608290513c2a91102c939b3265bd7',
  technology: '870e3b3068661e6280fad2ab456829bc',
  software:   '9b611b848b12491b9b6b43f3cf019b8b',
};

// ─── GraphQL helper (retry on 5xx/429) ──────────────────────────────────────
async function gql(query: string, maxRetries = 5): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if ((res.status >= 500 || res.status === 429) && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 2 ** (attempt - 1) * 1000));
        continue;
      }
      if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
      const json = await res.json();
      if (json.errors) {
        const msg = json.errors[0]?.message ?? 'Unknown';
        if ((msg.includes('Unexpected') || msg.includes('Internal')) && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2 ** (attempt - 1) * 1000));
          continue;
        }
        throw new Error(`GraphQL: ${msg}`);
      }
      return json.data;
    } catch (e: any) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 2 ** (attempt - 1) * 1000));
        continue;
      }
      throw e;
    }
  }
}

// ─── Arg parsing ─────────────────────────────────────────────────────────────
function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      out[key] = val;
    }
  }
  return out;
}

function resolveSpace(input: string): { id: string; label: string } {
  if (/^[0-9a-f]{32}$/i.test(input)) return { id: input, label: input };
  const key = input.toLowerCase().trim();
  if (SPACES[key]) return { id: SPACES[key], label: input };
  // fuzzy: startsWith
  const hit = Object.keys(SPACES).find(k => k.startsWith(key) || key.startsWith(k));
  if (hit) return { id: SPACES[hit], label: hit };
  throw new Error(`Unknown space "${input}". Known: ${Object.keys(SPACES).join(', ')}, or pass a 32-char space ID.`);
}

// ─── Fetch all News stories in a space ──────────────────────────────────────
async function fetchNewsStories(spaceId: string, typeId: string): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | null = null;
  while (true) {
    const after = cursor ? `after: "${cursor}"` : '';
    const data = await gql(`{
      entitiesConnection(spaceId: "${spaceId}", typeId: "${typeId}", first: 100, ${after}) {
        edges { node { id } }
        pageInfo { hasNextPage endCursor }
      }
    }`);
    const conn = data.entitiesConnection;
    for (const e of conn?.edges ?? []) ids.push(e.node.id);
    if (!conn?.pageInfo?.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }
  return ids;
}

interface Story {
  id: string;
  name: string;
  publishDate: string | null;
  description: string | null;
  topics: string[];
  sources: string[];
  claimCount: number;
}

async function fetchStory(id: string): Promise<Story> {
  const data = await gql(`{
    entity(id: "${id}") {
      name
      values(first: 50) { nodes { property { id name } text datetime } }
      relations(first: 250) { nodes { type { id name } toEntity { name } } }
    }
  }`);
  const e = data.entity;
  let publishDate: string | null = null;
  let description: string | null = null;
  for (const v of e.values?.nodes ?? []) {
    if (v.property.id === PUBLISH_DATE_PROP) publishDate = v.datetime ?? null;
    if (v.property.name === 'Description') description = v.text ?? null;
  }
  const topics: string[] = [];
  const sources: string[] = [];
  let claimCount = 0;
  for (const r of e.relations?.nodes ?? []) {
    const tn = r.type?.name;
    const target = (r.toEntity?.name ?? '').trim();
    if (tn === 'Topics' && target) topics.push(target);
    else if (tn === 'Sources' && target) sources.push(target);
    else if (tn === 'Notable claims') claimCount++;
  }
  return { id, name: (e.name ?? '').trim(), publishDate, description, topics, sources, claimCount };
}

// ─── Source outlet extraction ────────────────────────────────────────────────
// Sources are labeled "Headline | Outlet" or "Headline - Outlet". Pull the
// outlet after the last separator. Heuristic — outlet names are short and
// usually capitalised, so take the trailing segment after the last "|" or " - ".
function outletOf(source: string): string {
  if (source.includes('|')) {
    const parts = source.split('|');
    return parts[parts.length - 1].trim();
  }
  // " - " is the common dash separator (e.g. "Headline - Axios Denver")
  const dash = source.lastIndexOf(' - ');
  if (dash !== -1) {
    const tail = source.slice(dash + 3).trim();
    // Guard against false positives: outlet tails are short (< 6 words).
    if (tail && tail.split(/\s+/).length <= 6) return tail;
  }
  return '(unknown outlet)';
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.space) {
    console.error('Missing --space. Example: --space AI --from 2026-05-01 --to 2026-05-08');
    process.exit(1);
  }
  const space = resolveSpace(args.space);

  // Date window
  let from = args.from ?? null;
  let to = args.to ?? null;
  if (args.days) {
    const n = parseInt(args.days, 10);
    const today = new Date();
    const fromD = new Date(today.getTime() - n * 86400000);
    to = today.toISOString().slice(0, 10);
    from = fromD.toISOString().slice(0, 10);
  }
  const fromTs = from ? new Date(from + 'T00:00:00Z').getTime() : -Infinity;
  const toTs = to ? new Date(to + 'T23:59:59Z').getTime() : Infinity;

  console.log(`\n📰 Press Review — Coverage Map`);
  console.log(`   Space : ${space.label} (${space.id})`);
  console.log(`   Window: ${from ?? 'any'} → ${to ?? 'any'}\n`);

  console.log('Fetching story list...');
  const ids = await fetchNewsStories(space.id, NEWS_STORY_TYPE_ID);
  console.log(`  ${ids.length} News stories in space. Loading details...\n`);

  const stories: Story[] = [];
  for (let i = 0; i < ids.length; i++) {
    const s = await fetchStory(ids[i]);
    if (s.publishDate) {
      const ts = new Date(s.publishDate).getTime();
      if (ts < fromTs || ts > toTs) continue;
    } else if (from || to) {
      continue; // no date but a window was requested → skip
    }
    stories.push(s);
    if ((i + 1) % 50 === 0) console.log(`  ...${i + 1}/${ids.length}`);
  }

  // Sort newest first
  stories.sort((a, b) => (b.publishDate ?? '').localeCompare(a.publishDate ?? ''));

  // ─── Report ────────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(80)}`);
  console.log(`COVERED: ${stories.length} News stories in window`);
  console.log('='.repeat(80) + '\n');

  for (const s of stories) {
    const date = s.publishDate ? s.publishDate.slice(0, 10) : '(no date)';
    console.log(`[${date}] ${s.name}`);
    console.log(`         topics: ${s.topics.join(', ') || '—'}`);
    console.log(`         sources: ${s.sources.length} (${[...new Set(s.sources.map(outletOf))].join(', ') || '—'})`);
    console.log(`         claims: ${s.claimCount}   id: ${s.id}`);
    console.log('');
  }

  // ─── Topic coverage rollup ──────────────────────────────────────────────────
  const byTopic: Record<string, number> = {};
  const outletCount: Record<string, number> = {};
  for (const s of stories) {
    for (const t of s.topics) byTopic[t] = (byTopic[t] ?? 0) + 1;
    for (const src of s.sources) {
      const o = outletOf(src);
      outletCount[o] = (outletCount[o] ?? 0) + 1;
    }
  }
  console.log('─'.repeat(80));
  console.log('TOPIC COVERAGE (stories per topic, this window):');
  for (const [t, n] of Object.entries(byTopic).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(3)}  ${t}`);
  }
  console.log('\nOUTLET FOOTPRINT (sources per outlet, this window):');
  for (const [o, n] of Object.entries(outletCount).sort((a, b) => b[1] - a[1]).slice(0, 25)) {
    console.log(`  ${String(n).padStart(3)}  ${o}`);
  }
  console.log('');

  // ─── Machine-readable artifact (for the orchestrator / dashboard) ──────────
  if (args.json) {
    const artifact = {
      space: { label: space.label, id: space.id },
      window: { from, to },
      generatedFrom: 'press-review-coverage-map.ts',
      storyCount: stories.length,
      stories,
      topicCoverage: byTopic,
      outletFootprint: outletCount,
    };
    fs.writeFileSync(args.json, JSON.stringify(artifact, null, 2));
    console.log(`📄 Wrote machine-readable coverage map to ${args.json}`);
  }

  console.log(`\nDone. This is the "already covered" baseline. The press-review skill compares external press against this.`);
}

main().catch(e => { console.error(e); process.exit(1); });
