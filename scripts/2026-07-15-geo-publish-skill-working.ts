import {
  Graph,
  getSmartAccountWalletClient,
  personalSpace,
  type Op,
} from "@geoprotocol/geo-sdk";

const DRY_RUN = false;
const CLAIM_TYPE = "96f859efa1ca4b229372c86ad58b694b";
const NAME = "Geo publish skill is already working";

const raw = process.env.GEO_PRIVATE_KEY ?? process.env.PK_SW;
if (!raw) {
  throw new Error(
    "No key. Set GEO_PRIVATE_KEY in .env.geo-publish (or PK_SW in .env).",
  );
}
const privateKey = (raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`;
const SPACE = process.env.DEMO_SPACE_ID;
if (!SPACE) throw new Error("DEMO_SPACE_ID is not set.");

const allOps: Op[] = [];
const { id: entityId, ops } = Graph.createEntity({
  name: NAME,
  types: [CLAIM_TYPE],
  values: [],
});
allOps.push(...ops);

console.log(JSON.stringify({ opCount: allOps.length, entityId, sample: allOps[0] }, null, 2));

if (DRY_RUN) {
  console.log("DRY_RUN — no changes published.");
} else {
  const wallet = await getSmartAccountWalletClient({ privateKey });
  const { to, calldata, editId } = await personalSpace.publishEdit({
    name: "Add claim: Geo publish skill is already working",
    spaceId: SPACE,
    ops: allOps,
    author: SPACE,
    network: "TESTNET",
  });
  const tx = await wallet.sendTransaction({
    account: wallet.account,
    to,
    data: calldata,
  });
  console.log(JSON.stringify({ editId, tx, entityId, spaceId: SPACE }, null, 2));
}
