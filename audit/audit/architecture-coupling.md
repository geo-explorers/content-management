# Architecture and coupling audit: content-management

*2026-10-09 · HEAD `fd013a1` · read-only. Facts already in `01-log.md` are reused, not re-derived. Live checks: `gh api` (branch protection, CI runs, PRs, `geo-editor-agent`), local `skill_versions.py verify` / `check_md_manifest.py`, SDK 0.20.3 in `node_modules`.*

## Verdict

- **A monolith wrapped in skills.** 7 of 15 skills reference `src/`; 6 assume the repo root as cwd.
- **Safety is mostly prose, and the harness undercuts it.** The allowlist auto-approves publish-capable commands and `curl`, and several committed scripts are armed to write or delete.
- **The integrity CI is not enforced.** No check is required, and `main` has been red since 2026-09-25.
- **The split half-exists already.** `geo-explorers/geo-editor-agent` (public) vendors this repo at `fd013a1`, the red commit. It has to copy `src/`, `lib/` and `scripts/` because of the `../../../../src` imports (its `UPSTREAM.md`). Build on it rather than creating a third repo.
- **The read-only MVP can be hosted** after about 6 fixes. Publishing agents need out-of-band approval enforced in code first.

## 1. Coupling map

```
agents/*.md ──prose: "run from repo root", hardcoded Notion/space IDs, host-specific MCP tool names──┐
CLAUDE.md (routing + hard rules + self-heal) ── loaded only when cwd = this repo                       ▼
.claude/settings.json allowlist ──auto-runs──► skills/*/SKILL.md ──prose cmds──► skills/*/scripts/*.mjs|ts|py
                                                                                    │  ../../../../src/functions.ts
                                                       .env (wallet+Notion+inject) ◄─ dotenv.config() ◄─┤
                                                       @geoprotocol/geo-sdk ──► IPFS / RPC / chain ◄────┘
                              + 18 private GraphQL clients and 8 private Notion clients inside scripts
```

| # | Edge | Evidence | Breaks when |
|---|---|---|---|
| 1 | Skill scripts → `src/` by relative path | `geo-mirror/scripts/sync-to-geo.mjs:11`, `geo-claim-grouping/scripts/discover_candidates.ts:18` (`../../../../src/functions.ts`) | Installed anywhere except `<repo>/skills/<tier>/` or a project `.claude/skills`. `sync-skills.sh:17,28` installs flat to `~/.claude/skills/<name>`, so the import resolves to `~/src` |
| 2 | Skills → repo-root files outside the skill folder | geo-press-review → `scripts/press-review-coverage-map.ts` (SKILL.md:57); geo-clean → `validate_migration.ts`, `src/select_canonical.ts` (SKILL.md:16,131,303); geo-publish and geo-orchestrate write into repo `scripts/` and import `../src/functions.js` (geo-publish:160,272; geo-orchestrate:135,157) | These files are not in the SKILL-VERSIONS hash and are not synced |
| 3 | "Non-actionable" → actionable | `geo-mirror-and-group/scripts/run-pipeline.mjs:138-191` spawns geo-mirror and geo-claim-grouping scripts | The tier boundary means nothing |
| 4 | Scripts → cwd | `run-pipeline.mjs:61,65` (`join('skills',…)`, `--env-file=.env`); `agents/README.md:19`; `geo-mirror-refresh.md:19`; `geo-claim-grouping-notion/SKILL.md:70` | Run from anywhere but the root |
| 5 | geo-mirror SKILL.md disagrees with itself | `scripts/…` form (lines 40, 54, 113, 215-257) vs `skills/actionable/geo-mirror/scripts/…` (81-86) | One form always fails |
| 6 | `src/` → `.env` at import time | `src/functions.ts:14` `dotenv.config()` | Every importer, including "READ-ONLY" `discover_candidates.ts:8`, gets `GEO_PRIVATE_KEY` in `process.env` |
| 7 | Three env conventions | `.env` (README:24-37); `.env.geo-publish` (geo-publish:19,161; `publish_gaps.mjs:9,16`); `NODE_PATH=<geo-publish-skill>/node_modules` (`publish_gaps.mjs:8`, a folder that does not exist: geo-publish ships only SKILL.md + evals) | `.env.geo-publish` is **not git-ignored** (`.gitignore:1` matches only `.env`; confirmed with `git check-ignore`) |
| 8 | Hardcoded IDs | `src/constants.ts:8-49` (root, 13 canonical, 5 dataset spaces), 96-222; `AGENT-WORKFLOW.md:15-27,53,92` and `geo-mirror-refresh.md:26-32` (IDs in prose, two copies) | Any database or space is re-created |
| 9 | Hardcoded endpoints | `api-testnet…/graphql` in 17 files (`lib/gql.mjs:7`, `run-pipeline.mjs:25`, 6 geo-mirror scripts…), contradicting `functions.ts:16-19` ("never hardcode"). Fix-package templates hardcode a **retired RPC**: `03_merge_duplicates.ts:469` `rpc-geo-test-zc16z3tcvf` vs the SDK's `rpc-geo-testnet-irdc0cgb0w` (`networks.js:3`) | The next infra migration. One has already hit (`versions.md:204`) |
| 10 | Agents → host-specific MCP tool names | `geo-research.md:4` `mcp__hypergraph-mcp__*`; `notion-operations/SKILL.md:27` `mcp__claude_ai_Notion__*`; this session exposes `mcp__claude_ai_Hypergraph_MCP__*` and `mcp__notion__*` | The agent loses its tools silently |
| 11 | Agents → repo docs | `geo-research.md:8,17-22` reads `content-management/documentation/…` | No checkout available |
| 12 | Hard rules → `CLAUDE.md` only | Claude Code loads CLAUDE.md from the cwd. README:52 and `sync-skills.sh` install skills user-level | Skills run in other projects **without** the hard rules |

