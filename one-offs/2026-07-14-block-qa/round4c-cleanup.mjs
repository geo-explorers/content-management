// round4c-cleanup.mjs — delete the 5 duplicate text blocks created by the idempotency probe.
//   PUB:  bun --env-file=/Users/moh/work-projects/geo/.env run round4c-cleanup.mjs --dao --vote
import { Graph, daoSpace, getSmartAccountWalletClient } from "@geoprotocol/geo-sdk";

const args = process.argv.slice(2);
const mode = args.includes("--dao") ? "dao" : "dryrun";

const SPACE    = "5908c73ad336472ccbd983491d2d17e4";
const DAO_ADDR = "0xf6B3938c48ADdE5C6570d968533601AcC804479b";
const MOH      = "4cd9cca5530b69056aead853c8088e7e";

const DUPES = [
  { edge: "85cd3cef5b754a82bf71a7182c5d7b44", entity: "fc2b24f267f248ea99616afde8fb2fdd" },
  { edge: "971ddd8b9eb647a3ad79bb30532cc7f9", entity: "ddadde3be4c24fc386f1f6cb21becc0a" },
  { edge: "87cfc633302643bfba8258e9906fa29a", entity: "0769ed82343b4f798431edd31398b230" },
  { edge: "4e9e6986865f460ca9e19fb98e242f04", entity: "bb0dc849d7f243bca8836699423413ee" },
  { edge: "9b1c2b4e74544b0cb1b986c68ccaac3b", entity: "ca676986cf1e48df8213699c77028616" },
];

const ops = [];
for (const d of DUPES) {
  ops.push(...Graph.deleteRelation({ id: d.edge }).ops);
  ops.push(...(await Graph.deleteEntity({ id: d.entity, spaceId: SPACE })).ops);
}
console.log(`cleanup: ${DUPES.length} dupes -> ${ops.length} ops`);
if (mode !== "dao") { console.log("DRY RUN — re-run with --dao --vote."); process.exit(0); }

const raw = process.env.GEO_PRIVATE_KEY || process.env.MOH_PRIVATE_KEY;
const privateKey = raw.startsWith("0x") ? raw : `0x${raw}`;
const wallet = await getSmartAccountWalletClient({ privateKey });
const { proposalId, to, calldata } = await daoSpace.proposeEdit({
  name: "Block QA canvas: remove idempotency-probe duplicate blocks",
  ops, author: MOH, daoSpaceAddress: DAO_ADDR,
  callerSpaceId: `0x${MOH}`, daoSpaceId: `0x${SPACE}`, votingMode: "FAST", network: "TESTNET",
});
const tx = await wallet.sendTransaction({ to, data: calldata });
console.log("proposalId:", proposalId, "\nproposeTx:", tx);
if (args.includes("--vote")) {
  const pid = String(proposalId).startsWith("0x") ? proposalId : `0x${proposalId}`;
  const v = daoSpace.voteProposal({ authorSpaceId: `0x${MOH}`, spaceId: `0x${SPACE}`, proposalId: pid, vote: "YES" });
  const vtx = await wallet.sendTransaction({ to: v.to, data: v.calldata });
  console.log("voteYesTx:", vtx);
}
