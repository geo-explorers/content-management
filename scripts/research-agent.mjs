// Research agent pilot: real web search + Jan-v1-4B (Ollama), grounded-only.
// Usage: node scripts/research-agent.mjs "Person Name" ["extra search hint"]
// Loop: DDG search (free) -> fetch top pages -> strip HTML -> grounded prompt -> JSON row.
// Search layer is swappable: replace ddgSearch() with a SearXNG endpoint in production.

const MODEL = 'hf.co/janhq/Jan-v1-4B-GGUF:Q4_K_M';
const OLLAMA = 'http://localhost:11434';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

const name = process.argv[2];
const hint = process.argv[3] ?? '';
if (!name) { console.error('usage: node scripts/research-agent.mjs "Name" ["hint"]'); process.exit(1); }

// ── search (free, keyless; swap for SearXNG in production) ──
// Note: DDG bot-blocks Node's fetch (202 challenge) but accepts curl — shell out for the pilot.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
async function ddgSearch(q) {
  const { stdout: html } = await run('curl', ['-s', '--max-time', '15', '-A', UA,
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`]);
  const links = [...html.matchAll(/result__a[^>]*href="([^"]+)"/g)].map(m => m[1])
    .map(u => { const m = u.match(/uddg=([^&]+)/); return m ? decodeURIComponent(m[1]) : u; })
    .filter(u => u.startsWith('http'));
  return [...new Set(links)];
}

// ── fetch + strip a page to text ──
async function fetchText(url, maxChars = 3500) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000), redirect: 'follow' });
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('html') && !ct.includes('text')) return null;
    let h = await res.text();
    // capture social hrefs before stripping tags (they often live only in link attributes)
    const socials = [...new Set([...h.matchAll(/href="(https?:\/\/(?:www\.)?(?:x\.com|twitter\.com|linkedin\.com|github\.com|instagram\.com|scholar\.google\.com|farcaster\.xyz|warpcast\.com)[^"]*)"/g)]
      .map(m => m[1]).filter(u => !/share|intent|login|signup/.test(u)))].slice(0, 8);
    h = h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<nav[\s\S]*?<\/nav>/gi, ' ');
    const text = h.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    if (text.length < 200) return null; // empty/JS-only page
    return { url, socialLinks: socials, text: text.slice(0, maxChars) };
  } catch { return null; }
}

// ── model call ──
async function ask(prompt) {
  const res = await fetch(`${OLLAMA}/api/generate`, {
    method: 'POST',
    body: JSON.stringify({ model: MODEL, prompt, stream: false,
      options: { num_ctx: 16384, num_predict: 4000, temperature: 0.3 } }),
    signal: AbortSignal.timeout(600000),
  });
  const d = await res.json();
  return { text: d.response, tokens: d.eval_count, secs: d.total_duration / 1e9 };
}

const t0 = Date.now();
console.error(`[1/3] searching: ${name} ${hint}`);
const urls = (await ddgSearch(`${name} ${hint}`.trim())).slice(0, 6);
console.error(`      ${urls.length} results:`); urls.forEach(u => console.error('      -', u.slice(0, 90)));

console.error('[2/3] fetching pages…');
const pages = (await Promise.all(urls.map(u => fetchText(u)))).filter(Boolean).slice(0, 4);
pages.forEach(p => console.error(`      ✓ ${p.url.slice(0, 70)} (${p.text.length} chars, ${p.socialLinks.length} social links)`));
if (!pages.length) { console.error('No fetchable sources — leaving row blank (grounded-only rule).'); process.exit(2); }

console.error('[3/3] asking Jan-v1…');
const sources = pages.map((p, i) =>
  `SOURCE ${i + 1} — ${p.url}\nSOCIAL LINKS IN PAGE: ${p.socialLinks.join(' ') || '(none)'}\nTEXT: ${p.text}`).join('\n\n');

const prompt = `You are a research agent building a knowledge-graph dataset. Below are live web search results for "${name}".

${sources}

STRICT RULES: Use ONLY facts present in the sources above. Never use prior knowledge. If a field is not supported by the sources, use null. Copy titles/roles verbatim (e.g. "co-founder" stays "co-founder").

Answer ONLY with a JSON object:
{
  "name": "the person's canonical full name as written in sources",
  "description": "1-2 sentence encyclopedic description, neutral tone, ending with a period — or null if sources are insufficient",
  "socials": { "twitter": null, "linkedin": null, "github": null, "other": null },
  "key_facts": ["up to 4 short facts, each supported by a source"],
  "source_urls": ["the source URLs you actually used"],
  "confidence": "high | medium | low — low if sources are thin or conflicting"
}`;

const { text, tokens, secs } = await ask(prompt);
console.log(text);
console.error(`\ndone: model ${secs.toFixed(1)}s (${tokens} tok) | total ${((Date.now() - t0) / 1000).toFixed(1)}s`);
