// Crypto home page (0fcd62b5…): rename two data blocks + swap their positions.
//   Trending  -> "Trending pages"      (block 0b3e509f…, Blocks-rel edge 7cf9c895…)
//   Debates   -> "Trending questions"  (block 1569330b…, Blocks-rel edge 113dcad6…)
// Swap slots: Trending's rel a0AiB<->a0XFZ Debates's rel. Crypto DAO (FAST + YES vote).
//   bun --env-file=/Users/moh/work-projects/geo/.env <this> [--dry-run]
import { Graph, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const DRY = process.argv.includes("--dry-run");

// --- crypto DAO publish identity (from spaces/crypto/CLAUDE.md) ---
const AUTHOR = "4cd9cca5530b69056aead853c8088e7e";
const DAO_ADDRESS = "0x40230BBf745b3708688347aDe02d04e52eD82f45";
const CALLER_SPACE = "0x4cd9cca5530b69056aead853c8088e7e"; // personal space bytes16
const DAO_SPACE = "0xc9f267dcb0d270718c2a3c45a64afd32";     // crypto space bytes16

// --- targets ---
const TRENDING_BLOCK = "0b3e509fbf874db591181eecff8dfb88";
const DEBATES_BLOCK = "1569330be9634035937353f86de57e5d";
const TRENDING_REL = "7cf9c895183f45428c56a83f18bd2ce9"; // edge id, currently a0AiB (slot 1)
const DEBATES_REL = "113dcad6df0d4eacbfe9f07aa9bb8a46";  // edge id, currently a0XFZ (slot 4)
// Move both to the top: Trending questions -> a0AiB (slot 1),
// Trending pages -> a0g5v (between a0AiB and Submission's a0nZi = slot 2).
// Submission/Curator/Latest untouched.
const POS_QUESTIONS_TOP = "a0AiB";
const POS_PAGES_SECOND = "a0g5v";

const allOps = [];
// 1) renames
allOps.push(...Graph.updateEntity({ id: TRENDING_BLOCK, name: "Trending pages" }).ops);
allOps.push(...Graph.updateEntity({ id: DEBATES_BLOCK, name: "Trending questions" }).ops);
// 2) reposition both to the top
allOps.push(...Graph.updateRelation({ id: DEBATES_REL, position: POS_QUESTIONS_TOP }).ops);   // Trending questions -> slot 1
allOps.push(...Graph.updateRelation({ id: TRENDING_REL, position: POS_PAGES_SECOND }).ops);   // Trending pages -> slot 2

console.log(`Built ${allOps.length} ops (2 renames + 2 position swaps).`);
if (DRY) {
  console.log(JSON.stringify(allOps, null, 2));
  console.log("DRY RUN — nothing submitted.");
  process.exit(0);
}

const raw = process.env.GEO_PRIVATE_KEY;
if (!raw) throw new Error("GEO_PRIVATE_KEY not set.");
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });

const proposal = await daoSpace.proposeEdit({
  name: "Crypto home: rename Trending->Trending pages, Debates->Trending questions + swap",
  ops: allOps,
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
