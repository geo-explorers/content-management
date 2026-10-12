# Skills quality, staleness and security audit

Read-only audit of the 15 skills on `main` @ fd013a1, 2026-10-09. Live checks: `node lib/gql-cli.mjs` against `api-testnet.geobrowser.io`. Word counts are `wc -w`; multiply by about 1.4 for tokens.

## 1. Per-skill table

| Skill | Ver | SKILL.md lines / words | Scripts | Runtime | Writes Geo | Writes Notion | Linter | Staleness evidence |
|---|---|---|---|---|---|---|---|---|
| geo-claim-grouping | 0.7.0 | 191 / 3,378 (+3 refs 5,145) | 1 (.ts) | bun (node works) | yes (agent ops script → publishOps) | no | 0F 0W | template still "Similar-claims linking"; Gate 4 recommends the retired broad bar |
| geo-clean | 0.5.0 | 641 / 7,153 (+ref 2,364) | 0 (uses src/) | bun | yes, destructive | no | 0F 1W (637 lines) | `testnet-api-v2` host (l.21); retired `from16+to16` ids |
| geo-discovery | 0.1.1 | 203 / 1,719 | 10 (7 py, 2 mjs, 1 driver) | python + bun | yes, own publisher | no | 0F 0W | uses the retired `testnet-api` endpoint; pre-0.20 SDK API; `bin/whoami.mjs` doesn't exist |
| geo-mirror | 0.13.0 | 292 / 4,572 | 10 (.mjs) | node | yes (Part 2 via publishOps) | yes | 0F 0W, **manifest DRIFT** | 0.13.0 has no changelog entry; hash hand-edited; invalid query at l.289 |
| geo-orchestrate | 0.2.0 | 223 / 2,331 | 0 | bun | yes | no | 0F 0W | MCP-style `list_entities`; `type:"url"`; `documentation/From Rush/` doesn't exist; 2 of 5 gates |
| geo-publish | 0.11.0 | 571 / 6,772 (+ONTOLOGY.md 7,175 mandatory) | 0 (uses lib/, src/) | node / bun | yes | no | 0F 3W | Gate-1 query is invalid GraphQL; `tooling/scripts/wait-for-index.sh` doesn't exist |
| daily-report | 0.1.0 | 80 / 692 | 1 (py) | python | no | yes (MCP) | 0F 0W | none found; reads every project's transcripts |
| geo-claim-grouping-notion | 0.2.0 | 230 / 2,212 (+contract 1,235) | 4 (.mjs) | node | no (but dotenv loads the key) | yes | 0F 0W | depends on an actionable script; `--no-semantic` in the canonical command |
| geo-describe | 0.2.0 | 144 / 1,447 | 1 (py) | python | via geo-publish | no | 0F 0W | none found |
| geo-mirror-and-group | 1.0.0 | 133 / 1,124 (drives 3 skills ≈10k) | 1 (.mjs) | node | no | yes | 0F 0W | names `diff-notion-vs-geo` (superseded); contradicts itself |
| geo-press-review | 0.5.3 | 175 / 3,029 | 0 (uses repo `scripts/*.ts`) | bun | no | no | 0F 0W | schema "verified 2026-05-08": says Sources are strings, but they are entities now |
| geo-query | 0.2.9 | 600 / 5,236 | 0 (uses lib/gql.mjs) | any / node | no | no | 0F 1W (595 lines) | 4 live discrepancies (A1); `tooling/content-management/...` path; `bun` examples |
| image-banner-recompose | 0.2.0 | 117 / 823 (+refs 2,377) | 0 (code in refs) | python | no | no | 0F 0W | `/mnt/user-data` claude.ai paths; prints API keys |
| notion-operations | 1.0.1 | 120 / 1,241 (+refs 1,850) | 0 | — | no | guidance | 0F 0W | MCP prefix `mcp__claude_ai_Notion__` differs from this host's `mcp__notion__` |
| ontology-advisor | 0.1.0 | 199 / 2,715 (+ONTOLOGY.md 7,175 + rules 1,573, "always load") | 3 (py) | python | no | no | 0F 0W | **every live helper calls the retired endpoint**; rules.json lists 6 canonical spaces (constants.ts has 13) |