**Runtime and OS**

| Concern | Evidence |
|---|---|
| bun required, but Node preferred | README:24,28 require bun (not installed here); root scripts import `./src/functions.js`, which only bun maps to `.ts` (`03:8`; `08:17` has no extension). Yet geo-publish:17,558 says "prefer Node — Bun fetch bug", while geo-clean:303,617 says `bun run` |
| Node version | A `.mjs` importing `.ts` needs Node ≥22.18 (type stripping); geo-publish:17 says "Node 20.6+". No `engines`, no `scripts`, no type check (`tsconfig.json:15` skips `skills/`) |
| Two lockfiles | `bun.lock` → geo-sdk **0.20.2**, `package-lock.json` → **0.20.3**: the transaction-signing code depends on the package manager |
| Windows | `sync-skills.sh:28` uses rsync (absent); `:19` is a macOS-only path; **both CI checkers crash** under cp1252 (`UnicodeEncodeError`, reproduced; they pass with `PYTHONIOENCODING=utf-8`); `/tmp` paths (geo-mirror:81-86, CLAUDE.md:55-57) |

## 2. Repository split

### 2.1 Target layout

```
content-management/                       # pure library; releases = signed tags vX.Y.Z
├─ skills/<tier>/<skill>/                 # SKILL.md, references/, scripts/, evals/: self-contained
│    (coverage-map.ts → geo-press-review/scripts; validate_migration.ts → geo-clean/scripts;
│     notion-read.mjs → notion-operations/scripts)
├─ runtime/                               # @geo-explorers/geo-runtime (npm workspace)
│    geo.ts (ONE GraphQL client, endpoint from SDK config) · publish.ts (the ONLY write path) ·
│    notion.ts (paced REST) · entity-ops.ts · select-canonical.ts · constants.ts · inject.ts
├─ references/knowledge-graph-ontology.md
├─ skill-dev/ (linter; skill_versions.py also hashes runtime/; manifest check)
├─ MAINTAINERS.md (replaces CLAUDE.md: how to change a skill, no self-heal)
└─ package.json (engines node>=22.18, npm only) · .github/workflows/{verify(required),release,discord}

geo-editor-agent/  (= the "new agents repo"; it already exists)
├─ AGENTS.md + CLAUDE.md                 # routing + hard rules, host-agnostic
├─ agents/<name>/{agent.md, config.json (DB/space IDs), evals/gold/}
├─ .claude/agents/  ← generated from agents/      .claude/skills/ ← VENDORED, never hand-edited
├─ vendor/geo-runtime/ (installed as a "file:" dependency)
├─ skills.lock.json {repo, tag, commit, per-file sha256}
├─ tools/sync-upstream.mjs --ref vX.Y.Z | --check      # exists; add tag + hash verification
├─ workflow/AGENT-WORKFLOW.md + workflow/ids.json · docs/research-agent-*.md
└─ Dockerfile · .github/workflows/verify-vendored.yml (required)
```

