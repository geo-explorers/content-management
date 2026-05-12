# Editor README — Geo skills

Three skills for editing Geo with Claude Code:
- `geo-query` — read Geo
- `geo-publish` — write to Geo
- `geo-orchestrate` — **the one you use.** Runs safeguards (duplicate check + schema check) before any write.

## One-time setup

1. **Install Claude Code**: https://claude.com/claude-code
2. **Install Bun** (runs the publish scripts):
   - Mac: open Terminal → `curl -fsSL https://bun.sh/install | bash`
   - Windows: open PowerShell → `powershell -c "irm bun.sh/install.ps1|iex"`
3. **Open this folder in terminal**:
   - Mac: Spotlight (Cmd+Space) → "Terminal" → `cd <path-to-content-management>`
   - Windows: Start → "Windows Terminal" → `cd <path-to-content-management>`
4. **Install dependencies**: `bun install`
5. **Fill in `.env`** (in this folder). Open it in your editor and set:
   ```
   PK_SW=<your wallet private key — export from https://www.geobrowser.io/export-wallet>
   DEMO_SPACE_ID=<your personal space ID — from the geobrowser URL of your profile>
   ```
   Never paste these into chat.

## How to use

1. In terminal, in this folder, run: `claude`
2. Type your request **starting with "Use geo-orchestrate to..."** — this triggers the safeguards.

   Example:
   ```
   Use geo-orchestrate to add Bitcoin as a Project to my personal space,
   with a Web URL of https://bitcoin.org.
   ```
3. Claude will reply with a **Discovery + Gates + Plan** block:
   - **Duplicate candidates** — entities that may already exist.
   - **Off-schema delta** — properties not on the type's schema.
   - **Ops summary** — what the script will do.
4. Review it. If it's wrong, tell Claude what to change. If it's right, reply `go`.
5. Claude writes a `.ts` script in `scripts/`. **You run it yourself**:
   ```
   bun run scripts/<filename>.ts
   ```
   This is a **dry run** (DRY_RUN = true) — it prints ops but does NOT publish.
6. If dry-run output looks right, open the script, change `DRY_RUN = true` → `DRY_RUN = false`, and run again to publish.

## What to watch for

- If Claude writes a script **without** showing you the Discovery + Gates + Plan block first, stop and reply:
  > Show me the duplicate-candidate list and the off-schema delta before writing anything.
- Never paste your wallet key into chat.
- Never run a script with `DRY_RUN = false` until you've seen the dry-run output.

## More

The full reference for each skill lives in `<skill-name>/SKILL.md` (e.g. `geo-orchestrate/SKILL.md`). Read it if you need to understand what a step is doing.
