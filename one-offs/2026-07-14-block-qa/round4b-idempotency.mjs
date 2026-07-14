// round4b-idempotency.mjs — geo-publish block QA, feature 13 (re-publish idempotency).
// Re-emits Round 1's five TextBlock.make calls verbatim against the same canvas.
// Prediction: TextBlock.make mints new block ids each run -> 5 DUPLICATE blocks appear.
//
//   DRY:  bun --env-file=/Users/moh/work-projects/geo/.env run round4b-idempotency.mjs
//   PUB:  ...same... round4b-idempotency.mjs --dao --vote
import { TextBlock, Position, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const SPACE    = "5908c73ad336472ccbd983491d2d17e4";
const DAO_ADDR = "0xf6B3938c48ADdE5C6570d968533601AcC804479b";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";
const CANVAS   = "b91409f702544bd989619de38f835dbe";
const BITCOIN  = "2f8238b2f4c899fb23b4a2f8aabd996c";

// Round 1's texts, verbatim
const texts = [
  "## Why this page exists\n\nThis page is a QA canvas for the geo-publish skill's block features.\n\n- 13 block features tested in 4 rounds\n- every publish is dry-run first and human gated\n- results feed the geo-publish MVP spec",
  "Market context for this test comes from [CoinDesk](https://www.coindesk.com), which should render as a clickable external link.",
  "This canvas lives in the crypto datasets space and mentions [Bitcoin](graph://" + BITCOIN + ") as an inline entity link.",
  "```json\n{ \"qa\": \"geo-publish blocks\", \"round\": 1, \"features\": [\"text\", \"links\", \"mentions\", \"code\", \"formula\"] }\n```",
  "Formula probe: inline $E = mc^2$ and display $$R = \\frac{ops_{rendered}}{ops_{published}}$$",
];
const ops = [];
let pos = null;
for (const text of texts) {
  pos = Position.generateBetween(pos, null);
  ops.push(...TextBlock.make({ fromId: CANVAS, text, position: pos }));
}

console.log("════ Block QA — idempotency probe (re-publish Round 1 blocks) ════");
console.log(`  ${ops.length} ops; block ids regenerate at runtime -> duplicates expected`);
if (mode !== "dao") { console.log("\nDRY RUN — re-run with --dao --vote to publish."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Block QA canvas: idempotency probe (round 1 re-publish)",
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
