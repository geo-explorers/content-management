// ethereum.mjs — claim tree + page development for the Ethereum topic (topic #7, approved 2026-07-09;
//   flag to Arturas at next sync). Spec: tasks/2026-07-09-claim-architecture/claim-architecture.md
//   L0-E1 (create): "Ethereum is stronger with multiple competing steward organizations than with one Foundation" + 3🟢/3🔴
//   L0-E2 (enrich): 0df40ad2… ETH-vs-BTC proposition (already 4🟢/4🔴 from 07-01 build) — add Is factual?=false,
//                   Description, Topics -> Ethereum.
//   Re-home: 3 curated Questions get Topics -> Ethereum (poll layer; feeds the Open debates query block).
//   Topic page: "🔥 Key claims" collection block + "❓ Open debates" query block (page has only a News tab today).
//
//   DRY-RUN: bun --env-file=/Users/moh/work-projects/geo/.env run ethereum.mjs
//   EXECUTE: ...same... ethereum.mjs --dao --vote

import { Graph, Position, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const CRYPTO   = "c9f267dcb0d270718c2a3c45a64afd32";
const DAO_ADDR = "0x40230BBf745b3708688347aDe02d04e52eD82f45";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";

const T_CLAIM      = "96f859efa1ca4b229372c86ad58b694b";
const T_ARTICLE    = "a2a5ed0cacef46b1835de457956ce915";
const T_DATA       = "b8803a8665de412bbb357e0c84adf473";
const T_QUESTION   = "4318a1d2c441455cb76544049c45e6cf";
const P_TOPICS     = "806d52bc27e94c9193c057978b093351";
const P_SOURCES    = "49c5d5e1679a4dbdbfd33f618f227c94";
const P_WEBURL     = "412ff593e9154012a43d4c27ec5c68b6";
const P_SUPPORTING = "1dc6a843458848198e7a6e672268f811";
const P_OPPOSING   = "4e6ec5d14292498a84e5f607ca1a08ce";
const P_ISFACT     = "da4a6c1f9d4446f9832ff3b49a4400ef";
const P_DESC       = "9b1f76ff9711404c861e59dc3fa7d037";
const P_BLOCKS     = "beaba5cba67741a8b35377030613fc70";
const P_FILTER     = "14a46854bfd14b1882152785c2dab9f3";
const P_TYPESF     = "8f151ba4de204e3c9cb499ddf96f48f1";
const DATA_SRC     = "1f69cc9880d444abad493df6a7b15ee4";
const COLL_SRC     = "1295037a5d9c4d09b27c5502654b9177";
const COLL_ITEM    = "a99f9ce12ffa4dac8c61f6310d46064a";
const QUERY_SRC    = "3b069b04adbe4728917d1283fd4ac27e";

const ETH_TOPIC = "111ba8e579284514aedb3fc1b82eed9f";
const L0_E2     = "0df40ad2e07542fcb5dc605b21c0d8c8"; // existing ETH-vs-BTC proposition (enrich)
const QUESTIONS = [
  "d79139fafc1343828e90a5daf4ac7a13", // ETH vs BTC structural position
  "6381c1230886460788cfaa92527e1443", // EF refocus: maturation or decline
  "eab540d8987141dea765615bddb08c18", // ETH multi-node future
];

const E2_DESC = "The proposition anchoring this debate: Ethereum's competitive position against Bitcoin is weakening at the level of fundamentals, not price. Supporters point to Layer 2 fee leakage and Bitcoin's clearer institutional role. Opponents cite Ethereum's developer base, stablecoin settlement dominance, staking economics, and real world asset share.";

const SOURCES = {
  tradingview: { name: "Ethereum Foundation Returns to Spotlight Amid Governance and Culture Tensions", url: "https://www.tradingview.com/news/cryptonews:d66a1fd9b094b:0-ethereum-foundation-returns-to-spotlight-amid-governance-and-culture-tensions/" },
  coindesk_labs: { name: "EthLabs Launches as Ethereum Undergoes Its Biggest Leadership Transition in Years", url: "https://www.coindesk.com/tech/2026/07/01/ethlabs-launches-as-ethereum-undergoes-its-biggest-leadership-transition-in-years" },
  techtimes:  { name: "EthLabs Backers Admit Ethereum's New Research Lab Will Compete With Foundation, Not Just Help It", url: "https://www.techtimes.com/articles/319362/20260630/ethlabs-backers-admit-ethereums-new-research-lab-will-compete-foundation-not-just-help-it.htm" },
  coindesk_gap: { name: "Former Ethereum Foundation Leader Warns of Funding Gap as Governance Shifts", url: "https://www.coindesk.com/markets/2026/06/26/former-ethereum-foundation-leader-warns-of-funding-gap-as-governance-shifts" },
  cryptodaily: { name: "Ethereum Foundation Exodus Governance Risk", url: "https://cryptodaily.co.uk/2026/06/ethereum-foundation-exodus-governance-risk" },
};

const E1 = {
  name: "Ethereum is stronger with multiple competing steward organizations than with one Foundation",
  desc: "The proposition anchoring the stewardship debate after the Foundation's 2026 restructuring and the launch of new research and institutional nonprofits. Supporters see resilience in a multi node ecosystem. Opponents warn of core developer funding gaps and governance fragmentation.",
  supporting: [
    { text: "Vitalik Buterin describes the Ethereum Foundation as one node among nodes rather than the center of the ecosystem.", factual: true, src: "tradingview" },
    { text: "EthLabs launched in July 2026 as Ethereum underwent its biggest leadership transition in years.", factual: true, src: "coindesk_labs" },
    { text: "The densest concentration of Ethereum research talent now sits at EthLabs rather than at the Foundation.", factual: true, src: "techtimes" },
  ],
  opposing: [
    { text: "A former Ethereum Foundation leader warns of a core developer funding gap within three to nine months as governance shifts.", factual: true, src: "coindesk_gap" },
    { text: "Splintering stewardship across competing organizations creates governance risk for Ethereum's roadmap.", factual: false, src: "cryptodaily" },
    { text: "EthLabs backers concede the new lab will compete with the Ethereum Foundation, not just help it.", factual: true, src: "techtimes" },
  ],
};

const ops = [];
const created = { articles: {}, args: [] };

// 1) source Articles
for (const [k, s] of Object.entries(SOURCES)) {
  const a = Graph.createEntity({ name: s.name, types: [T_ARTICLE], values: [{ property: P_WEBURL, type: "text", value: s.url }] });
  ops.push(...a.ops);
  created.articles[k] = a.id;
}

// 2) L0-E1 create + args
const e1 = Graph.createEntity({
  name: E1.name, description: E1.desc, types: [T_CLAIM],
  values: [{ property: P_ISFACT, type: "boolean", value: false }],
});
ops.push(...e1.ops);
created.e1 = e1.id;
ops.push(...Graph.createRelation({ fromEntity: e1.id, toEntity: ETH_TOPIC, type: P_TOPICS }).ops);
for (const [side, rel] of [["supporting", P_SUPPORTING], ["opposing", P_OPPOSING]]) {
  for (const c of E1[side]) {
    const claim = Graph.createEntity({
      name: c.text, types: [T_CLAIM],
      values: [{ property: P_ISFACT, type: "boolean", value: c.factual }],
    });
    ops.push(...claim.ops);
    ops.push(...Graph.createRelation({ fromEntity: claim.id, toEntity: created.articles[c.src], type: P_SOURCES }).ops);
    ops.push(...Graph.createRelation({ fromEntity: e1.id, toEntity: claim.id, type: rel }).ops);
    created.args.push({ side, id: claim.id });
  }
}

// 3) L0-E2 enrich: Is factual?=false + Description + Topics -> Ethereum
ops.push(...Graph.updateEntity({ id: L0_E2, values: [
  { property: P_ISFACT, type: "boolean", value: false },
  { property: P_DESC, type: "text", value: E2_DESC },
] }).ops);
ops.push(...Graph.createRelation({ fromEntity: L0_E2, toEntity: ETH_TOPIC, type: P_TOPICS }).ops);

// 4) re-home the 3 curated Questions: Topics -> Ethereum
for (const qid of QUESTIONS) ops.push(...Graph.createRelation({ fromEntity: qid, toEntity: ETH_TOPIC, type: P_TOPICS }).ops);

// 5) topic page: 🔥 Key claims collection + ❓ Open debates query block (no existing front blocks)
const chains = {};
const nextPos = (host) => { const p = Position.generateBetween(chains[host] ?? null, null); chains[host] = p; return p; };

const blk = Graph.createEntity({ name: "🔥 Key claims", types: [T_DATA] });
ops.push(...blk.ops);
ops.push(...Graph.createRelation({ fromEntity: blk.id, toEntity: COLL_SRC, type: DATA_SRC }).ops);
ops.push(...Graph.createRelation({ fromEntity: ETH_TOPIC, toEntity: blk.id, type: P_BLOCKS, position: nextPos(ETH_TOPIC) }).ops);
let ip = null;
for (const id of [created.e1, L0_E2]) {
  ip = Position.generateBetween(ip, null);
  ops.push(...Graph.createRelation({ fromEntity: blk.id, toEntity: id, type: COLL_ITEM, position: ip }).ops);
}
created.keyClaimsBlock = blk.id;

const filter = { spaceId: { in: [CRYPTO] }, filter: { [P_TYPESF]: { is: T_QUESTION }, [P_TOPICS]: { is: ETH_TOPIC } } };
const qb = Graph.createEntity({ name: "❓ Open debates", types: [T_DATA], values: [{ property: P_FILTER, type: "text", value: JSON.stringify(filter) }] });
ops.push(...qb.ops);
ops.push(...Graph.createRelation({ fromEntity: qb.id, toEntity: QUERY_SRC, type: DATA_SRC }).ops);
ops.push(...Graph.createRelation({ fromEntity: ETH_TOPIC, toEntity: qb.id, type: P_BLOCKS, position: nextPos(ETH_TOPIC) }).ops);
created.openDebatesBlock = qb.id;

console.log("════════ Ethereum claim tree + page ════════");
console.log(`  L0-E1 stewards: ${created.e1} (+3🟢/3🔴)`);
console.log(`  L0-E2 enriched (existing): ${L0_E2} (Is factual=false + desc + Topics)`);
console.log(`  3 Questions re-homed: Topics -> Ethereum`);
console.log(`  blocks: 🔥 Key claims ${created.keyClaimsBlock} (2 items) · ❓ Open debates ${created.openDebatesBlock} (query)`);
console.log(`  articles: ${Object.keys(created.articles).length} · created args: ${created.args.length}`);
console.log(`  ${ops.length} ops`);
console.log(JSON.stringify(created, null, 2));

if (mode !== "dao") { console.log("\nDRY RUN — no proposal. Re-run with --dao --vote."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Ethereum claim tree: stewards proposition + ETH-vs-BTC enrich + Key claims and Open debates blocks",
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