### 2.2 Dependency mechanism

| Option | Pros | Cons | Fit |
|---|---|---|---|
| git submodule | Exact pin | Painful for non-engineers; drags in the armed root scripts; needs symlinks into `.claude/skills` (poor on Windows) | Low |
| npm package | Semver, lockfile integrity, `npm ci` in Docker | Markdown skills need a postinstall copy into `.claude/skills`; needs a publish pipeline | Good **for `runtime/`** |
| **Vendored + SHA-256 lock** | Skill diffs are reviewable in PRs; plain files for hosted images; already the team's pattern (`geo-editor-agent/.upstream-sha`, `tools/sync-upstream.mjs`); reuses `skill_versions.py` | Duplicated bytes; needs a CI check against hand edits | **Best for skills** |
| `sync-skills.sh` | Zero setup | Unpinned, per-machine, flattens paths, no Windows, no agents (`agents/README.md:21`), no verification | Reject |

**Recommendation:** vendor the skills and `runtime/` into `geo-editor-agent`, pinned to a **signed release tag** (not a commit on `main`). Keep per-file SHA-256 values in `skills.lock.json` and make `sync-upstream --check` a required check. An upgrade is a PR that bumps the tag. Publish `runtime/` to npm only when a third consumer appears. Today `geo-editor-agent` pins `fd013a1`, which fails `skill_versions.py verify` (geo-mirror DRIFT), and it still vendors the ungated `scripts/inject-publish-example.ts`.

### 2.3 What moves or changes

| Item | Action |
|---|---|
| `agents/*.md`, `AGENT-WORKFLOW.md`, `documentation/` | Move to the agents repo; IDs go to `workflow/ids.json` |
| `MD-FILES.md`, `check_md_manifest.py` | One per repo; ASCII-safe output |
| `CLAUDE.md` | Hard rules go into the agents-repo CLAUDE.md, the geo-publish/geo-clean SKILL.md **and `runtime/publish.ts`**. Delete self-heal |
| `src/*`, `lib/gql.mjs`, `lib/inject.ts` | Consolidate into `runtime/`; default `dryRun=true`; drop import-time `dotenv` |
| Scripts importing `src/` or using cwd paths (`sync-to-geo.mjs`, `discover_candidates.ts`, `run-pipeline.mjs`) and the 17 endpoint / 8 Notion-client copies | Import the runtime; resolve paths with `import.meta.url` |
| `scripts/press-review-coverage-map.ts`, `notion-read.mjs`, `validate_migration.ts` | Move into their skills |
| `scripts/inject-publish-example.ts` and the dated one-offs | Delete, or move to `examples/` with a gate |
| Root `01_…`–`11_…`, `testing.ts` | Delete (git history keeps them), or quarantine in `maintenance/` with dry-run defaults |
| `output/` (8 armed `publish.ts` on a removed SDK API), `todo.md` | Delete from git / move to the issue tracker |
| `bun.lock`, `settings.json`, `.gitignore` | Drop bun; tighten the allowlist (R3); ignore `.env*` except `!.env.example` |
| geo-discovery publish scripts | Port to the runtime or retire (R7) |

