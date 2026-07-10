// edit2.mjs — crypto home "This week's debates" -> refinements:
//   1) rename block "This week's debates" -> "Trending claims"
//   2) switch the block's view from Bullet list -> Gallery (so covers show)
//   3) replace both claim covers with new centered, no-split gallery art
//
//   DRY-RUN: bun --env-file=/Users/moh/work-projects/geo/.env run edit2.mjs
//   EXECUTE: bun --env-file=/Users/moh/work-projects/geo/.env run edit2.mjs --dao --vote

import { readFileSync } from "node:fs";
import { Graph, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const CRYPTO   = "c9f267dcb0d270718c2a3c45a64afd32";
const DAO_ADDR = "0x40230BBf745b3708688347aDe02d04e52eD82f45";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";

const BLOCK       = "1569330be9634035937353f86de57e5d";
const NAME_PROP   = "a126ca530c8e48d5b88882c734c38935";
const NEW_NAME    = "Trending claims";

// view swap
const BLOCKS_REL  = "bad9229ed9d74a6c973cad3bc3ff64d5"; // the Home->block Blocks relation-entity (holds the View)
const VIEW_PROP   = "1907fd1c81114a3ca378b1f353425b65"; // View relation type
const VIEW_OLD    = "48585ec5cffc4bdbb861273963ccc51b"; // current View edge (-> Bullet list view)
const GALLERY     = "ccb70fc917f04a54b86e3b4d20cc7130"; // Gallery view

// cover swap
const P_COVER = "34f535072e6b42c5a84443981a77cfa2";
const CLAIMS = [
  { id: "27fb88183c16449bae71bec7bdb46e50", coverEdge: "8585ffe592424568bd40c03be87bb2bf",
    name: "Open USD debate cover (gallery)",
    png: "/Users/moh/work-projects/geo/tasks/2026-07-07-ousd-stablecoin-debate/cover-gallery.png" },
  { id: "2032aef502284b1daab6b9c25592e646", coverEdge: "3461d2f3893d4359b7697d5df4e8b4e6",
    name: "Bitcoin treasury debate cover (gallery)",
    png: "/Users/moh/work-projects/geo/tasks/2026-07-07-lane-b-bounty-btc-treasury/cover-gallery.png" },
];

const ops = [];

// 1) rename
ops.push(...Graph.updateEntity({ id: BLOCK, values: [{ property: NAME_PROP, type: "text", value: NEW_NAME }] }).ops);

// 2) view: drop Bullet list, add Gallery
ops.push(...Graph.deleteRelation({ id: VIEW_OLD }).ops);
ops.push(...Graph.createRelation({ fromEntity: BLOCKS_REL, toEntity: GALLERY, type: VIEW_PROP }).ops);

// 3) covers: drop old, upload new centered art, attach
const uploaded = [];
for (const c of CLAIMS) {
  ops.push(...Graph.deleteRelation({ id: c.coverEdge }).ops);
  const buf = readFileSync(c.png);
  const img = await Graph.createImage({ blob: new Blob([buf], { type: "image/png" }), name: c.name, network: "TESTNET" });
  ops.push(...img.ops);
  ops.push(...Graph.createRelation({ fromEntity: c.id, toEntity: img.id, type: P_COVER }).ops);
  uploaded.push({ claim: c.id, image: img.id });
}

console.log("════════ crypto home: rename + gallery view + new covers ════════");
console.log(`  rename block -> "${NEW_NAME}"`);
console.log(`  view: Bullet list -> Gallery`);
console.log(`  covers replaced:`);
for (const u of uploaded) console.log(`    claim ${u.claim} <- image ${u.image}`);
console.log(`  ${ops.length} ops total`);

if (mode !== "dao") { console.log("\nDRY RUN — no proposal. Re-run with --dao --vote."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Crypto home: Trending claims (gallery view + centered covers)",
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
