// round2-media.mjs — geo-publish block QA, Round 2 (features 6-8: media).
// Adds to the existing canvas: image block, 2 video blocks (YouTube + direct mp4), cover, avatar.
//
//   DRY:  bun --env-file=/Users/moh/work-projects/geo/.env run round2-media.mjs
//   PUB:  ...same... round2-media.mjs --dao --vote
import { Graph, Position, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const SPACE    = "5908c73ad336472ccbd983491d2d17e4"; // Crypto datasets (DAO)
const DAO_ADDR = "0xf6B3938c48ADdE5C6570d968533601AcC804479b";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";
const CANVAS   = "b91409f702544bd989619de38f835dbe"; // pinned from Round 1

const T_VIDEO  = "d7a4817c9795405b93e212df759c43f8";
const P_IPFSURL = "8a743832c0944a62b6650c3cc2f9c7bc";
const P_BLOCKS = "beaba5cba67741a8b35377030613fc70";
const P_COVER  = "34f535072e6b42c5a84443981a77cfa2";
const P_AVATAR = "1155befffad549b7a2e0da4777b8792c";

const LAST_R1_POS = "a49gw"; // last block position from Round 1 (formula probe)

const IMG_BITCOIN = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/240px-Bitcoin.svg.png";
const IMG_COVER   = "https://picsum.photos/id/1041/1500/500";
const VID_YOUTUBE = "https://www.youtube.com/watch?v=Gc2en3nHxA4"; // "Bitcoin explained" style short
const VID_MP4     = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"; // MDN CC0 sample

const ops = [];
let pos = LAST_R1_POS;
const nextPos = () => (pos = Position.generateBetween(pos, null));

// 6: image block — createImage (IPFS upload) + Blocks relation
console.log("uploading image block asset to IPFS...");
const img = await Graph.createImage({ url: IMG_BITCOIN, name: "Bitcoin logo (QA image block)", network: "TESTNET" });
ops.push(...img.ops);
ops.push(...Graph.createRelation({ fromEntity: CANVAS, toEntity: img.id, type: P_BLOCKS, position: nextPos() }).ops);

// 7a: video block — YouTube URL (editor-paste behavior)
const vidYt = Graph.createEntity({
  name: "QA video block (YouTube URL)",
  types: [T_VIDEO],
  values: [{ property: P_IPFSURL, type: "text", value: VID_YOUTUBE }],
});
ops.push(...vidYt.ops);
ops.push(...Graph.createRelation({ fromEntity: CANVAS, toEntity: vidYt.id, type: P_BLOCKS, position: nextPos() }).ops);

// 7b: video block — direct mp4
const vidMp4 = Graph.createEntity({
  name: "QA video block (direct mp4)",
  types: [T_VIDEO],
  values: [{ property: P_IPFSURL, type: "text", value: VID_MP4 }],
});
ops.push(...vidMp4.ops);
ops.push(...Graph.createRelation({ fromEntity: CANVAS, toEntity: vidMp4.id, type: P_BLOCKS, position: nextPos() }).ops);

// 8: cover + avatar
console.log("uploading cover asset to IPFS...");
const cover = await Graph.createImage({ url: IMG_COVER, name: "QA canvas cover", network: "TESTNET" });
ops.push(...cover.ops);
ops.push(...Graph.createRelation({ fromEntity: CANVAS, toEntity: cover.id, type: P_COVER }).ops);

console.log("uploading avatar asset to IPFS...");
const avatar = await Graph.createImage({ url: IMG_BITCOIN, name: "QA canvas avatar", network: "TESTNET" });
ops.push(...avatar.ops);
ops.push(...Graph.createRelation({ fromEntity: CANVAS, toEntity: avatar.id, type: P_AVATAR }).ops);

console.log("════ Block QA canvas — Round 2 (media) ════");
console.log(`  canvas: ${CANVAS}`);
console.log(`  image block: ${img.id}`);
console.log(`  video blocks: yt=${vidYt.id} mp4=${vidMp4.id}`);
console.log(`  cover: ${cover.id}  avatar: ${avatar.id}`);
console.log(`  ${ops.length} ops total`);
if (mode !== "dao") { console.log("\nDRY RUN — re-run with --dao --vote to publish."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Block QA canvas: round 2 media blocks",
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
