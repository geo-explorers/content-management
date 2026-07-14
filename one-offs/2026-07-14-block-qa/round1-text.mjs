// round1-text.mjs — geo-publish block QA, Round 1 (features 1-5: text blocks).
// Creates the canvas entity + 5 ordered text blocks in the Crypto datasets DAO space.
//
//   DRY:  bun --env-file=/Users/moh/work-projects/geo/.env run round1-text.mjs
//   PUB:  ...same... round1-text.mjs --dao --vote
import { Graph, TextBlock, Position, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const SPACE    = "5908c73ad336472ccbd983491d2d17e4"; // Crypto datasets (DAO)
const DAO_ADDR = "0xf6B3938c48ADdE5C6570d968533601AcC804479b";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";
const T_PAGE   = "480e3fc267f3499385fbacdf4ddeaa6b";
const BITCOIN  = "2f8238b2f4c899fb23b4a2f8aabd996c"; // Bitcoin Topic (lives in this space)

const ops = [];

// canvas host
const canvas = Graph.createEntity({
  name: "Block QA canvas — 14 Jul 2026",
  description: "Test canvas for the geo-publish block QA of 14 July 2026; exercises text, media, data, and behavior block features.",
  types: [T_PAGE],
});
ops.push(...canvas.ops);

// 5 ordered text blocks (features 1-5)
const texts = [
  // 1: headings + bullets
  "## Why this page exists\n\nThis page is a QA canvas for the geo-publish skill's block features.\n\n- 13 block features tested in 4 rounds\n- every publish is dry-run first and human gated\n- results feed the geo-publish MVP spec",
  // 2: web link
  "Market context for this test comes from [CoinDesk](https://www.coindesk.com), which should render as a clickable external link.",
  // 3: inline entity mention (graph:// syntax, reverse-engineered from live data)
  "This canvas lives in the crypto datasets space and mentions [Bitcoin](graph://" + BITCOIN + ") as an inline entity link.",
  // 4: fenced code block
  "```json\n{ \"qa\": \"geo-publish blocks\", \"round\": 1, \"features\": [\"text\", \"links\", \"mentions\", \"code\", \"formula\"] }\n```",
  // 5: formula probe (no Formula block type exists; testing what markdown math does)
  "Formula probe: inline $E = mc^2$ and display $$R = \\frac{ops_{rendered}}{ops_{published}}$$",
];
let pos = null;
for (const text of texts) {
  pos = Position.generateBetween(pos, null);
  ops.push(...TextBlock.make({ fromId: canvas.id, text, position: pos }));
}

console.log("════ Block QA canvas — Round 1 (text) ════");
console.log(`  canvas entity: ${canvas.id}`);
console.log(`  blocks: ${texts.length} text blocks, ${ops.length} ops total`);
console.log(`  URL after publish: https://www.geobrowser.io/space/${SPACE}/${canvas.id}`);
if (mode !== "dao") { console.log("\nDRY RUN — re-run with --dao --vote to publish."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Block QA canvas: round 1 text blocks",
  ops, author: MOH, daoSpaceAddress: DAO_ADDR,
  callerSpaceId: `0x${MOH}`, daoSpaceId: `0x${SPACE}`, votingMode: "FAST", network: "TESTNET",
});
const tx = await wallet.sendTransaction({ to, data: calldata });
console.log("\nproposalId:", proposalId, "\nproposeTx:", tx, "\nURL:", `https://www.geobrowser.io/space/${SPACE}/${canvas.id}`);
if (args.includes("--vote")) {
  const pid = String(proposalId).startsWith("0x") ? proposalId : `0x${proposalId}`;
  const v = daoSpace.voteProposal({ authorSpaceId: `0x${MOH}`, spaceId: `0x${SPACE}`, proposalId: pid, vote: "YES" });
  const vtx = await wallet.sendTransaction({ to: v.to, data: v.calldata });
  console.log("voteYesTx:", vtx);
}
