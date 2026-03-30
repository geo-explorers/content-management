# Fix Package: 4cd9cca5530b69056aead853c8088e7e

This folder contains a set of pre-generated operations to merge duplicate
entities in the **4cd9cca5530b69056aead853c8088e7e** space (`4cd9cca5530b69056aead853c8088e7e`).

## Contents

| File | Description |
|------|-------------|
| `README.md` | This file |
| `report.txt` | Detailed list of every merge being performed |
| `ops.json` | The raw operations to publish (6 ops) |
| `publish.ts` | A self-contained script that publishes the ops on-chain |

## Prerequisites

- [Bun](https://bun.sh) installed
- You must be an **editor** of the 4cd9cca5530b69056aead853c8088e7e space
- A smart wallet private key (`PK_SW`) with access to that space

## How to run

1. Clone or copy the `content_management` project (this folder relies on its
   `node_modules` for the Geo SDK).

2. Install dependencies from the project root if you haven't already:
   ```
   bun install
   ```

3. Create a `.env` file in the project root (or add to an existing one) with
   your smart wallet private key:
   ```
   PK_SW=0xYOUR_PRIVATE_KEY_HERE
   ```

4. Run the publish script:
   ```
   bun run output/fix_properties/4cd9cca5530b69056aead853c8088e7e/publish.ts
   ```

5. The script will:
   - Load the ops from `ops.json`
   - Detect your space membership and editor status
   - Submit a proposal to the DAO (or publish directly for personal spaces)
   - If you are an editor, it will also auto-vote YES to approve the proposal

## What gets fixed

See `report.txt` for the full list. In summary: **0** merge(s)
across **6** operations.

## Questions?

If something goes wrong, check that:
- Your `PK_SW` is correct and the associated wallet is an editor of this space
- You have run `bun install` from the project root
- The Geo testnet API is reachable (`https://testnet-api.geobrowser.io/graphql`)