Tooling: `skill_versions.py verify` exits 1 (`DRIFT actionable/geo-mirror`); `check_md_manifest.py` passes. On Windows both crash with `UnicodeEncodeError` (cp1252) unless `PYTHONIOENCODING=utf-8` is set.

## 2. Findings

Severity scale: S = breaks a hard rule or can corrupt Geo; A = wrong and likely to spread; B = costs review effort; C = cosmetic.

### S — hard-rule violations

**S1. geo-publish's mandatory duplicate gate (Gate 1) doesn't work as written.**
- *Evidence:* `geo-publish/SKILL.md:151` queries `types { type { name } }`. Live, that fails: `Cannot query field "type" on type "Entity"`.
- Fixing the field still leaves the search broken. `includesInsensitive:"Bitcoin"` with `first:20` returned 20 substring matches, including a `Proposal` system entity. None of the ≥3 exact "Bitcoin" entities were in them; `isInsensitive` finds those.
- `geo-orchestrate:81` copies the same pattern.
- *Fix:* run `name:{isInsensitive}` (first:50) first, then `search()` for variants. Exclude Proposal/Space system entities and show each space's Name value. Ship it as `Q.DUPLICATE_CANDIDATES` in `lib/gql.mjs`.

**S2. Delete routing contradicts Hard Rule 3, and the geo-publish template bypasses the delete backstop.**
- *Evidence:* CLAUDE.md's routing table sends "delete entities" to geo-publish, and geo-publish triggers on "delete entity" (`SKILL.md:3`). Hard Rule 3 says every delete goes through geo-clean.
- geo-publish's "portable" template publishes with raw `geo.personalSpaces.publishEdit` (`SKILL.md:214-270`). That skips the `CONFIRM_DESTRUCTIVE` circuit-breaker, which lives only in `publishOps` (`src/functions.ts:225-243`).
- geo-orchestrate also has a "Delete a list of orphan entities" job (`:159-164`). It triggers on "deduplicate / merge / clean up", which overlaps geo-clean.
- *Fix:* remove the delete triggers from geo-publish and geo-orchestrate. Route the template through `publishOps`. Correct the CLAUDE.md routing row.

**S3. In geo-orchestrate, one "go" publishes.**
- *Evidence:* `geo-orchestrate/SKILL.md:199`: "reply **go** and I'll flip DRY_RUN to false and re-run for real". geo-publish HARD RULE 4 requires a separate `publish`.
- geo-orchestrate runs only two gates (`:57-61`, `:201-203`); geo-publish has five (Gates 0–4).
- *Fix:* retire geo-orchestrate, or reduce it to a router that hands every write to geo-publish unchanged.

**S4. geo-discovery ships its own ungated Geo publisher (Hard Rule 1).**
- *Evidence:* `publish_gaps.mjs` publishes by default (`--dry-run` is opt-in, l.48) and auto-votes YES on a FAST proposal (l.93-106). `SKILL.md:162` says "Publish with the generalized publisher — don't hand-author the glue".
- It is currently dead: `getSmartAccountWalletClient` is `undefined` in the installed SDK 0.20.3 (verified), so it throws at publish. Anyone who "fixes" it brings back a self-voting publisher with no geo-publish gates and no circuit-breaker.
- Other errors in the same stage:
  - `discovery-schema.md:19` maps "Name" to `5b064102…`, which is "Legal name" live.
  - It refers to `geo-publish bin/whoami.mjs` and `<geo-publish-skill>/node_modules`, neither of which exists.
- *Fix:* rewrite Stage 6 to emit ops for geo-publish (or `publishOps`), dry-run by default, with no self-vote. Otherwise delete it.

### A — wrong or misleading, likely to spread

