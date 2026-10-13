# MAINTAINERS.md — content-management

For the people who maintain this repository. Editors and agents do not need this file.

This repository is becoming a **skills library**. Agents are moving to `geo-explorers/geo-agents`. This file records what belongs here and what does not. The procedures for changing a skill and for cutting a release are added in migration step 2.

## Bucket list — what belongs in this repository

**Inventory date:** 13 October 2026 · **commit:** `4aa5d75` · **tracked files:** 234.

Every tracked file sits in exactly one bucket. The rule for each bucket:

| Bucket | Rule | Files |
|---|---|---|
| **A · Skill** | Inside a skill folder, or one of the three skill index files. Stays. | 88 |
| **B · Shared code** | Outside a skill folder, and at least one skill calls it or points to it, or it maintains such a file. Stays for now. | 14 |
| **C · Library tooling** | Needed to build, check or install the library itself. Stays. | 21 |
| **D · Leaves at cut-over** | Neither a skill nor called by one. Removed in migration step 6. | 49 |
| **E · Temporary** | Migration working notes. Removed when the migration is finished. | 62 |

The migration plan names three buckets: skill, shared code, neither. Bucket C is added here because files such as `package.json` and `skill-dev/` are none of the three. Bucket E is separate from D because it leaves later.

### A · Skills — stay (88 files)

| Path | Files | Note |
|---|---|---|
| `skills/actionable/geo-claim-grouping/` | 6 | |
| `skills/actionable/geo-clean/` | 4 | |
| `skills/actionable/geo-discovery/` | 16 | |
| `skills/actionable/geo-mirror/` | 12 | |
| `skills/actionable/geo-orchestrate/` | 2 | |
| `skills/actionable/geo-publish/` | 2 | |
| `skills/non-actionable/daily-report/` | 3 | |
| `skills/non-actionable/geo-claim-grouping-notion/` | 7 | |
| `skills/non-actionable/geo-describe/` | 7 | |
| `skills/non-actionable/geo-mirror-and-group/` | 3 | |
| `skills/non-actionable/geo-press-review/` | 2 | |
| `skills/non-actionable/geo-query/` | 2 | |
| `skills/non-actionable/image-banner-recompose/` | 5 | |
| `skills/non-actionable/notion-operations/` | 5 | |
| `skills/non-actionable/ontology-advisor/` | 9 | |
| `skills/README.md` | 1 | Skills index |
| `skills/SKILL-VERSIONS.json` | 1 | Integrity manifest |
| `skills/versions.md` | 1 | Changelog |

Fifteen skills, 85 files, plus three index files.

### B · Shared code a skill calls — stays for now (14 files)

Each row names the skills that depend on the file. A file leaves this bucket only when no skill depends on it.

| Path | Used by |
|---|---|
| `src/functions.ts` | geo-publish, geo-clean, geo-claim-grouping, geo-claim-grouping-notion, geo-mirror, geo-orchestrate, geo-query |
| `src/constants.ts` | geo-clean, geo-claim-grouping, geo-orchestrate, geo-query |
| `src/entity_ops.ts` | geo-clean, geo-orchestrate |
| `src/select_canonical.ts` | geo-clean |
| `src/xlsx-to-csv.cjs` | geo-publish |
| `lib/gql.mjs` | geo-query, geo-claim-grouping-notion |
| `lib/gql-cli.mjs` | geo-query |
| `lib/inject.ts` | geo-publish (inject mode) |
| `validate_migration.ts` | geo-clean |
| `scripts/notion-read.mjs` | notion-operations |
| `scripts/press-review-coverage-map.ts` | geo-press-review |
| `scripts/inject-publish-example.ts` | geo-publish (named as the inject-mode example) |
| `scripts/check-space-list.ts` | No skill. Read-only check that the space list in `src/constants.ts` still matches Geo; kept as upkeep for that file |
| `knowledge-graph-ontology.md` | geo-publish, geo-query (reference document) |

None of these files imports anything from bucket D.

### C · Library tooling and repository files — stay (21 files)

| Path | Files | What it is |
|---|---|---|
| `skill-dev/` | 8 | Linter, integrity manifest tools, Markdown manifest check, local install script |
| `agents/MD-FILES.md` | 1 | Manifest of this library's Markdown files. Moves out of `agents/` in step 6, because that folder is removed |
| `.github/workflows/verify-skills.yml` | 1 | Integrity check |
| `.github/workflows/discord-notify.yml` | 1 | Change feed to Discord |
| `.claude/settings.json` | 1 | Auto-approve allowlist |
| `CLAUDE.md` | 1 | Entry file: routing and hard rules |
| `README.md` | 1 | Setup runbook |
| `LICENSE` | 1 | |
| `package.json`, `package-lock.json`, `bun.lock`, `tsconfig.json` | 4 | Toolchain |
| `.gitignore`, `.env.example` | 2 | |

### D · Leaves at cut-over, migration step 6 (49 files)

| Path | Files | Where it goes |
|---|---|---|
| `01_entity_operations.ts` … `11_fix_duplicate_subtopics.ts` | 13 | Deleted. Git history keeps them. Includes `02.3_export_no_type.ts` and `02.5_full_space_scan.ts` |
| `testing.ts` | 1 | Deleted |
| `todo.md` | 1 | Deleted |
| `scripts/2026-07-28-sdk-v020-migration-check.ts` | 1 | Deleted. A dated one-off check for the July SDK migration; no skill calls it |
| `output/` | 26 | Deleted. Output of one past clean-up run |
| `agents/geo-research.md` | 1 | Moves to `geo-agents/agents/geo-research/` in step 5 |
| `agents/geo-mirror-refresh.md` | 1 | Moves to `geo-agents/agents/geo-mirror-refresh/` in step 5 |
| `agents/AGENT-WORKFLOW.md` | 1 | Moves to `geo-agents/workflow/` in step 5; its ids go to `ids.json` |
| `agents/README.md` | 1 | Replaced by the `geo-agents` README |
| `documentation/` | 3 | Moves to `geo-agents/docs/` in step 5. All three files belong to geo-research |

No skill runs any of these files. One skill, geo-orchestrate, names `03_merge_duplicates.ts` in a sentence as a style example.

**Also in the step 6 pull request.** `agents/MD-FILES.md` moves out of `agents/` before the folder is removed, and its new path is set in `skill-dev/check_md_manifest.py` and `.github/workflows/verify-skills.yml`. These bucket C files mention `agents/` or `documentation/` and will point at nothing once the folders are gone: `CLAUDE.md`, `README.md`, `skill-dev/README.md`, `skill-dev/check_md_manifest.py`, `.github/workflows/verify-skills.yml`, `skill-dev/skill-quality-check/evals/evals.json`. `README.md` also documents the numbered scripts in its "Entity operations toolkit" section.

### E · Temporary — removed when the migration is finished (62 files)

| Path | Files |
|---|---|
| `audit/` | 46 |
| `audit-2/` | 16 |

Working notes from the 9 and 11 October audit sessions. They are the source of the migration plan and stay until the last step is done.

## Changing a skill

To be written in migration step 2.

## Cutting a release

To be written in migration step 2.
