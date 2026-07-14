// round6-image-repair.mjs — repair the two broken images (bad-fetch HTML uploads).
// Uploads validated PNG bytes (CoinGecko Bitcoin logo, checked with `file`) via Ipfs.uploadImage,
// then updates the EXISTING image entities in place (IPFS URL + width/height). Relations untouched.
//
//   DRY:  bun --env-file=/Users/moh/work-projects/geo/.env run round6-image-repair.mjs
//   PUB:  ...same... round6-image-repair.mjs --dao --vote
import { Graph, Ipfs, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const SPACE    = "5908c73ad336472ccbd983491d2d17e4";
const DAO_ADDR = "0xf6B3938c48ADdE5C6570d968533601AcC804479b";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";

const IMG_BLOCK_ENTITY = "9b15e8dd8f464598a28ea28478e1e43a"; // Bitcoin logo (QA image block)
const AVATAR_ENTITY    = "0148e4c4a5084c0bb88a3f7be52fba97"; // QA canvas avatar
const P_IPFSURL = "8a743832c0944a62b6650c3cc2f9c7bc";
const P_WIDTH   = "f7b33e08b76d4190aadacadaa9f561e1";
const P_HEIGHT  = "7f6ad0433e214257a6d48bdad36b1d84";

const PNG = "/private/tmp/claude-501/-Users-moh-work-projects-geo/e431850a-e64b-405f-afcc-fb4bad7da245/scratchpad/bitcoin-logo.png";
const bytes = readFileSync(PNG);
if (!(bytes[0] === 0x89 && bytes[1] === 0x50)) throw new Error("not a PNG — aborting (validate the source!)");
const blob = new Blob([bytes], { type: "image/png" });

console.log(`uploading validated PNG (${bytes.length} bytes) to IPFS...`);
const { cid, dimensions } = await Ipfs.uploadImage({ blob }, "TESTNET", true);
if (!dimensions?.width) throw new Error("imageSize failed — refusing to publish a dimensionless image");
console.log(`  cid: ${cid}  dimensions: ${dimensions.width}x${dimensions.height}`);

const values = [
  { property: P_IPFSURL, type: "text", value: cid },
  { property: P_WIDTH, type: "float", value: dimensions.width },
  { property: P_HEIGHT, type: "float", value: dimensions.height },
];
const ops = [];
ops.push(...Graph.updateEntity({ id: IMG_BLOCK_ENTITY, values }).ops);
ops.push(...Graph.updateEntity({ id: AVATAR_ENTITY, values }).ops);

console.log(`════ Block QA — image repair ════`);
console.log(`  image block ${IMG_BLOCK_ENTITY} + avatar ${AVATAR_ENTITY} -> ${cid}`);
console.log(`  ${ops.length} ops total (in-place updates, relations untouched)`);
if (mode !== "dao") { console.log("\nDRY RUN — re-run with --dao --vote to publish."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Block QA canvas: repair broken image block + avatar (validated bytes)",
  ops, author: MOH, daoSpaceAddress: DAO_ADDR,
  callerSpaceId: `0x${MOH}`, daoSpaceId: `0x${SPACE}`, votingMode: "FAST", network: "TESTNET",
});
const tx = await wallet.sendTransaction({ to, data: calldata });
console.log("\nproposalId:", proposalId, "\nproposeTx:", tx);
if (args.includes("--vote")) {
  const pid = String(proposalId).startsWith("0x") ? proposalId : `0x${proposalId}`;
  const v = daoSpace.voteProposal({ authorSpaceId: `0x${MOH}`, spaceId: `0x${SPACE}`, proposalId: pid, vote: "YES" });
  const vtx = await wallet.sendTransaction({ to: v.to, data: v.calldata });
  console.log("voteYesTx:", vtx);
}
