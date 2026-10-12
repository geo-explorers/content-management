# Live verifications (phase 2, 2026-10-09)

## V1 — Proposal contents ARE readable without the Curator API
- `proposal(id)` → `proposalVersions` (name, votingMode, yes/no counts, start/end) + `proposalActions(filter:{proposalId})` → `actionType: PUBLISH`, `contentUri: ipfs://<CID>`.
- Gateways: ipfs.io (connection reset), gateway.lighthouse.storage (402), **gateway.pinata.cloud (200, 2,733 bytes)** — same gateway `geo-mirror/scripts/extract-space.mjs` uses (`IPFS_GATEWAY` env).
- `@geoprotocol/grc-20` (already a repo dependency) exports `decodeEdit` / `decodeEditAuto` → `{ id, name, authors, createdAt, ops[] }`; ops = `createEntity{values[]}`, `createRelation{relationType, from, to, toSpace, entity}`… IDs come back as 16-byte arrays (convert to 32-hex).
- Tested on proposal `df516852a6534acfb35e4eb72ff71ac8` (Crypto space, rejected 0 yes / 1 no, cited by eval-3): 17 ops, 5 createEntity + 12 createRelation; the claim text and description were recovered verbatim.
- Script: `decode-proposal-edit.mjs <edit.bin>` (run with node 26; imports the SDK by absolute path).
- Still unknown (Need more info): the authoritative bounty→submission→proposal link. Fallbacks: (a) Curator API `/space/<s>/bounty/<b>/submissions` once populated; (b) `proposals(filter:{spaceId, proposedBy})` within the bounty window; (c) editor pastes proposal links (as today's review pages do).

## V2 — API versioning tables exist
`valueVersions` / `relationVersions` carry `validFromKey` / `validToKey` and `editVersions` carry `versionKey` → an executed proposal's diff is reconstructible server-side (not yet exercised).
