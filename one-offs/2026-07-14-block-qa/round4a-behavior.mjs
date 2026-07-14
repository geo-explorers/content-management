// round4a-behavior.mjs — geo-publish block QA, Round 4a (features 9b + 12).
// View flip on the collection block (List -> Gallery) + move the formula block to the top.
//
//   DRY:  bun --env-file=/Users/moh/work-projects/geo/.env run round4a-behavior.mjs
//   PUB:  ...same... round4a-behavior.mjs --dao --vote
import { Graph, Position, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const SPACE    = "5908c73ad336472ccbd983491d2d17e4";
const DAO_ADDR = "0xf6B3938c48ADdE5C6570d968533601AcC804479b";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";

const P_VIEW      = "1907fd1c81114a3ca378b1f353425b65";
const V_GALLERY   = "ccb70fc917f04a54b86e3b4d20cc7130";
const COLL_REL_ENTITY = "038cec70060c4a9298d29049f9e51f18"; // collection block's Blocks-relation entity
const OLD_VIEW_EDGE   = "db2f20ec60ba44f589be00fe66410320"; // View -> List view (edge id)
const FORMULA_BLOCKS_EDGE = "bf9ca42a626a44a5be3bfbcd147608d1"; // formula block's Blocks relation
const FIRST_POS = "a05Qw"; // current first block position

const ops = [];

// 9b: flip view List -> Gallery (delete old View rel, create new)
ops.push(...Graph.deleteRelation({ id: OLD_VIEW_EDGE }).ops);
ops.push(...Graph.createRelation({ fromEntity: COLL_REL_ENTITY, toEntity: V_GALLERY, type: P_VIEW }).ops);

// 12: move formula block to the top
const newPos = Position.generateBetween(null, FIRST_POS);
ops.push(...Graph.updateRelation({ id: FORMULA_BLOCKS_EDGE, position: newPos }).ops);

console.log("════ Block QA canvas — Round 4a (behavior) ════");
console.log(`  delete View->List edge ${OLD_VIEW_EDGE}`);
console.log(`  create View->Gallery on ${COLL_REL_ENTITY}`);
console.log(`  formula block position -> ${newPos} (before ${FIRST_POS})`);
console.log(`  ${ops.length} ops total`);
if (mode !== "dao") { console.log("\nDRY RUN — re-run with --dao --vote to publish."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Block QA canvas: round 4a view flip + reorder",
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