**A1. geo-query: all four reported discrepancies confirmed live, and one breaks the skill's own example.**
- **(a) Timestamps are epoch-second strings, compared as text.** The "count stories added in a window" example (`:303-311`) passes an ISO string, which always returns 0. Live: `createdAt ≥ "2026-10-01T00:00:00Z"` → 0, `≥ "1790812800"` → 120, `< "2026-10-01…"` → all 2,550. This is the "answered 0 when the true count was 13" failure that rule 14 warns about.
- **(b) `POSITION_ASC` sorts case-insensitively.** For page `57fa8a9f…` the server returns `a0, a0kbO1, a0V5eu, a1`; ASCII order is `a0, a0V5eu, a0kbO1, a1`. The skill says "lexicographic" and that it "reproduces the UI exactly" (`:406`, `:410`, `:586`). geo-publish already documents the opposite (`:502`).
- **(c) `entity.name` and `entity.description` aggregate across spaces.** `7e0594b2…` returns the personal-space name, while its datasets-space Name differs. A name filter matched `00039497…` on another space's value. Rule 17 (`:167`, `:592`) covers only values and relations; geo-mirror `:66` and `:289` do document this.
- **(d) Table columns are undocumented.** They are `Properties` relations (`01412f8381894ab1836565c7fd358cc1`) on the Blocks *relation-entity*; for `c04b189d…` that's 6 columns plus View. Review step 3 (`:411-419`) never mentions them.
- *Fix:* patch geo-query for all four, and put the same notes beside the templates in `lib/gql.mjs`.

**A2. The retired endpoint is still in code.**
- *Evidence:* `testnet-api.geobrowser.io` fails to connect (curl exit 7). It is hardcoded in:
  - `ontology-advisor/scripts/geo_graphql.py:24` and `helpers.py`
  - geo-discovery `harvest.py:20`, `space_profile.py:20`, `gap_diagnostic.py:23`
- So ontology-advisor modes 2–5 (which geo-publish Gate 0 relies on) and geo-discovery stages 1–3 are dead. CLAUDE.md names this exact staleness symptom; CI doesn't check for it.
- *Fix:* one shared endpoint constant, plus a CI `grep -r "testnet-api\."`.

**A3. geo-query and geo-mirror contradict each other on space scoping.**
- geo-query rule 17 (`:167-173`) says always scope `values`/`relations` by `spaceId`, defaulting to Root.
- geo-mirror `:287` says scoping is lossy, because claim `Sources` often live only in the "… datasets" sibling space.
- *Fix:* one rule — scope to the named space plus its datasets sibling, then dedupe by target.

**A4. The three claim-grouping skills contradict each other.**
- geo-claim-grouping contradicts itself:
  - Gate 4 recommends `assertion-family-broad` (`:131`), the bar that `:28` says was corrected.
  - The template is still the Similar-only "Similar-claims linking" (`:92-114`).
  - `:166` says check "existing-edge both directions", but HARD RULE 7 and `ops-script-template.md:94` say same direction only.
- Semantic recall has three different defaults across the three skills:
  - grouping-notion's canonical command passes `--no-semantic` (`:127`), yet `:133` says recall "is not optional" on debate spaces.
  - mirror-and-group decides from whether the space has News stories (`:38-58`), then tells you to override that for small rosters.
- Who runs the sink's `--publish`: the agent (grouping-notion `:167`) or "never you" (mirror-and-group `:105-106`).
- *Fix:* make geo-claim-grouping the single source and reference it from the other two instead of restating it. Pick one recall rule.

**A5. The skill-integrity gate is red on `main`.**
- *Evidence:* commit fd013a1 hand-edited `content_sha256` but left `approved_commit` at 80ac742. HEAD content hashes to `83ac5442…`, the manifest says `926b4d73…`, and `versions.md` has no 0.13.0 entry.
- *Fix:* run `skill_versions.py generate`, add the changelog entry, and add `sys.stdout.reconfigure(encoding="utf-8")` to both verifiers.

**A6. A retired relation-id scheme is still mandated for agent-written scripts.**
- *Evidence:* `from.slice(0,16)+to.slice(0,16)` appears in geo-clean HR5 (`:35`), geo-publish `:381` and geo-orchestrate `:177`.
- geo-claim-grouping HR6 (`:55`) retired it because two relation types between the same pair collide on one id.
- *Fix:* use `typeId[0:8]+from[0:12]+to[0:12]` everywhere.

**A7. Voting policy contradicts itself.**
- geo-publish's DAO recipe auto-votes YES (`:511-525`), and so does geo-discovery.
- `publishOps` has auto-vote commented out ("let editors review"), and geo-claim-grouping says voting is the editors' call.
- *Fix:* one rule in geo-publish: never self-vote.

