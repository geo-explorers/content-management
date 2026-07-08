// Crypto home page "Trending pages" collection (block 0b3e509f…):
// remove the Ethlabs item. Deletes ONLY the Collection-item relation edge
// c2d5f11f… — the Ethlabs entity (d7640227…) itself is untouched.
// Crypto DAO (FAST + YES vote).
//   bun --env-file=/Users/moh/work-projects/geo/.env <this> [--dry-run]
import { Graph, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const DRY = process.argv.includes("--dry-run");

const AUTHOR = "4cd9cca5530b69056aead853c8088e7e";
const DAO_ADDRESS = "0x40230BBf745b3708688347aDe02d04e52eD82f45";
const CALLER_SPACE = "0x4cd9cca5530b69056aead853c8088e7e";
const DAO_SPACE = "0xc9f267dcb0d270718c2a3c45a64afd32";

const ETHLABS_ITEM_REL = "c2d5f11fcbaf40e6860a4f16231cd507"; // Collection item -> Ethlabs

const { ops } = Graph.deleteRelation({ id: ETHLABS_ITEM_REL });
console.log(`Built ${ops.length} op (delete Collection-item relation).`);
if (DRY) { console.log(JSON.stringify(ops, null, 2)); console.log("DRY RUN — nothing submitted."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY;
if (!raw) throw new Error("GEO_PRIVATE_KEY not set.");
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });

const proposal = await daoSpace.proposeEdit({
  name: "Crypto home: remove Ethlabs from Trending pages collection",
  ops,
  author: AUTHOR,
  daoSpaceAddress: DAO_ADDRESS,
  callerSpaceId: CALLER_SPACE,
  daoSpaceId: DAO_SPACE,
  votingMode: "FAST",
  network: "TESTNET",
});
const proposeTx = await wallet.sendTransaction({ to: proposal.to, data: proposal.calldata });
console.log("proposalId:", proposal.proposalId);
console.log("propose tx:", proposeTx);

const vote = await daoSpace.voteProposal({ authorSpaceId: CALLER_SPACE, spaceId: DAO_SPACE, proposalId: proposal.proposalId, vote: "YES" });
const voteTx = await wallet.sendTransaction({ to: vote.to, data: vote.calldata });
console.log("vote tx (YES):", voteTx);
console.log("DONE.");
