// round3-data.mjs — geo-publish block QA, Round 3 (features 9-10: data blocks).
// Adds to the canvas: a Collection block (List view, Description column, explicit row order)
// and a Query block (Bitcoin news, cross-space, Sort by Publish date desc).
//
//   DRY:  bun --env-file=/Users/moh/work-projects/geo/.env run round3-data.mjs
//   PUB:  ...same... round3-data.mjs --dao --vote
import { Graph, Position, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const SPACE    = "5908c73ad336472ccbd983491d2d17e4"; // Crypto datasets (DAO)
const DAO_ADDR = "0xf6B3938c48ADdE5C6570d968533601AcC804479b";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";
const CANVAS   = "b91409f702544bd989619de38f835dbe";
const CRYPTO   = "c9f267dcb0d270718c2a3c45a64afd32";

const T_DATA    = "b8803a8665de412bbb357e0c84adf473";
const P_BLOCKS  = "beaba5cba67741a8b35377030613fc70";
const DATA_SRC  = "1f69cc9880d444abad493df6a7b15ee4";
const COLL_SRC  = "1295037a5d9c4d09b27c5502654b9177";
const QUERY_SRC = "3b069b04adbe4728917d1283fd4ac27e";
const COLL_ITEM = "a99f9ce12ffa4dac8c61f6310d46064a";
const P_VIEW    = "1907fd1c81114a3ca378b1f353425b65";
const P_COLS    = "01412f8381894ab1836565c7fd358cc1";
const V_LIST    = "7d497dba09c249b8968f716bcf520473";
const P_FILTER  = "14a46854bfd14b1882152785c2dab9f3";
const P_SORT    = "46afd0486bb5434e81adab6c7ad1204d";
const P_DESC    = "9b1f76ff9711404c861e59dc3fa7d037";
const P_TYPES   = "8f151ba4de204e3c9cb499ddf96f48f1";
const P_TOPICS  = "806d52bc27e94c9193c057978b093351";
const T_NEWS    = "e550fe517e904b2c8fffdf13408f5634";
const BITCOIN   = "2f8238b2f4c899fb23b4a2f8aabd996c";
const P_PUBDATE = "94e43fe8faf241009eb887ab4f999723";

// explicit REVERSE-ALPHA row order (proves collection order obeys positions, not names)
const ITEMS = [
  "112b4cf87298424984225587b78b7b98", // TIA
  "01ac804200e64bd2ae5994c38f6dd85e", // OpenEden T-Bill vault
  "0b628e6bd77b4723a6151730db5383d9", // DCR
  "107a266cdae5407d8cdab45f19f6fa03", // Credix trade finance pool
];

const ops = [];
let pos = "a79UO"; // last Round-2 block position
const nextPos = () => (pos = Position.generateBetween(pos, null));

function blockRel(blockId, position) {
  const rel = Graph.createRelation({ fromEntity: CANVAS, toEntity: blockId, type: P_BLOCKS, position });
  ops.push(...rel.ops);
  return Buffer.from(rel.ops[0].entity).toString("hex"); // Blocks-relation ENTITY id (Gate-3 target)
}

// 9: collection block — List view, Description column, explicit order
const coll = Graph.createEntity({ name: "🧪 Hand picked tokens (collection QA)", types: [T_DATA] });
ops.push(...coll.ops);
ops.push(...Graph.createRelation({ fromEntity: coll.id, toEntity: COLL_SRC, type: DATA_SRC }).ops);
const collRelEntity = blockRel(coll.id, nextPos());
ops.push(...Graph.createRelation({ fromEntity: collRelEntity, toEntity: V_LIST, type: P_VIEW }).ops);
ops.push(...Graph.createRelation({ fromEntity: collRelEntity, toEntity: P_DESC, type: P_COLS }).ops);
let ip = null;
for (const id of ITEMS) {
  ip = Position.generateBetween(ip, null);
  ops.push(...Graph.createRelation({ fromEntity: coll.id, toEntity: id, type: COLL_ITEM, position: ip }).ops);
}

// 10: query block — Bitcoin news from the crypto space, newest first
const filter = JSON.stringify({
  spaceId: { in: [CRYPTO] },
  filter: { [P_TYPES]: { is: T_NEWS }, [P_TOPICS]: { is: BITCOIN } },
});
const sort = JSON.stringify({ sort_by: P_PUBDATE, sort_direction: "descending" });
const query = Graph.createEntity({
  name: "📰 Bitcoin news (query QA)",
  types: [T_DATA],
  values: [
    { property: P_FILTER, type: "text", value: filter },
    { property: P_SORT, type: "text", value: sort },
  ],
});
ops.push(...query.ops);
ops.push(...Graph.createRelation({ fromEntity: query.id, toEntity: QUERY_SRC, type: DATA_SRC }).ops);
blockRel(query.id, nextPos());

console.log("════ Block QA canvas — Round 3 (data) ════");
console.log(`  collection block: ${coll.id}  (rel-entity ${collRelEntity})`);
console.log(`  query block: ${query.id}`);
console.log(`  filter: ${filter}`);
console.log(`  sort:   ${sort}`);
console.log(`  ${ops.length} ops total`);
if (mode !== "dao") { console.log("\nDRY RUN — re-run with --dao --vote to publish."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Block QA canvas: round 3 data blocks",
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