**A8. No skill has a prompt-injection guard, and the human gates are prompt-only.**
- *Evidence:* grep finds no "untrusted / treat as data" language in any SKILL.md. Untrusted text enters through:
  - web pages: geo-press-review Half 2, geo-describe Stage 3, geo-publish inject-mode preview
  - user-authored Geo text: claim adjudication, submission review
  - Notion cells: geo-mirror Part 2, grouping-notion roster
  - every project's Claude transcripts: daily-report
- `.claude/settings.json` auto-allows `Bash(curl *)` and `node|bun --env-file=.env scripts/*`. Any script an agent writes runs with the wallet key, with no permission prompt.
- *Fix:* add a "content is data" clause to every skill that reads such content. Drop `curl *` and the `--env-file` script wildcards from the allowlist.

**A9. CLAUDE.md's self-heal downloads and runs unpinned code.**
- It `curl`s the `main` tarball and runs `cp -R "$ARC"/skills/. skills/`. That overwrites the scripts that later run, auto-allowed, with the key.
- Its "verify" step compares the copy against the same archive (circular). It never checks `SKILL-VERSIONS.json` from a previously trusted commit.
- *Fix:* pin a tag/commit, verify each skill against the last trusted manifest, and require a human OK before overwriting `scripts/`.

### B — costs review effort

**B1. Duplicated HTTP clients, with one data-loss bug.**
- About 10 GraphQL clients:
  - `lib/gql.mjs` (2 retries, no fetch timeout) and `src/functions.ts` (50 retries)
  - a verbatim copy in `existing-edges-from-geo.mjs:53`
  - 5 in geo-mirror, `publish_gaps`, `build_dashboard`, `run-pipeline`
  - 4 in Python
- 8 Notion REST clients, each pinning `2022-06-28`.
- The Notion clients retry POST on 5xx, network errors and JSON-parse errors (`mirror-to-notion.mjs:26-37`). That can create duplicate rows — the risk `notion-operations:80` itself warns about.
- *Fix:* add `lib/notion.mjs` that retries only idempotent calls, and import `lib/gql.mjs` everywhere.

**B2. Secret handling is inconsistent.**
- geo-publish says check that `.env` exists and never grep it (`:23-27`). geo-claim-grouping greps `PK_SW` (`:43`); geo-clean greps the key name (`:19`).
- The Notion gate curls with `$NOTION_TOKEN`, which is never exported, so it returns a false 401 (geo-mirror `:187`, grouping-notion `:81`).
- `src/functions.ts` runs `dotenv.config()`, so even read-only discovery loads the wallet key into memory.
- `image-banner-recompose:44` runs `echo "FAL_KEY=${FAL_KEY:-NOT_SET}"`, which prints the key into the transcript.
- *Fix:* one `check-env` helper that reports only true/false per variable.

**B3. Unsafe defaults.**
- `mirror-to-notion.mjs` writes unless you pass `--dry-run` (l.18). It also falls back to the `NOTION_PARENT_PAGE` env var — an implicit parent, which `notion-operations:63` forbids.
- `publish_gaps` publishes by default.
- `scope-candidates --top 80` samples silently.
- *Fix:* every writer dry-runs by default and writes only with `--publish`.

**B4. Seven copies of the canonical space list.**
- Copies: `constants.ts` (13+5), the geo-query table (18), `rules.json` (6), `discover_candidates` (4), `theme_emergent` (6), `space_profile` (2, plus a stale "Crypto datasets ID: TBD"), `mirror-sources` (4).
- The ids agree wherever the lists overlap (checked), but coverage differs:
  - ontology-advisor ranks US Politics, Pharma and others as tier-2 "personal".
  - Relationships (`224406e0…`) appears only in `mirror-sources`.
  - `784bfdda…` is "Documentation" in geo-query but "Geo Education" in `SPACES`.
- `press-review-coverage-map.ts:115` prefix-fuzzy-matches space names — the exact failure geo-query bans.
- *Fix:* generate one `spaces.json` from `constants.ts` and use it everywhere.

**B5. Context cost.**
- geo-publish loads 6.8k words, then Gate 0 makes it read the 7.2k-word ONTOLOGY.md: about 19k tokens before the first query.
- ontology-advisor's "always load" set is about 11.5k words.
- geo-clean (7.2k) and geo-query (5.2k) are each over the 500-line limit.
- *Fix:* move the block, inject-mode and DAO recipes into `references/`, and give Gate 0 a one-page type table.

