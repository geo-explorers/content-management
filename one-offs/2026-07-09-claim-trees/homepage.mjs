// homepage.mjs — crypto home "Trending claims" gallery (1569330b…): append the 5 new layer-0
// propositions after the 2 live ones (7/9 cap) + upload/attach centered-hero covers to each.
//
//   DRY-RUN: bun --env-file=/Users/moh/work-projects/geo/.env run homepage.mjs
//   EXECUTE: ...same... homepage.mjs --dao --vote

import { readFileSync } from "node:fs";
import { Graph, Position, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const CRYPTO   = "c9f267dcb0d270718c2a3c45a64afd32";
const DAO_ADDR = "0x40230BBf745b3708688347aDe02d04e52eD82f45";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";
const ENDPOINT = "https://testnet-api.geobrowser.io/graphql";

const BLOCK     = "1569330be9634035937353f86de57e5d"; // Trending claims (gallery)
const COLL_ITEM = "a99f9ce12ffa4dac8c61f6310d46064a";
const P_COVER   = "34f535072e6b42c5a84443981a77cfa2";

const NEW_ITEMS = [ // order: Bitcoin pair, Stablecoins pair, Ethereum
  { id: "fbaff361aa9642de93d8d74c584f157e", cover: "cover-sbr.png",      name: "Strategic Bitcoin Reserve debate cover" },
  { id: "d93135c85a7c414e8bb8919b359d9754", cover: "cover-sov.png",      name: "Bitcoin vs gold store of value debate cover" },
  { id: "90c9f965984b4024ad5557e3fe2a7914", cover: "cover-yield.png",    name: "Stablecoin yield debate cover" },
  { id: "4cb960bdae604f3cb6b0a6f54e77996e", cover: "cover-dollar.png",   name: "Dollar stablecoins debate cover" },
  { id: "f95df73ab23b4872ac8f8bfee09f6d90", cover: "cover-stewards.png", name: "Ethereum stewardship debate cover" },
];

async function gql(q) {
  const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}
const blk = await gql(`{ entity(id:"${BLOCK}"){ relations(first:30){ nodes{ id type{id} position toEntity{id name} } } } }`);
const items = blk.entity.relations.nodes.filter((n) => n.type.id === COLL_ITEM);
const lastPos = items.map((n) => n.position).filter(Boolean).sort().at(-1) ?? null;
console.log(`existing items: ${items.length} (${items.map((n) => n.toEntity.name?.slice(0, 30)).join(" | ")}), last pos: ${lastPos}`);
if (items.length + NEW_ITEMS.length > 9) { console.error("ABORT: would exceed the 9-item collection page cap"); process.exit(1); }

const ops = [];
const uploaded = [];
let ip = lastPos;
for (const it of NEW_ITEMS) {
  ip = Position.generateBetween(ip, null);
  ops.push(...Graph.createRelation({ fromEntity: BLOCK, toEntity: it.id, type: COLL_ITEM, position: ip }).ops);
  const buf = readFileSync(new URL(`./${it.cover}`, import.meta.url));
  const img = await Graph.createImage({ blob: new Blob([buf], { type: "image/png" }), name: it.name, network: "TESTNET" });
  ops.push(...img.ops);
  ops.push(...Graph.createRelation({ fromEntity: it.id, toEntity: img.id, type: P_COVER }).ops);
  uploaded.push({ claim: it.id, image: img.id });
}

console.log("════════ crypto home: Trending claims += 5 layer-0 propositions ════════");
for (const u of uploaded) console.log(`  ${u.claim} <- cover ${u.image}`);
console.log(`  ${ops.length} ops`);

if (mode !== "dao") { console.log("\nDRY RUN — no proposal. Re-run with --dao --vote."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Crypto home: Trending claims gallery += 5 layer-0 tree propositions with covers",
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
