// bitcoin.mjs — claim tree for the Bitcoin static topic (pilot, spec: tasks/2026-07-09-claim-architecture/claim-architecture.md)
//   L0-B1 (live, slot as-is): 2032aef5… "Bitcoin treasury companies are a fragile financing trade…" (Topics -> Bitcoin ✓ verified)
//   L0-B2 (create): "The US government should hold a Strategic Bitcoin Reserve" + 3🟢/3🔴 args
//   L0-B3 (create): "Bitcoin is a better store of value than gold" + 3🟢/4🔴 args
//   Topic page: "🔥 Key claims" collection block (B1, B2, B3). Bitcoin topic has no front blocks yet.
//
//   DRY-RUN: bun --env-file=/Users/moh/work-projects/geo/.env run bitcoin.mjs
//   EXECUTE: ...same... bitcoin.mjs --dao --vote

import { Graph, Position, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const CRYPTO   = "c9f267dcb0d270718c2a3c45a64afd32";
const DAO_ADDR = "0x40230BBf745b3708688347aDe02d04e52eD82f45";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";

// types / relations / props
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

// existing entities
const BITCOIN_TOPIC = "2f8238b2f4c899fb23b4a2f8aabd996c"; // canonical (dup 1b49933a… pending merge elsewhere)
const L0_B1         = "2032aef502284b1daab6b9c25592e646"; // live proposition, slot as-is

// new source Articles (dedup by URL within this script; verified absent as claims in-space)
const SOURCES = {
  cryptonews: { name: "President Trump's bitcoin reserve plan stalls as agencies debate control", url: "https://crypto.news/president-trumps-bitcoin-reserve-plan-stalls-as-agencies-debate-control/" },
  btcmag:     { name: "The United States Is Going To Buy Bitcoin", url: "https://bitcoinmagazine.com/news/the-united-states-is-going-to-buy-bitcoin" },
  gemini:     { name: "Unpacking the Debate Over a Strategic Bitcoin Reserve", url: "https://www.gemini.com/blog/unpacking-the-debate-over-a-strategic-bitcoin-reserve" },
  theblock:   { name: "What is the U.S. Strategic Bitcoin Reserve?", url: "https://www.theblock.co/learn/407371/what-is-the-u-s-strategic-bitcoin-reserve" },
  ledger:     { name: "Bitcoin Vs Gold: Which Is a Better Store of Value in 2026?", url: "https://www.ledger.com/academy/topics/economics-and-regulation/bitcoin-vs-gold" },
  forbes:     { name: "Gold, Bitcoin, And The New Safe-Haven Playbook", url: "https://www.forbes.com/sites/jasonkirsch/2026/06/17/gold-bitcoin-and-the-new-safe-haven-playbook/" },
  btcc:       { name: "Bitcoin vs Gold: Which Store of Value Fits Different Investors?", url: "https://www.btcc.com/en-US/academy/commodity-fx-academy/commodity/bitcoin-vs-gold-which-store-of-value-fits-different-investors" },
  investing:  { name: "Gold vs. Bitcoin in 2026: Which 'Safe Haven' Is Actually Delivering?", url: "https://www.investing.com/analysis/gold-vs-bitcoin-in-2026-which-safe-haven-is-actually-delivering-200679952" },
  rwatimes:   { name: "Is Gold Better Than Bitcoin? Macroeconomic Performance Metrics Analyzed", url: "https://rwatimes.substack.com/p/is-gold-better-than-bitcoin-macroeconomic" },
  vtmarkets:  { name: "Gold vs Bitcoin: Which is the Better Store of Value?", url: "https://www.vtmarkets.com/ph/featured/gold-vs-bitcoin-which-is-the-better-store-of-value/" },
};

// the two new propositions
const PROPS = [
  {
    key: "sbr",
    name: "The US government should hold a Strategic Bitcoin Reserve",
    desc: "The proposition anchoring this debate: the United States should hold Bitcoin as a strategic reserve asset alongside gold. Supporters point to the digital gold case and the cost of past government sales. Skeptics argue a reserve has no monetary use case for a fiat issuer and politicizes a neutral asset.",
    supporting: [
      { text: "The White House is expected to publish its Strategic Bitcoin Reserve framework by July 22, 2026.", factual: true,  src: "cryptonews" },
      { text: "Bitcoin can serve the United States as digital gold alongside traditional reserve assets.", factual: false, src: "btcmag" },
      { text: "Germany's 2024 sale of nearly 50,000 seized Bitcoin left roughly 2 billion dollars of gains on the table.", factual: true, src: "gemini" },
    ],
    opposing: [
      { text: "Senator Elizabeth Warren has called a US Strategic Bitcoin Reserve a giveaway to crypto speculators.", factual: true, src: "gemini" },
      { text: "A government that issues the world's reserve currency has no monetary use case for holding Bitcoin.", factual: false, src: "theblock" },
      { text: "A government Bitcoin reserve politicizes a neutral asset and puts the state in the business of picking winners.", factual: false, src: "gemini" },
    ],
  },
  {
    key: "sov",
    name: "Bitcoin is a better store of value than gold",
    desc: "The proposition anchoring this debate: Bitcoin's fixed supply and digital scarcity make it a better long-term store of value than gold. Supporters cite inflation resistance and deepening institutional adoption. Skeptics point to volatility several times that of gold, deep drawdowns, and central banks that keep buying gold, not Bitcoin.",
    supporting: [
      { text: "Bitcoin's fixed 21 million supply gives it structural inflation resistance no commodity can match.", factual: false, src: "ledger" },
      { text: "Deepening institutional adoption gives Bitcoin asymmetric upside that gold cannot offer.", factual: false, src: "forbes" },
      { text: "Digital scarcity is portable, divisible, and verifiable in ways physical gold is not.", factual: false, src: "btcc" },
    ],
    opposing: [
      { text: "Bitcoin's annualized volatility runs at roughly 70 to 80 percent, against 15 to 20 percent for gold.", factual: true, src: "investing" },
      { text: "In the first 48 hours of the 2026 Iran conflict gold rose 5.2 percent while Bitcoin fell 12 percent.", factual: true, src: "investing" },
      { text: "Central banks have bought over 1,000 tonnes of gold per year for three consecutive years, with no equivalent flow into Bitcoin.", factual: true, src: "rwatimes" },
      { text: "Drawdowns of 50 to 80 percent mean Bitcoin fails the core store of value mandate of preserving purchasing power.", factual: false, src: "vtmarkets" },
    ],
  },
];

const ops = [];
const created = { articles: {}, props: {}, args: [] };

// 1) source Articles (one entity per unique URL)
for (const [k, s] of Object.entries(SOURCES)) {
  const a = Graph.createEntity({ name: s.name, types: [T_ARTICLE], values: [{ property: P_WEBURL, type: "text", value: s.url }] });
  ops.push(...a.ops);
  created.articles[k] = a.id;
}

// 2) propositions + argument claims
for (const p of PROPS) {
  const prop = Graph.createEntity({
    name: p.name, description: p.desc, types: [T_CLAIM],
    values: [{ property: P_ISFACT, type: "boolean", value: false }],
  });
  ops.push(...prop.ops);
  created.props[p.key] = prop.id;
  ops.push(...Graph.createRelation({ fromEntity: prop.id, toEntity: BITCOIN_TOPIC, type: P_TOPICS }).ops);

  for (const [side, rel] of [["supporting", P_SUPPORTING], ["opposing", P_OPPOSING]]) {
    for (const c of p[side]) {
      const claim = Graph.createEntity({
        name: c.text, types: [T_CLAIM],
        values: [{ property: P_ISFACT, type: "boolean", value: c.factual }],
      });
      ops.push(...claim.ops);
      ops.push(...Graph.createRelation({ fromEntity: claim.id, toEntity: created.articles[c.src], type: P_SOURCES }).ops);
      ops.push(...Graph.createRelation({ fromEntity: prop.id, toEntity: claim.id, type: rel }).ops);
      created.args.push({ prop: p.key, side, id: claim.id, factual: c.factual });
    }
  }
}

// 3) 🔥 Key claims collection block on the Bitcoin topic page (no existing front blocks)
const blk = Graph.createEntity({ name: "🔥 Key claims", types: [T_DATA] });
ops.push(...blk.ops);
ops.push(...Graph.createRelation({ fromEntity: blk.id, toEntity: COLL_SRC, type: DATA_SRC }).ops);
ops.push(...Graph.createRelation({ fromEntity: BITCOIN_TOPIC, toEntity: blk.id, type: P_BLOCKS, position: Position.generateBetween(null, null) }).ops);
let ip = null;
for (const id of [L0_B1, created.props.sbr, created.props.sov]) {
  ip = Position.generateBetween(ip, null);
  ops.push(...Graph.createRelation({ fromEntity: blk.id, toEntity: id, type: COLL_ITEM, position: ip }).ops);
}
created.keyClaimsBlock = blk.id;

console.log("════════ Bitcoin claim tree ════════");
console.log(`  L0-B1 slotted (live): ${L0_B1}`);
console.log(`  L0-B2 SBR: ${created.props.sbr} (+3🟢/3🔴)`);
console.log(`  L0-B3 store-of-value: ${created.props.sov} (+3🟢/4🔴)`);
console.log(`  articles: ${Object.keys(created.articles).length} · args: ${created.args.length}`);
console.log(`  🔥 Key claims block on topic: ${created.keyClaimsBlock} (3 items)`);
console.log(`  ${ops.length} ops`);
console.log(JSON.stringify(created, null, 2));

if (mode !== "dao") { console.log("\nDRY RUN — no proposal. Re-run with --dao --vote."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Bitcoin claim tree: 2 new layer-0 propositions + args + Key claims block",
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
