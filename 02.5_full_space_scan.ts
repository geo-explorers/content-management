import { gql } from './src/functions.js';
import * as fs from 'fs';

// ─── Full space duplicate scan ──────────────────────────────────────────────
// Scans ALL types for a space using cursor pagination (no offset limit).
// Reads types from all-types.txt, fetches all entities per type, finds dupes.
// Usage: bun run 02.5_full_space_scan.ts <space>
// Examples:
//   bun run 02.5_full_space_scan.ts crypto
//   bun run 02.5_full_space_scan.ts ai
//   bun run 02.5_full_space_scan.ts health

const SPACES: Record<string, { id: string; name: string; section: string }> = {
  crypto:  { id: 'c9f267dcb0d270718c2a3c45a64afd32', name: 'Crypto', section: 'Crypto' },
  ai:      { id: '41e851610e13a19441c4d980f2f2ce6b', name: 'AI', section: 'AI' },
  health:  { id: '52c7ae149838b6d47ce0f3b2a5974546', name: 'Health', section: 'Health' },
  podcast: { id: 'b5a31f8182b042437ede0f84ee02f104', name: 'Podcasts', section: 'Podcasts' },
};

const spaceArg = process.argv[2]?.toLowerCase();
if (!spaceArg || !SPACES[spaceArg]) {
  console.log('Usage: bun run 02.5_full_space_scan.ts <space>');
  console.log('Spaces: ' + Object.keys(SPACES).join(', '));
  process.exit(1);
}

const space = SPACES[spaceArg];

// ─── Parse types from all-types.txt ─────────────────────────────────────────

function parseTypes(filePath: string, sectionName: string): { label: string; typeId: string }[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const types: { label: string; typeId: string }[] = [];
  let inSection = false;

  for (const line of lines) {
    if (line.startsWith(`=== ${sectionName}`)) { inSection = true; continue; }
    if (line.startsWith('===') && inSection) break;
    if (!inSection) continue;

    const match = line.match(/^\s+(.+?)\s+→\s+([a-f0-9]{32})\s*$/);
    if (match) {
      types.push({ label: match[1].trim(), typeId: match[2] });
    }
  }
  return types;
}

// ─── Fetch all entities of a type using cursor pagination ───────────────────

interface Hit { id: string; name: string; }

async function fetchAllOfType(spaceId: string, typeId: string): Promise<Hit[]> {
  const results: Hit[] = [];
  let cursor: string | null = null;

  while (true) {
    const afterClause = cursor ? `after: "${cursor}"` : '';
    const data = await gql(`{
      entitiesConnection(
        spaceId: "${spaceId}"
        typeId: "${typeId}"
        first: 100
        ${afterClause}
      ) {
        edges { node { id name } }
        pageInfo { hasNextPage endCursor }
      }
    }`);

    const conn = data.entitiesConnection;
    const edges = conn?.edges ?? [];
    for (const edge of edges) {
      const name = (edge.node.name ?? '').trim();
      if (name) results.push({ id: edge.node.id, name });
    }

    if (!conn?.pageInfo?.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }

  return results;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const types = parseTypes('../all-types.txt', space.section);
  console.log(`\n${space.name} space — scanning ${types.length} types for duplicates\n`);

  let totalDupes = 0;
  let totalEntities = 0;

  for (const { label, typeId } of types) {
    const hits = await fetchAllOfType(space.id, typeId);
    totalEntities += hits.length;

    // Group by lowercase name
    const byName = new Map<string, Hit[]>();
    for (const hit of hits) {
      const key = hit.name.toLowerCase();
      const list = byName.get(key) ?? [];
      list.push(hit);
      byName.set(key, list);
    }

    const duplicates = [...byName.entries()]
      .filter(([, h]) => h.length > 1)
      .sort(([a], [b]) => a.localeCompare(b));

    if (duplicates.length === 0) {
      console.log(`  ${label}: ${hits.length} entities — no duplicates`);
      continue;
    }

    totalDupes += duplicates.length;
    console.log(`\n  ${label}: ${hits.length} entities — ${duplicates.length} duplicate(s)`);
    console.log(`  ${'─'.repeat(60)}`);

    for (const [, dupes] of duplicates) {
      console.log(`  "${dupes[0].name}"  (${dupes.length} entities)`);
      for (const h of dupes) {
        console.log(`    ${h.id}`);
      }
    }
    console.log();
  }

  // ── No-type CSV cross-check ─────────────────────────────────────────────────
  const csvPath = './no_type_entities.csv';
  if (fs.existsSync(csvPath)) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Checking no-type CSV cross-matches...\n`);

    // Load no-type entities for this space
    const noTypeByName = new Map<string, { id: string; name: string }[]>();
    const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').slice(1);
    for (const line of lines) {
      if (!line.trim()) continue;
      const match = line.match(/^([^,]+),(".*?"|[^,]*),([^,]+),(.+)$/);
      if (!match) continue;
      const id = match[1];
      const name = match[2].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      const spaceId = match[3];
      if (spaceId !== space.id || !name) continue;
      const key = name.toLowerCase();
      const list = noTypeByName.get(key) ?? [];
      list.push({ id, name });
      noTypeByName.set(key, list);
    }
    console.log(`  Loaded ${[...noTypeByName.values()].reduce((s, l) => s + l.length, 0)} no-type entities for ${space.name}\n`);

    // Check all typed entities against no-type
    let noTypeMatches = 0;
    for (const { label, typeId } of types) {
      const hits = await fetchAllOfType(space.id, typeId);
      const seenNames = new Set<string>();
      for (const hit of hits) {
        const key = hit.name.toLowerCase();
        if (seenNames.has(key)) continue;
        seenNames.add(key);
        const noTypes = noTypeByName.get(key);
        if (noTypes && noTypes.length > 0) {
          const different = noTypes.filter(nt => nt.id !== hit.id);
          if (different.length > 0) {
            if (noTypeMatches === 0) console.log(`  Typed ↔ No-type matches:`);
            noTypeMatches++;
            console.log(`    "${hit.name}" (${label}) ← ${different.length} no-type: ${different.map(n => n.id.slice(0, 8)).join(', ')}`);
          }
        }
      }
    }

    // No-type vs no-type duplicates
    let noTypeDupes = 0;
    for (const [, entries] of noTypeByName) {
      if (entries.length > 1) {
        if (noTypeDupes === 0) console.log(`\n  No-type vs No-type duplicates:`);
        noTypeDupes++;
        console.log(`    "${entries[0].name}" (${entries.length} entities): ${entries.map(e => e.id.slice(0, 8)).join(', ')}`);
      }
    }

    if (noTypeMatches === 0) console.log(`  No typed ↔ no-type matches found.`);
    if (noTypeDupes === 0) console.log(`  No no-type vs no-type duplicates found.`);
    console.log(`\n  Summary: ${noTypeMatches} typed↔no-type matches, ${noTypeDupes} no-type↔no-type dupes`);
  } else {
    console.log(`\n⚠ no_type_entities.csv not found — skipping no-type cross-check`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`${space.name}: ${totalEntities} entities across ${types.length} types`);
  console.log(`${totalDupes} total same-type duplicate name(s)`);
  console.log(`${'='.repeat(60)}`);
}

main().catch(console.error);