## 3. Hosted container or Managed Agent

Platform specifics should be checked against `claude-platform-facts.md` (still being produced).

| Blocker | Evidence | Fix |
|---|---|---|
| Secrets in local `.env`: one file holds the wallet key, Notion token and inject key | `.env.example`; `functions.ts:14` | Platform secret store, one secret per capability. The MVP gets only `NOTION_TOKEN`. No wallet in read-only agents. Publishing later uses a dedicated low-privilege bot wallet |
| `--env-file=.env` baked into commands | `run-pipeline.mjs:65`; every SKILL.md command; `settings.json` | Read `process.env`; make the env file optional |
| Filesystem-relative paths and run-from-root | §1 rows 1-5 | Runtime package; `import.meta.url` |
| bun | README:28; root scripts | Node-only image; optionally bundle scripts with esbuild |
| Interactive gates | geo-publish:47-56 ("go", then "publish"); `08_delete_space_data.ts:178-179` **skips** its confirmation when stdin is not a TTY, so it is fail-open in any container | Hosted agents emit plans only. Approval happens out-of-band (Notion `Publish status = Approved`, per the publication contract in 01-log, or a PR). `runtime/publish.ts` refuses to run without an approval record that matches the plan hash |
| Notion MCP vs integration token | The MCP connector uses the user's identity and is available to the main session only (`notion-operations/SKILL.md:24-45`). It hit the workspace usage limit (01-log). Tool names vary by host | Integration token with paced REST inside the container (A9). Keep the connector for interactive human sessions |
| Host install paths | `sync-skills.sh:15-19,28` (`~/.claude/skills`, macOS path, rsync); `gather_sessions.py:27` (`~/.claude/projects`) | Bake the vendored skills into the image or upload them through the platform's skill mechanism. daily-report stays local |
| Self-heal from GitHub at runtime | CLAUDE.md:42-71 | Disable it; the image is immutable and pinned |
| Egress and local state | Publishing needs IPFS, RPC and zerodev (geo-publish:38-43); scratch files go to TEMP, `/tmp` or the cwd (`run-pipeline.mjs:55`, `publish_gaps.mjs:114`) | Explicit allowlist (MVP: GraphQL host, `api.notion.com`, source domains); a mounted volume for run ledgers |

**Verdict:** the claim-tagging MVP needs no `src/` and no wallet. It can be hosted once the secrets, env-file, path, bun, Notion-identity and self-heal blockers are fixed. Publishing agents cannot be hosted until approval is out-of-band and enforced in `runtime/publish.ts`.

## 4. Impact on the team's way of working

| Practice | Good, worth keeping | Problem (evidence) | Fix |
|---|---|---|---|
| `SKILL-VERSIONS.json` + `skill_versions.py` | Per-skill content hash; CRLF normalisation (`:47-57`); clear OK/DRIFT/UNLISTED semantics | **Not a gate**: `required_status_checks` is empty. **`main` red since 2026-09-25** (run 36139043979, geo-mirror DRIFT, reproduced locally). Hashes cover `skills/` only, not the `src/`, `lib/` and `scripts/` the skills execute. `generate` lets whoever edits approve their own change. `verify` uses `git ls-files`, so it cannot check installed copies | Make it a required check; hash `runtime/` too; let CODEOWNERS approval be the real approval |
| `MD-FILES.md` + `check_md_manifest.py` | Passes (63 files); good "loading trigger" taxonomy | Footer counts are not checked; crashes on Windows | Keep; one per repo |
| `sync-skills.sh` | Names the drift problem (`:2-4`) | See §2.2. Also **version skew**: SKILL.md comes from `~/.claude/skills` while scripts come from the checkout | Replace with the pinned vendor sync |
| Two Notion identities | Documented explicitly (`notion-operations` §1) | Attribution is split. `AGENT-WORKFLOW.md:132` assumes the integration while the main session uses the connector. Subagents have no MCP | One identity per agent role; record it in the task log |
| Two Work trackers | The trap is documented (`AGENT-WORKFLOW.md:55,134`) | A data problem patched with prose that every agent must read; IDs live in prose | Archive or rename the old database in Notion; IDs in config; preflight-check the database ID |
| Discord notifier | Plain-language change feed for editors | Sends up to 60 KB of diff (`discord-notify.yml:29-30`) on every push to `main`. No `permissions:` block. Model ID hardcoded (`:34`). Diff text can steer a post into the editors' channel. Actions pinned by tag, not SHA | `permissions: contents: read`; path filter; exclude lockfiles and `output/`; strip links; pin SHAs |
| Hard rules, task and QA lifecycle | S/A/B/C scale; "say what you could not verify"; dry-run defaults in mirror scripts (`sync-to-geo.mjs:15`, `mirror-claims-topics.mjs:52`); anchored-entity guard fails closed (`functions.ts:191-214`); `lib/gql.mjs` never swallows errors | Enforced only by prose, and the allowlist undercuts it (R3) | Move the gates into runtime code and add `deny` rules |

