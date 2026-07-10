// edit.mjs — crypto home: convert the "Trending questions" gallery collection into
// this week's two debate propositions (Claims), per context/DIRECTION.md (debates pivot).
//   1) rename block 1569330b… "Trending questions" -> "This week's debates"
//   2) remove the 3 Question collection-items
//   3) add 2 Claim collection-items (Open USD proposition, then BTC-treasury proposition)
//   4) upload + attach a Cover to each claim (gallery cards were coverless)
//
//   DRY-RUN: bun --env-file=/Users/moh/work-projects/geo/.env run edit.mjs
//   EXECUTE: bun --env-file=/Users/moh/work-projects/geo/.env run edit.mjs --dao --vote

import { readFileSync } from "node:fs";
import { Graph, Position, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const CRYPTO   = "c9f267dcb0d270718c2a3c45a64afd32";
const DAO_ADDR = "0x40230BBf745b3708688347aDe02d04e52eD82f45";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";

const BLOCK     = "1569330be9634035937353f86de57e5d"; // the collection Data block on the home page
const NAME_PROP = "a126ca530c8e48d5b88882c734c38935"; // Name
const COLL_ITEM = "a99f9ce12ffa4dac8c61f6310d46064a"; // Collection item relation type
const P_COVER   = "34f535072e6b42c5a84443981a77cfa2"; // Cover relation
const NEW_NAME  = "This week's debates";

// Collection-item edges to remove (the 3 Questions currently in the table)
const REMOVE = [
  "51d997548e82471a8b3bc41fb121cbbd", // Is the Ethereum Foundation's refocus maturation, or decline?
  "ca62ab2e195f472cbf9fab631a45d752", // Is Ethereum's position against Bitcoin structurally weakening…?
  "e81280b0b74e4b62885cf3c43c0a079e", // Does Ethereum's multi-node future strengthen or fragment…?
];

// The two proposition Claims to feature this week (order = gallery order), + their cover PNGs
const CLAIMS = [
  { id: "27fb88183c16449bae71bec7bdb46e50", // Open USD consortium will dethrone single-issuer stablecoins
    name: "Open USD debate cover",
    cover: "/Users/moh/work-projects/geo/tasks/2026-07-07-ousd-stablecoin-debate/cover.png" },
  { id: "2032aef502284b1daab6b9c25592e646", // Bitcoin treasury companies are a fragile financing trade
    name: "Bitcoin treasury debate cover",
    cover: "/Users/moh/work-projects/geo/tasks/2026-07-07-lane-b-bounty-btc-treasury/cover.png" },
];

const ops = [];

// 1) rename the block
ops.push(...Graph.updateEntity({ id: BLOCK, values: [{ property: NAME_PROP, type: "text", value: NEW_NAME }] }).ops);

// 2) remove the 3 Question collection-items
for (const e of REMOVE) ops.push(...Graph.deleteRelation({ id: e }).ops);

// 3) add the 2 Claim collection-items (sequential positions)
let ip = null;
for (const c of CLAIMS) {
  ip = Position.generateBetween(ip, null);
  ops.push(...Graph.createRelation({ fromEntity: BLOCK, toEntity: c.id, type: COLL_ITEM, position: ip }).ops);
}

// 4) upload + attach a Cover to each claim (createImage ops must be in the same proposal)
const uploaded = [];
for (const c of CLAIMS) {
  const buf = readFileSync(c.cover);
  const img = await Graph.createImage({ blob: new Blob([buf], { type: "image/png" }), name: c.name, network: "TESTNET" });
  ops.push(...img.ops);
  ops.push(...Graph.createRelation({ fromEntity: c.id, toEntity: img.id, type: P_COVER }).ops);
  uploaded.push({ claim: c.id, image: img.id });
}

console.log("════════ crypto home: Trending questions -> This week's debates ════════");
console.log(`  rename block ${BLOCK} -> "${NEW_NAME}"`);
console.log(`  remove ${REMOVE.length} Question collection-items`);
console.log(`  add ${CLAIMS.length} Claim collection-items: ${CLAIMS.map(c => c.id).join(", ")}`);
console.log(`  covers uploaded + attached:`);
for (const u of uploaded) console.log(`    claim ${u.claim} <- image ${u.image}`);
console.log(`  ${ops.length} ops total`);

if (mode !== "dao") { console.log("\nDRY RUN — no proposal. Re-run with --dao --vote."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Crypto home: This week's debates (Trending questions -> 2 proposition claims + covers)",
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