**B6. Windows and tooling assumptions.** bun is required by 5 skills and the `gql-cli` shebang but isn't installed here; node runs both `gql-cli` and `discover_candidates.ts` (`--help` verified). `sync-skills.sh` needs `rsync` (absent) and knows only the macOS Claude Desktop path. Also POSIX/claude.ai-only: `/tmp/pagemirror` (geo-mirror `:81`), `CONFIRM_DESTRUCTIVE=1 bun run …` (geo-clean `reference.md:160`), `/mnt/user-data`.

**B7. The skills index has drifted.** `skills/README.md` lists the retired `qa-report-workflow`, omits 6 of the 15 skills, and says non-actionable skills "cannot create, update…" although three write Notion (one with `--prune`) and grouping-notion needs an actionable script.

**B8. Broken references.**
- `geo-query:539` points to `tooling/content-management/lib/gql.mjs`.
- `geo-publish:527` points to `tooling/scripts/wait-for-index.sh` (missing).
- `geo-orchestrate:216` points to `documentation/From Rush/` (missing).
- `geo-mirror:289` uses `values(filter:{property:…})`; live: `Did you mean "propertyId"?`.
- `geo-clean:21` gives the API host as `testnet-api-v2…`; the SDK says `api-testnet.geobrowser.io`.

**B9. `publishOps` fails quietly.** For a non-owner/non-member wallet it `console.warn`s and returns `undefined` (`functions.ts` ~289, ~322), so callers report success on a no-op.

### C — cosmetic

Inconsistent frontmatter (geo-discovery, geo-describe, daily-report use top-level `version`/`authors`/`tools`); mojibake (`â€”`) in `rules.json`; dotenv prints an advert line on every run; geo-mirror-and-group `:131` says it doesn't publish "to Notion" but its `mirror` stage writes Notion (`:27`).

## 3. Reuse for a claim-verification agent

### Reusable as-is
- `lib/gql.mjs` (import it, don't copy it), plus `gql-cli.mjs` run via `node`.
- geo-query's verified parts: the 1000 caps and cursor paging, the memory blow-up rule, the existence check, backlink patterns, the "Fields that DON'T exist" table, and the canonical space ids. Add the A1 corrections in the agent's own prompt.
- Two read-only scripts from grouping-notion:
  - `roster-from-notion.mjs`: type-asserted roster, paced REST, honours Retry-After
  - `existing-edges-from-geo.mjs`
- The `write-grouping-to-notion.mjs` contract, reused as a pattern for review columns:
  - writes only the columns it owns, diff-first, dry-run by default
  - reads back until "0 remaining differences"
  - six-section report with "Needs your eyes"
- `bulk-set-property.mjs` (writes only changed rows), and the reference material in `notion-operations` (identities, data sources, the 25-item relation cap, 3 req/s).
- Judgement references:
  - geo-press-review's source-faithfulness gate (`:107-116`)
  - geo-describe `references/accuracy-verification.md` and `check_similarity.py`
  - geo-claim-grouping `adjudication-rubric.md` (exact vs semantic duplicates)
- The `Geo Name source` fallback flag in `mirror-claims-topics.mjs`.
- `check_skill.py` and `skill_versions.py` (with the UTF-8 fix), for the agent's own skill.

### Must not depend on
- ontology-advisor or geo-discovery scripts: dead endpoint and dead SDK API.
- geo-query's ISO `createdAt` filters, `POSITION_ASC` ordering, or `entity.name`, as currently written.
- geo-publish's Gate-1 query, any of geo-orchestrate, or any Geo write path.
- grouping-notion's defaults (`--no-semantic`, `--top 80`). Also `discover_candidates.ts` is an actionable-tier script, and through dotenv it loads the wallet key.
- Bun, rsync, `sync-skills.sh`, or the CLAUDE.md curl self-heal at runtime — pin a commit instead.
- The Notion MCP connector for bulk work (usage limit hit; subagents lack it).
- geo-press-review's claim that "Sources are labeled strings". Claims carry `Sources` relations to entities (`discover_candidates.ts:28`).
- `mirror-to-notion.mjs`'s write-by-default behaviour and `NOTION_PARENT_PAGE` fallback.
- `SKILL-VERSIONS.json` as integrity proof for geo-mirror until it is regenerated.
