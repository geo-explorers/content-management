// Read-only verification of the 2026-07 SDK/infra migration (geo-sdk 0.20.0-beta.8).
// Checks: config-derived endpoints, GraphQL reads on the new API (via gql() and the
// SDK client), data parity on the announced final host, wallet-client creation
// (EIP-7702) and personal-space registration of the wallet address.
// NO publishes, NO transactions.
import { NETWORK, geo, gql, getWalletAddress } from '../src/functions.ts';

const WORLD_AFFAIRS = '89bd89bf28ff8a0963faf92a8c905e20';

console.log('API origin (from GeoTestnetConfig):', NETWORK.apiOrigin);
console.log('RPC (from config):', NETWORK.chain.rpcUrl, '| chain id:', NETWORK.chain.id);

const d = await gql(`{ space(id: "${WORLD_AFFAIRS}") { id type page { name } } }`);
console.log('gql() space lookup:', JSON.stringify(d.space));

const viaClient = await geo.api.graphql<{ space: { id: string } }>(`{ space(id: "${WORLD_AFFAIRS}") { id } }`);
console.log('geo.api.graphql:', JSON.stringify(viaClient.data?.space ?? viaClient.errors));

const res = await fetch('https://api-testnet.geobrowser.io/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: `{ space(id: "${WORLD_AFFAIRS}") { id type page { name } } }` }),
});
const alt = await res.json();
console.log('announced host (api-testnet) same space:', JSON.stringify(alt.data?.space));

const addr = await getWalletAddress();
console.log('wallet address (EIP-7702):', addr);
const ps = await gql(`{ spaces(filter: { address: { is: "${addr}" } }) { id type } }`);
console.log('spaces registered to wallet:', JSON.stringify(ps.spaces));
const match = ps.spaces?.some((s: any) => s.id === process.env.DEMO_SPACE_ID && s.type === 'PERSONAL');
console.log('personal space matches DEMO_SPACE_ID:', match ? 'YES' : 'NO');