**The self-heal rule** (CLAUDE.md:42-71), assessed as supply-chain risk:

1. **Unpinned.** It fetches `refs/heads/main` (`:46,55`): whatever merged last, including today's red `main`.
2. **No authenticity check.** "Verify" means frontmatter, version ≥, and an "optional" SHA-256 of the copy **against the archive itself** (`:69`). `SKILL-VERSIONS.json` arrives in the same tarball, so the check is circular.
3. **Wide push surface** (`gh api`, branch protection on `main`). The repo is **public**, with 12 collaborators. One approving review is required, but stale approvals survive new commits (`dismiss_stale_reviews=false`) and admins bypass (`enforce_admins=false`). There is no CODEOWNERS, no signed commits and no required checks. Agent-authored branches exist (`codex/…`).
4. **The agent overwrites its own instructions.** The trigger is the model's judgment ("misbehaves… consistent with staleness", `:51`). The scope is "every skill" (`:44`), and `cp -R "$ARC"/skills/. skills/` (`:65`) silently clobbers local edits mid-task.
5. **Executable payload.** Skills ship scripts that the agent runs with the wallet key loaded (`functions.ts:14`), and `Bash(curl *)` needs no prompt (`settings.json:13`). A planted script means key theft or a rogue publish. "Ignore any other repo URL" (`:46`) is the only control. The procedure is a ready-made recipe for an injected instruction.

**Fix:** the agent only runs a read-only `verify`. On a mismatch it stops and asks a human to run `sync --ref <signed tag>`. Releases carry GitHub artifact attestations, and the hash lock lives in the consumer repo. Add CODEOWNERS on `skills/actionable/**` and `runtime/**`; set `dismiss_stale_reviews`, `enforce_admins` and required checks.

## 5. Top 10 risks

