# Fix Assignments

> Generated: 2026-03-30T17:42:30.975Z

Some spaces in the Geo knowledge graph have duplicate property entities that need to be merged. Because we don't have editor access to every space, we've generated ready-to-run fix packages. Each person listed below has one or more spaces that need attention.

---

## Quick Start (for everyone)

If you've never used a terminal or code editor before, follow these steps carefully. If you get stuck, ask for help in the team chat.

### 1. Install the tools

You need two things installed on your computer:

- **Bun** (a JavaScript runtime) — install it by opening your terminal and pasting this command:
  ```
  curl -fsSL https://bun.sh/install | bash
  ```
  Then close and reopen your terminal so the `bun` command is available.

- **A code editor** (optional but helpful) — [VS Code](https://code.visualstudio.com/) is free and works on Mac, Windows, and Linux. You can also just use your terminal directly.

### 2. Get the project

Clone the repository (or ask someone to share the project folder with you):
```
git clone <REPO_URL>
cd content_management
```

If you received the project as a zip file, unzip it and open a terminal in the `content_management` folder.

### 3. Install dependencies

Run this once from the `content_management` folder:
```
bun install
```

### 4. Set up your private key

Create a file called `.env` in the `content_management` folder (or edit it if it already exists) and add your smart wallet private key:
```
PK_SW=0xYOUR_PRIVATE_KEY_HERE
```

> **Where do I find my private key?** Go to [geobrowser.io/export-wallet](https://www.geobrowser.io/export-wallet) (make sure you are logged in). Click **Export wallet**, then click **Copy key**. Paste it after `PK_SW=`. Keep this key secret — don't share it with anyone.

### 5. Run your fix script

Find your name in the list below, then run the command shown for each of your spaces. For example:
```
bun run output/fix_properties/<your_folder>/publish.ts
```

The script will submit a proposal (or publish directly if you are an editor). You should see a "Done!" message when it finishes.

---

## Assignments

### bernard karaba

- **bernard karaba** — 194 operations to apply
  - Space ID: `7f28e45c79fa8236fc92d329448962de`
  - Run this command in your terminal:
    ```
    bun run output/fix_properties/7f28e45c79fa8236fc92d329448962de/publish.ts
    ```

### CptMoh

- **CptMoh** — 6 operations to apply
  - Space ID: `4cd9cca5530b69056aead853c8088e7e`
  - Run this command in your terminal:
    ```
    bun run output/fix_properties/4cd9cca5530b69056aead853c8088e7e/publish.ts
    ```

### fae5c35a91712b2cae3dd5028d3aba3f

- **fae5c35a91712b2cae3dd5028d3aba3f** — 44 operations to apply
  - Space ID: `fae5c35a91712b2cae3dd5028d3aba3f`
  - Run this command in your terminal:
    ```
    bun run output/fix_properties/fae5c35a91712b2cae3dd5028d3aba3f/publish.ts
    ```

### Levan Ostaevi

- **Levan Ostaevi** — 38 operations to apply
  - Space ID: `0c747ad3af58ed6b27221a256498068e`
  - Run this command in your terminal:
    ```
    bun run output/fix_properties/0c747ad3af58ed6b27221a256498068e/publish.ts
    ```

### MaximVL

- **Evolution of Intelligence** — 132 operations to apply
  - Space ID: `a070b8c196f28118335186ec4b4abce7`
  - Run this command in your terminal:
    ```
    bun run output/fix_properties/a070b8c196f28118335186ec4b4abce7/publish.ts
    ```

### Saad Shoaib

- **Saad Shoaib** — 20 operations to apply
  - Space ID: `60692f928095b96ea5aa82d3ea566792`
  - Run this command in your terminal:
    ```
    bun run output/fix_properties/60692f928095b96ea5aa82d3ea566792/publish.ts
    ```

### Thomas Freestone

- **7aed0e58f713f656e2933f7635f08e62** — 500 operations to apply
  - Space ID: `7aed0e58f713f656e2933f7635f08e62`
  - Run this command in your terminal:
    ```
    bun run output/fix_properties/7aed0e58f713f656e2933f7635f08e62/publish.ts
    ```

### Web Knowledge

- **Web Knowledge** — 2 operations to apply
  - Space ID: `cc0bf85a27c217d75993bc785a15b198`
  - Run this command in your terminal:
    ```
    bun run output/fix_properties/cc0bf85a27c217d75993bc785a15b198/publish.ts
    ```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `bun: command not found` | Close and reopen your terminal after installing Bun, or run `source ~/.bashrc` |
| `PK_SW not set in .env` | Make sure you created the `.env` file in the `content_management` folder (not a subfolder) |
| `No personal space found` | Your private key may be wrong — double-check it in Geo browser Settings |
| `You are not a member or editor` | You need editor access to the space — ask the space owner to add you |
| `API error: 400` | The Geo testnet API may be temporarily down — wait a few minutes and try again |
