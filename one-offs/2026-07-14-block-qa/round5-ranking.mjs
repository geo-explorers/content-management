// round5-ranking.mjs — geo-publish block QA, feature 11 (Ranking block).
// Op shape decoded from Moh's UI-created sample c0fd66e3e68641c1a3c17b4324991299:
//   entity typed Ranking block + Filter value + Aggregation restriction rel + Blocks rel.
//
//   DRY:  bun --env-file=/Users/moh/work-projects/geo/.env run round5-ranking.mjs
//   PUB:  ...same... round5-ranking.mjs --dao --vote
import { Graph, Position, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const SPACE    = "5908c73ad336472ccbd983491d2d17e4";
const DAO_ADDR = "0xf6B3938c48ADdE5C6570d968533601AcC804479b";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";
const CANVAS   = "b91409f702544bd989619de38f835dbe";

const T_RANKING  = "150db6defe2344f0805afa57502e2c32"; // Ranking block type
const P_FILTER   = "14a46854bfd14b1882152785c2dab9f3";
const P_AGG      = "1e4caa2de3314efa8ac24e8d9d3e9fe9"; // Aggregation restriction
const AGG_EDITORS = "10a7b10390f94a728087935052ffaa69"; // "Editors and members"
const P_BLOCKS   = "beaba5cba67741a8b35377030613fc70";
const P_TYPES    = "8f151ba4de204e3c9cb499ddf96f48f1";
const T_TOKEN    = "937b2d16d9394adfa1bf97f58b7a5ec6";

const LAST_POS = "a92Eo"; // current last block (query block)

const filter = JSON.stringify({ spaceId: { in: [SPACE] }, filter: { [P_TYPES]: { is: T_TOKEN } } });
const ops = [];
const rank = Graph.createEntity({
  name: "🏆 Token ranking (ranking QA)",
  types: [T_RANKING],
  values: [{ property: P_FILTER, type: "text", value: filter }],
});
ops.push(...rank.ops);
ops.push(...Graph.createRelation({ fromEntity: rank.id, toEntity: AGG_EDITORS, type: P_AGG }).ops);
ops.push(...Graph.createRelation({ fromEntity: CANVAS, toEntity: rank.id, type: P_BLOCKS, position: Position.generateBetween(LAST_POS, null) }).ops);

console.log("════ Block QA — Ranking block ════");
console.log(`  ranking block: ${rank.id}`);
console.log(`  filter: ${filter}`);
console.log(`  ${ops.length} ops total`);
if (mode !== "dao") { console.log("\nDRY RUN — re-run with --dao --vote to publish."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Block QA canvas: ranking block",
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