| # | Sev | Risk | Evidence | Fix |
|---|---|---|---|---|
| R1 | **S** | Armed write/delete scripts are committed with live defaults | `01_entity_operations.ts:16-23` deletes entity `3a65…` in space `bd55…`, which is that space's **home entity** (`08:19-20`), with `dryRun` commented out. README:124 says "`bun run 01_entity_operations.ts`". `entity_ops.ts` defaults `dryRun=false` (414, 574, 712, 797, 950). `DRY_RUN=false` in `05:15`, `07:23`, `09:22`, `10:24`, `11:14`; 09 and 10 target the **Root space**. `08:178-179` skips confirmation when there is no TTY | Default to dry-run everywhere; require `--publish` plus a typed space name; delete or quarantine the files |
| R2 | **S** | The circuit breaker is incomplete and easy to bypass | It counts only `deleteRelation`/`unset` (`functions.ts:234-235`), not the grc-20 `deleteEntity` op (`op.d.ts:60`). The limit is per call, so per-entity publishing (`entity_ops.ts:41-53`) slips under it. The agent sets `CONFIRM_DESTRUCTIVE` itself (geo-clean:593). geo-publish's own template (SKILL.md:205-262), `publish_gaps.mjs` and the 03/04/07 packages bypass `publishOps` | One write path: count every removal op, a per-space budget, and an approval hash from a human step |
| R3 | **S** | The harness allowlist auto-approves writes and exfiltration | `settings.json:7-18`: `node --env-file=.env skills/actionable/*/scripts/*` covers `sync-to-geo.mjs … --publish`; `node --env-file=.env scripts/*` covers `inject-publish-example.ts`, which publishes with no gates (`:29-32`) using a hardcoded default URL (`:15`); `Bash(curl *)`. No `deny` for `.env*` | Remove publish-capable patterns; `ask` on `--publish`; deny `Read(.env*)` and `Bash(cat .env*)`; restrict `curl` to known hosts |
| R4 | **S** | Secrets sprawl | One `.env` holds the wallet, Notion and inject keys. dotenv loads the key into read-only runs (`functions.ts:14`). `.env.geo-publish`, documented as the key file (geo-publish:19), is **not ignored** in a **public** repo whose CI forwards diffs | `.env*` in `.gitignore`; GitHub push protection; one secret per capability; no import-time dotenv |
| R5 | **S** | Self-heal from unpinned `main` | §4 | Remove; signed tags plus a consumer-side lock |
| R6 | **A** | Integrity CI is neither enforced nor complete | No required checks; red since 2026-09-25; `src/`, `lib/`, `scripts/` are not hashed | Required check; hash `runtime/` |
| R7 | **A** | Shipped actionable code calls removed SDK APIs and auto-votes | `getSmartAccountWalletClient` has 0 hits in SDK 0.20.3 (geo-clean `reference.md:26`: "no longer exists") but is imported at `publish_gaps.mjs:19`, `build_dashboard.mjs:14` and 8 `output/*/publish.ts`. The removed `daoSpaceAddress` is still passed (`publish_gaps.mjs:98`). Auto-vote YES (`publish_gaps.mjs:105`, `03:572`) contradicts "propose only" (`functions.ts:352`) | Port or retire; CI test that imports every script; no vote without approval |
| R8 | **A** | Tier labels misstate side effects; the hard rules do not travel with the skills | "Non-actionable" geo-mirror-and-group and geo-claim-grouping-notion write to Notion and spawn actionable scripts. Draft PR #52's "non-actionable" `geo-submission-review` **publishes and votes**, yet `skills/README.md:36` says non-actionable skills "can't damage production". `:19` lists a skill that does not exist | `capabilities:` frontmatter (reads-geo / writes-notion / writes-geo / votes), enforced by the allowlist; hard rules inside the skills |
| R9 | **B** | Runtimes are fragmented | bun vs node guidance conflicts; `.js` → `.ts` imports work only in bun; two lockfiles pin different SDK versions; no `engines`; no type check | Node LTS + npm only; `engines`; one lockfile; `tsc --noEmit` in CI |
| R10 | **B** | Path coupling and duplicated clients | `../../../../src`; cwd-relative paths; 18 GraphQL clients and 8 Notion clients (all pinned to `2022-06-28`); endpoint hardcoded in 17 files; retired RPC in templates | `runtime/` package; `import.meta.url` |

## Also found

- **Draft PR #52** (mufasasa, +1,843 lines, with tests): `geo-submission-review`, covering bounty cases across proposals, report publishing to datasets spaces, and editor-approved votes. It is direct prior art for, and overlaps with, the planned bounty-review agent. It also edits CLAUDE.md.
- PR #38 ("Trim main to confirmed skills only") has been open since 2026-09-01.
- `xlsx@0.18.5` (`package.json`) has published CVEs (prototype pollution, ReDoS) and is used to parse dataset files (`src/xlsx-to-csv.cjs`).
- `geo-explorers/geo-editor-agent` is **public** (01-log noted a URL disagreement with `MantasTech/…`).
