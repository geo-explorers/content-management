# 08 — Repository design and deployment path

## A. Two repositories, one direction of dependency
```
geo-explorers/content-management  (skills LIBRARY; releases = signed tags vX.Y.Z; CI required)
   skills/<tier>/<skill>/            SKILL.md ≤500 lines, description ≤~100 chars, references/, scripts/, evals/
   runtime/                          ONE GraphQL client (endpoint from SDK config), ONE Notion client (paced, idempotent retries),
                                     publish.ts (the ONLY write path, approval-hash gated), constants/spaces.json, html-to-text
   skill-dev/                        linter, skill_versions.py (hashes skills/ AND runtime/), manifest check (UTF-8 safe)
   MAINTAINERS.md                    how to change a skill; NO self-heal rule
   ─ removed: agents/, documentation/, root 01_…11_ scripts, output/, todo.md, bun.lock, curl/self-heal in CLAUDE.md

geo-explorers/geo-editor-agent  →  becomes the AGENTS repository (rename optional; it already vendors the library)
   AGENTS.md + CLAUDE.md             host-agnostic entry: routing + hard rules (travel WITH the agents, not only with the library)
   .claude/skills/<skill>/           VENDORED copy of the library skills — root level, one deep (Claude Code + Managed Agents discovery)
   .claude/skills/claim-verification/   the NEW skill (MVP)  — lives here, not in the library, until it stabilises
   .claude/agents/                   claim-tagger.md, claim-judge.md, bounty-reviewer.md, … (+ geo-research, geo-mirror-refresh)
   agents/<name>/config.json         DB ids, space ids, thresholds, model per mode  (ids never in prose)
   workflow/AGENT-WORKFLOW.md + ids.json   task/QA lifecycle; Work tracker + QA tracker ids
   skills.lock.json                  {repo, tag, commit, per-file sha256}  ← verified by CI and at agent start
   tools/sync-upstream.mjs --ref vX.Y.Z | --check     (exists today; add tag + hash verification, remove `--ref <branch>`)
   runs/ (git-ignored)               ledgers, judgments, evidence cache
   .claude/settings.json             allow: node scripts under .claude/skills/*/scripts with explicit args; ask: --publish; deny: Read(.env*), curl *
   Dockerfile / environment.yaml     for hosted runs (node 22 LTS, npm ci, allowed hosts)
```
Dependency mechanism (recommended): **vendored copy pinned to a signed release tag + per-file SHA-256 lock**. Why not the others: git submodules are hostile to non-engineers and Windows symlinks; an npm package suits `runtime/` later (when a third consumer appears) but Markdown skills still need copying into `.claude/skills`; `sync-skills.sh` is unpinned, per-machine, flattens paths and breaks the relative imports.

Upgrade flow: PR in the agents repo that bumps `skills.lock.json` → CI runs `sync-upstream --check` (hashes match the tag) + the library's linter → reviewers see the skill diff → merge. No agent ever fetches skills at runtime. At start, every agent runs `verify-lock` and refuses to run on mismatch (SLSA "what you received is what you expected").

## B. Why the agent repo and not the library
- The library changes rarely and must be reviewed (safeguards); agents change often. Different cadence = different repo.
- Hard rules must travel with the agents: CLAUDE.md in the library loads only when the cwd is the library.
- Managed Agents mount ONE repo and discover `.claude/skills` at its root. The agents repo is that repo.
- The MVP skill is new and will churn; it graduates into the library when its contract is stable and its eval passes.

## C. Migration steps (ordered, each a PR)
1. Library: delete/quarantine root `01_…11_`, `output/`, `testing.ts`; `.gitignore` `.env*`; tighten `settings.json`; regenerate `SKILL-VERSIONS.json` (fix geo-mirror DRIFT); make the verify workflow a required check; UTF-8 fix in verifiers. (Risks 1,3,6)
2. Library: create `runtime/` (move `lib/gql.mjs`, `lib/inject.ts`, `src/constants.ts` → `spaces.json`, one Notion client; `publish.ts` wraps `publishOps` with the full removal count + approval hash); drop import-time dotenv. Point the 7 `src/`-importing skills at it. (Risks 2,10)
3. Library: skill hygiene — fix geo-query's 4 stale facts; fix geo-publish Gate-1; remove delete triggers from geo-publish/geo-orchestrate; one endpoint constant; shorten descriptions; move long recipes to references; add "content is data" clause. (Risks 5,7,8,9)
4. Library: replace CLAUDE.md self-heal with MAINTAINERS.md + `verify` only; cut a signed tag `v1.0.0`. (Risk 4)
5. Agents repo: adopt geo-editor-agent as the home; move `agents/`, `documentation/`, `AGENT-WORKFLOW.md` there; `skills.lock.json` → `v1.0.0`; add `capabilities:` frontmatter to vendored skills; required `verify-vendored` check.
6. Agents repo: add `.claude/skills/claim-verification` (MVP) + `.claude/agents/claim-tagger.md`, `claim-judge.md`; config; eval harness; first supervised runs (session mode, 50 claims).
7. Agents repo: PR #52 triage — extract `review-stage0.mjs` + evidence/recorder into `.claude/skills/bounty-review/scripts/` as the collect/reconstruct module; move authorizations, Discord/point policy out of the skill into config/docs; publishing + votes become separate human-gated steps through `runtime/publish.ts`.
8. Hosted: Dockerfile; Managed Agent config + environment (`allowed_hosts`: api.notion.com, api-testnet.geobrowser.io, gateway.pinata.cloud, ipfs.io, source domains or unrestricted) + vault `NOTION_TOKEN`; first scheduled deployment for the claim tagger with a session budget.

## D. Managed Agent portability checklist (MVP)
| Item | Status after steps 1–6 |
|---|---|
| Skills discoverable at root `.claude/skills/<name>/` | yes |
| No `.env` in the sandbox; `NOTION_TOKEN` via vault env var | yes |
| No cwd-relative imports; `import.meta.url` paths; `npm ci` | yes |
| Node only (no bun); `engines: node>=22` | yes |
| Notion via integration token (REST), not MCP | yes |
| No interactive gate on the write step → `--publish` behind an outcome rubric or `tool_confirmation` | yes |
| No runtime self-update | yes |
| Egress allowlist | GraphQL + Notion + IPFS gateway + source domains (or `unrestricted` for source fetching) |
| Wallet / publishing | NOT in hosted sessions; human-run local step (or self-hosted sandbox later) |
