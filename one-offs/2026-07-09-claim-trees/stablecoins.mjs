// stablecoins.mjs — claim tree for the Stablecoins static topic (pilot, spec: tasks/2026-07-09-claim-architecture/claim-architecture.md)
//   L0-S1 (live, slot as-is): 27fb8818… OUSD proposition (Topics -> Stablecoins ✓ from its build)
//   L0-S2 (create): "Platforms should be free to pay yield on stablecoins" + args (3 ATTACHED existing claims + 3 created)
//   L0-S3 (create): "Dollar stablecoins strengthen the US dollar's global position" + 3🟢/3🔴 created args
//   Topic page: "🔥 Key claims" collection block PREPENDED (page already has 5 blocks; position read live).
//
//   DRY-RUN: bun --env-file=/Users/moh/work-projects/geo/.env run stablecoins.mjs
//   EXECUTE: ...same... stablecoins.mjs --dao --vote

import { Graph, Position, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const CRYPTO   = "c9f267dcb0d270718c2a3c45a64afd32";
const DAO_ADDR = "0x40230BBf745b3708688347aDe02d04e52eD82f45";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";
const ENDPOINT = "https://testnet-api.geobrowser.io/graphql";

const T_CLAIM      = "96f859efa1ca4b229372c86ad58b694b";
const T_ARTICLE    = "a2a5ed0cacef46b1835de457956ce915";
const T_DATA       = "b8803a8665de412bbb357e0c84adf473";
const P_TOPICS     = "806d52bc27e94c9193c057978b093351";
const P_SOURCES    = "49c5d5e1679a4dbdbfd33f618f227c94";
const P_WEBURL     = "412ff593e9154012a43d4c27ec5c68b6";
const P_SUPPORTING = "1dc6a843458848198e7a6e672268f811";
const P_OPPOSING   = "4e6ec5d14292498a84e5f607ca1a08ce";
const P_ISFACT     = "da4a6c1f9d4446f9832ff3b49a4400ef";
const P_BLOCKS     = "beaba5cba67741a8b35377030613fc70";
const DATA_SRC     = "1f69cc9880d444abad493df6a7b15ee4";
const COLL_SRC     = "1295037a5d9c4d09b27c5502654b9177";
const COLL_ITEM    = "a99f9ce12ffa4dac8c61f6310d46064a";

const STABLECOINS = "1c335028b9d64ea7bb5d42876faaed15";
const L0_S1       = "27fb88183c16449bae71bec7bdb46e50"; // live OUSD proposition

// EXISTING claims attached as arguments (P5 curate-first; verified in-space 2026-07-09)
const ATTACH = {
  cea:  "39ac64cbc95f462381e4fbba7f489179", // CEA: yield ban imposes cost — supporting yield freedom
  icba: "77bd570de9d24ee8b72add6209b27a32", // ICBA: $1.3T deposit risk — opposing
  occ:  "92654b73e8b34287b64466b781226205", // OCC GENIUS proposal bars platform yield — opposing
};

const SOURCES = {
  crs:       { name: "The Stablecoin Yield Debate (CRS IF13174)", url: "https://www.congress.gov/crs-product/IF13174" },
  forbes:    { name: "The GENIUS Act Stablecoin Yield Ban Has A Coinbase-Shaped Hole", url: "https://www.forbes.com/sites/digital-assets/2026/05/20/the-genius-act-stablecoin-yield-ban-has-a-coinbase-shaped-hole/" },
  coindesk:  { name: "Bankers Rebuff White House Claim That Stablecoin Yield Doesn't Threaten Deposits", url: "https://www.coindesk.com/policy/2026/04/13/bankers-rebuff-white-house-claim-that-stablecoin-yield-doesn-t-threaten-deposits" },
  brookings: { name: "The rise of stablecoins and implications for Treasury markets", url: "https://www.brookings.edu/articles/the-rise-of-stablecoins-and-implications-for-treasury-markets/" },
  bloomberg: { name: "How Stablecoins Became Part of America's Dollar Strategy", url: "https://www.bloomberg.com/news/articles/2026-05-22/how-stablecoins-became-part-of-america-s-dollar-strategy" },
  fxstreet:  { name: "ECB warns Stablecoins risk financial stability and Dollar dominance", url: "https://www.fxstreet.com/cryptocurrencies/news/ecb-warns-stablecoins-risk-financial-stability-and-dollar-dominance-202606021117" },
  imf:       { name: "Stablecoin Shocks (IMF Working Paper)", url: "https://www.imf.org/en/publications/wp/issues/2026/03/06/stablecoin-shocks-574528" },
};

const PROPS = [
  {
    key: "yield",
    name: "Platforms should be free to pay yield on stablecoins",
    desc: "The proposition anchoring the yield fight: the GENIUS Act bars issuers from paying yield and bank groups want the restriction extended to platforms. Supporters of yield freedom call the ban incumbent protection with trivial lending benefit. Opponents warn of deposit flight that would hit community bank lending hardest.",
    supporting: [
      { attach: "cea" },
      { text: "A yield ban mainly protects incumbent banks, which remain free to pay interest on deposits.", factual: false, src: "crs" },
      { text: "Coinbase already pays USDC holders a 3.5 percent reward, showing consumer demand for stablecoin yield.", factual: true, src: "forbes" },
    ],
    opposing: [
      { attach: "icba" },
      { attach: "occ" },
      { text: "Bank trade groups publicly rejected the White House finding that stablecoin yield poses no threat to deposits.", factual: true, src: "coindesk" },
    ],
  },
  {
    key: "dollar",
    name: "Dollar stablecoins strengthen the US dollar's global position",
    desc: "The proposition anchoring this debate: dollar stablecoins extend US monetary reach and Treasury demand. Supporters point to near-total dollar pegging and a deliberate US strategy. Opponents cite ECB and IMF warnings that runs, fire sales, and monetary policy disruption could damage the system stablecoins extend.",
    supporting: [
      { text: "About 99 percent of stablecoins are pegged to the US dollar.", factual: true, src: "crs" },
      { text: "Reserve backed stablecoins add structural demand for short term US Treasuries.", factual: true, src: "brookings" },
      { text: "The United States made private dollar stablecoins a deliberate arm of dollar strategy through the GENIUS Act.", factual: true, src: "bloomberg" },
    ],
    opposing: [
      { text: "The European Central Bank warned in June 2026 that stablecoins risk bank runs, fire sales, and disrupted monetary policy.", factual: true, src: "fxstreet" },
      { text: "IMF research finds stablecoin demand shocks depress short term Treasury yields and weaken the dollar.", factual: true, src: "imf" },
      { text: "Stablecoins are repeating the money market fund pattern that reshaped finance in the 1970s and cracked in 2008.", factual: false, src: "fxstreet" },
    ],
  },
];

// live read: current Blocks positions on the Stablecoins page (prepend Key claims before the first)
async function gql(q) {
  const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}
const page = await gql(`{ entity(id:"${STABLECOINS}"){ relations(first:100){ nodes{ id type{id} position toEntity{id name} } } } }`);
const blockRels = page.entity.relations.nodes.filter((n) => n.type.id === P_BLOCKS);
const firstPos = blockRels.map((n) => n.position).filter(Boolean).sort()[0] ?? null;
console.log(`existing blocks: ${blockRels.length}, first position: ${firstPos}`);

const ops = [];
const created = { articles: {}, props: {}, args: [], attached: [] };

for (const [k, s] of Object.entries(SOURCES)) {
  const a = Graph.createEntity({ name: s.name, types: [T_ARTICLE], values: [{ property: P_WEBURL, type: "text", value: s.url }] });
  ops.push(...a.ops);
  created.articles[k] = a.id;
}

for (const p of PROPS) {
  const prop = Graph.createEntity({
    name: p.name, description: p.desc, types: [T_CLAIM],
    values: [{ property: P_ISFACT, type: "boolean", value: false }],
  });
  ops.push(...prop.ops);
  created.props[p.key] = prop.id;
  ops.push(...Graph.createRelation({ fromEntity: prop.id, toEntity: STABLECOINS, type: P_TOPICS }).ops);

  for (const [side, rel] of [["supporting", P_SUPPORTING], ["opposing", P_OPPOSING]]) {
    for (const c of p[side]) {
      if (c.attach) {
        ops.push(...Graph.createRelation({ fromEntity: prop.id, toEntity: ATTACH[c.attach], type: rel }).ops);
        created.attached.push({ prop: p.key, side, id: ATTACH[c.attach] });
      } else {
        const claim = Graph.createEntity({
          name: c.text, types: [T_CLAIM],
          values: [{ property: P_ISFACT, type: "boolean", value: c.factual }],
        });
        ops.push(...claim.ops);
        ops.push(...Graph.createRelation({ fromEntity: claim.id, toEntity: created.articles[c.src], type: P_SOURCES }).ops);
        ops.push(...Graph.createRelation({ fromEntity: prop.id, toEntity: claim.id, type: rel }).ops);
        created.args.push({ prop: p.key, side, id: claim.id });
      }
    }
  }
}

// 🔥 Key claims block, prepended before the current first block
const blk = Graph.createEntity({ name: "🔥 Key claims", types: [T_DATA] });
ops.push(...blk.ops);
ops.push(...Graph.createRelation({ fromEntity: blk.id, toEntity: COLL_SRC, type: DATA_SRC }).ops);
ops.push(...Graph.createRelation({ fromEntity: STABLECOINS, toEntity: blk.id, type: P_BLOCKS, position: Position.generateBetween(null, firstPos) }).ops);
let ip = null;
for (const id of [L0_S1, created.props.yield, created.props.dollar]) {
  ip = Position.generateBetween(ip, null);
  ops.push(...Graph.createRelation({ fromEntity: blk.id, toEntity: id, type: COLL_ITEM, position: ip }).ops);
}
created.keyClaimsBlock = blk.id;

console.log("════════ Stablecoins claim tree ════════");
console.log(`  L0-S1 slotted (live): ${L0_S1}`);
console.log(`  L0-S2 yield: ${created.props.yield} (3 attached + 3 created args)`);
console.log(`  L0-S3 dollar: ${created.props.dollar} (+3🟢/3🔴)`);
console.log(`  articles: ${Object.keys(created.articles).length} · created args: ${created.args.length} · attached: ${created.attached.length}`);
console.log(`  🔥 Key claims block prepended: ${created.keyClaimsBlock}`);
console.log(`  ${ops.length} ops`);
console.log(JSON.stringify(created, null, 2));

if (mode !== "dao") { console.log("\nDRY RUN — no proposal. Re-run with --dao --vote."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Stablecoins claim tree: 2 new layer-0 propositions + args + Key claims block",
  ops, author: MOH, daoSpaceAddress: DAO_ADDR,
  callerSpaceId: `0x${MOH}`, daoSpaceId: `0x${CRYPTO}`, votingMode: "FAST", network: "TESTNET",
});
const tx = await wallet.sendTransaction({ to, data: calldata });
console.log("\nproposalId:", proposalId, "\nproposeTx:", tx);
if (args.includes("--vote")) {
  const pid = String(proposalId).startsWith("0x") ? proposalId : `0x${proposalId}`;
  const v = daoSpace.voteProposal({ authorSpaceId: `0x${MOH}`, spaceId: `0x${CRYPTO}`, proposalId: pid, vote: "YES" });
  const vtx = await wallet.sendTransaction({ to: v.to, data: v.calldata });
  console.log("voteYesTx:", vtx);
}
