#!/usr/bin/env bun
/**
 * Fix Package Publisher — cc0bf85a27c217d75993bc785a15b198
 * Space ID: cc0bf85a27c217d75993bc785a15b198
 *
 * This script publishes pre-generated merge ops to the "cc0bf85a27c217d75993bc785a15b198" space.
 * You must be an editor of this space to run it.
 */
import { daoSpace, getSmartAccountWalletClient, personalSpace, type Op } from '@geoprotocol/geo-sdk';
import dotenv from 'dotenv';
import * as fs from 'fs';
import path from 'node:path';

dotenv.config();

const TESTNET_RPC_URL = 'https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz';
const SPACE_ID = 'cc0bf85a27c217d75993bc785a15b198';
const SPACE_NAME = 'cc0bf85a27c217d75993bc785a15b198';

async function gql(query: string, variables?: Record<string, any>) {
  const res = await fetch('https://testnet-api.geobrowser.io/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error: ${res.status} ${res.statusText}\n${body}`);
  }
  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
    throw new Error(`GraphQL: ${json.errors[0].message}`);
  }
  return json.data;
}

async function main() {
  const privateKey = process.env.PK_SW as `0x${string}`;
  if (!privateKey) throw new Error('PK_SW not set in .env');

  // Load ops and restore UUID hex strings to Uint8Array(16)
  const opsPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'ops.json');
  const raw = JSON.parse(fs.readFileSync(opsPath, 'utf-8'));
  const hexToBytes = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return bytes;
  };
  const restoreUuids = (obj: any): any => {
    if (typeof obj === 'string' && /^[0-9a-f]{32}$/i.test(obj)) return hexToBytes(obj);
    if (Array.isArray(obj)) return obj.map(restoreUuids);
    if (obj && typeof obj === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(obj)) out[k] = restoreUuids(v);
      return out;
    }
    return obj;
  };
  const ops: Op[] = restoreUuids(raw);
  console.log(`Loaded ${ops.length} ops for space "${SPACE_NAME}" (${SPACE_ID})`);

  const client = await getSmartAccountWalletClient({ privateKey, rpcUrl: TESTNET_RPC_URL });
  const author = client.account.address;

  const personalSpaceData = await gql(`{ spaces(filter: { address: { is: "${author}" } }) { id type } }`);
  const callerSpace = personalSpaceData.spaces?.find((s: any) => s.type === 'PERSONAL');
  if (!callerSpace) throw new Error(`No personal space found for wallet ${author}.`);
  const callerSpaceId: string = callerSpace.id;

  const spaceData = await gql(`{
    space(id: "${SPACE_ID}") { type address editorsList { memberSpaceId } }
  }`);
  if (!spaceData.space) throw new Error(`Space ${SPACE_ID} not found`);

  const { type: spaceType, address: daoAddress } = spaceData.space;
  console.log(`Space type: ${spaceType}`);

  let to: `0x${string}`;
  let calldata: `0x${string}`;

  if (spaceType === 'PERSONAL') {
    if (SPACE_ID !== callerSpaceId) throw new Error('This is not your personal space.');
    const result = await personalSpace.publishEdit({
      name: 'Batch merge duplicates',
      spaceId: SPACE_ID,
      ops,
      author: SPACE_ID,
      network: 'TESTNET',
    });
    console.log('CID:', result.cid);
    console.log('Edit ID:', result.editId);
    to = result.to;
    calldata = result.calldata;
  } else {
    const editors: Array<{ memberSpaceId: string }> = spaceData.space.editorsList ?? [];
    const isEditor = editors.some((e: any) => e.memberSpaceId === callerSpaceId);
    console.log(`Caller space: ${callerSpaceId}, is editor: ${isEditor}`);

    const result = await daoSpace.proposeEdit({
      name: 'Batch merge duplicates',
      ops,
      author: callerSpaceId,
      network: 'TESTNET',
      callerSpaceId: `0x${callerSpaceId}` as `0x${string}`,
      daoSpaceId: `0x${SPACE_ID}` as `0x${string}`,
      daoSpaceAddress: daoAddress as `0x${string}`,
    });
    console.log('Proposal ID:', result.proposalId);
    console.log('CID:', result.cid);
    console.log('Edit ID:', result.editId);
    to = result.to;
    calldata = result.calldata;

    const txHash = await client.sendTransaction({ to, data: calldata });
    console.log('Proposal TX:', txHash);

    if (isEditor) {
      const voteResult = daoSpace.voteProposal({
        authorSpaceId: callerSpaceId,
        spaceId: SPACE_ID,
        proposalId: result.proposalId,
        vote: 'YES',
      });
      const voteTx = await client.sendTransaction({ to: voteResult.to, data: voteResult.calldata });
      console.log('Vote TX:', voteTx);
    }

    console.log('\nDone!');
    return;
  }

  const txHash = await client.sendTransaction({ to, data: calldata });
  console.log('TX:', txHash);
  console.log('\nDone!');
}

main().catch(console.error);
