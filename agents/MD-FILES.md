# MD file manifest — content-management

Every Markdown file in this repository: what it contains, who reads it, and when it is loaded. This is the repo-side answer to "provide a list of all MD files and their contents"; the Notion [Agent Composition](https://app.notion.com/p/3dc273e214eb814088b8de2e3184f988) catalog links to the same files and must not become a second copy of them.

**The repository is the canonical source.** Where a Notion row and a file disagree, the file wins. Never distribute a file by pasting it somewhere else; link to it, and re-sync installs with `bash skill-dev/sync-skills.sh`.

**Loading trigger** is how a file reaches an agent:
- **Automatic** — the host loads it without being asked (`CLAUDE.md` in Claude Code).
- **On routing** — the agent opens it because an entry point or skill points at it.
- **On demand** — read when the task calls for it.
- **Not distributed** — kept in the repo for maintainers; never part of an agent's instructions.

---

## 1. Entry points — read first

| File | Contents | Read by | Trigger |
|---|---|---|---|
| `CLAUDE.md` | Skill routing table, the four hard rules (no hand-written Geo writes, self-heal a missing skill, deletes only via geo-clean, never touch the private key), self-heal procedure, route to `agents/` | Every agent | Automatic in Claude Code; other hosts reach it from `README.md` |
| `README.md` | Setup runbook: install, the security contract, where skills go per host, skills index, entity-operations toolkit, project structure | Every agent and every human setting up | On routing — first file for a non-Claude agent |

## 2. Agent contracts — `agents/`

| File | Contents | Read by | Trigger |
|---|---|---|---|
| `agents/AGENT-WORKFLOW.md` | Operating contract for the Agents flow Notion teamspace: page IDs, the task lifecycle (log → In progress → result + link → Done), Work tracker and QA tracker fields with exact option values, hard rules, known traps | Every agent working in that teamspace | On routing — before any teamspace work |
| `agents/README.md` | What an agent definition file is, where to install it, index of the agents in this repo | Anyone creating or installing an agent | On demand |
| `agents/geo-research.md` | The geo-research agent definition: research a question under the trusted-sources allowlist and return a cited draft. Read-only; never publishes | Loaded as an agent, not read as a doc | On routing |
| `agents/geo-mirror-refresh.md` | The mirror-refresh agent: refresh the "- new" Notion mirrors or mirror a space into a Notion page, then report what changed. Reads Geo, writes Notion, never publishes | Loaded as an agent | On routing |
| `agents/MD-FILES.md` | This manifest | Maintainers; agents looking for the right document | On demand |

## 3. Skills — `skills/`

Each skill is one `SKILL.md` with YAML frontmatter (`name`, `version`, `description`). The description decides when a skill is triggered. Versions below were current on **18 September 2026**; `skills/versions.md` holds the changelog and `skills/SKILL-VERSIONS.json` the approved hashes.

| Skill | Version | Contents | Key needed |
|---|---|---|---|
| `skills/non-actionable/geo-query/SKILL.md` | 0.2.9 | Query the graph over GraphQL: lookups, type/space scoping, relations, schema discovery, performance rules, canonical space IDs | no |
| `skills/non-actionable/ontology-advisor/SKILL.md` | 0.1.0 | Modelling advice: reuse vs new type, property choices, relation vs value, duplicate and drift checks | no |
| `skills/non-actionable/geo-press-review/SKILL.md` | 0.5.3 | Compare press coverage with Geo and recommend what to publish next | no |
| `skills/non-actionable/geo-describe/SKILL.md` | 0.2.0 | Verified, original entity descriptions at scale, with copyright and accuracy gates | no |
| `skills/non-actionable/image-banner-recompose/SKILL.md` | 0.2.0 | Recompose any image into a 2364×640 Geo banner | no |
| `skills/non-actionable/daily-report/SKILL.md` | 0.1.0 | The editor's end-of-day Notion update routine | no |
| `skills/actionable/geo-publish/SKILL.md` | 0.11.0 | Create, update and delete entities and relations. Mandatory gates (ontology/type, duplicate, schema, relation-target, type-required) and the two-phase dry-run report → publish | **yes** |
| `skills/actionable/geo-clean/SKILL.md` | 0.5.0 | Merge duplicates, delete orphans, move entities, fix data types, with anchored-entity protection | **yes** |
| `skills/actionable/geo-mirror/SKILL.md` | 0.11.0 | Geo ⇄ Notion. Part 1 mirrors any entity type into Notion; Part 2 publishes changes back from any table with a `Geo ID` column | **yes** (Part 2) |
| `skills/actionable/geo-claim-grouping/SKILL.md` | 0.6.0 | Group claims: adjudicate Similar/Duplicate relations and publish the decisions | **yes** |
| `skills/actionable/geo-orchestrate/SKILL.md` | 0.2.0 | Turn natural-language intent into a query plan, publish plan and script | **yes** |
| `skills/actionable/geo-discovery/SKILL.md` | 0.1.1 | Gap-discovery passes over a space, published as Gap finding entities | **yes** |

### Skill reference files — loaded by their own skill only

| File | Contents |
|---|---|
| `skills/actionable/geo-claim-grouping/references/adjudication-rubric.md` | How to decide Similar vs Duplicate vs neither |
| `skills/actionable/geo-claim-grouping/references/ops-script-template.md` | Ops-script template and the decisions contract |
| `skills/actionable/geo-claim-grouping/references/queries-and-signals.md` | Verified query shapes, signals and scoring |
| `skills/actionable/geo-clean/reference.md` | Long-form geo-clean reference kept out of the main body |
| `skills/actionable/geo-clean/big-merge.md` | Manual procedure for a large merge |
| `skills/actionable/geo-discovery/references/discovery-schema.md` | Gap finding entity schema |
| `skills/actionable/geo-discovery/references/drafting-conventions.md` | Drafting conventions for gap findings |
| `skills/actionable/geo-discovery/references/ner_prompt.md` | Candidate-extraction prompt |
| `skills/actionable/geo-discovery/references/stage6-publish.md` | DAO publish mechanics and gotchas |
| `skills/non-actionable/geo-describe/references/description-rules.md` | The Geo description rules |
| `skills/non-actionable/geo-describe/references/accuracy-verification.md` | How facts are verified before writing |
| `skills/non-actionable/geo-describe/references/closeness-and-accuracy-checks.md` | Copyright-closeness and accuracy gates |
| `skills/non-actionable/geo-describe/references/copyright-and-licensing.md` | Copyright and licensing rules |
| `skills/non-actionable/image-banner-recompose/references/strategies.md` | Recomposition strategies |
| `skills/non-actionable/image-banner-recompose/references/qa_check.md` | QA pipeline for the output |
| `skills/non-actionable/image-banner-recompose/references/api_endpoints.md` | API endpoints used |
| `skills/non-actionable/ontology-advisor/README.md` | How to run the ontology-advisor scripts |

## 4. Ontology and standards — the judgment layer

| File | Contents | Read by | Trigger |
|---|---|---|---|
| `skills/non-actionable/ontology-advisor/references/ONTOLOGY.md` | The full Geo ontology guide: principles, rules, types vs properties vs relations, worked judgments. The prior for every modelling decision | Content, data and quality agents | On demand, and by ontology-advisor |
| `knowledge-graph-ontology.md` | The ontology specification: entities, properties, relations, data types, spaces. Structural reference behind the SDK | Data and schema agents | On demand |
| `skill-dev/skill-quality-check/references/skill-quality-standard.md` | The skill authoring and validation standard the linter enforces | Anyone writing or reviewing a skill | On demand |

## 5. Maintainer documents — not agent instructions

| File | Contents |
|---|---|
| `skills/README.md` | What the skills folder is, the actionable/non-actionable split, how to add a skill |
| `skills/versions.md` | Per-skill changelog: what changed, why, and the evidence. Paired with `SKILL-VERSIONS.json` |
| `skill-dev/README.md` | Maintainer tooling: version manifest generator, quality linter, `sync-skills.sh` |
| `skill-dev/skill-quality-check/SKILL.md` | The linter itself, packaged as a skill |

## 6. Project documentation — `documentation/`

| File | Contents |
|---|---|
| `documentation/research-agent-mvp.md` | The geo-research agent spec: scope, inputs, outputs, acceptance |
| `documentation/research-agent-allowlist.md` | The trusted-sources allowlist the research agent must stay inside |
| `documentation/research-agent-source-policy.md` | How sources are judged, cited and ranked |

## 7. Not distributed — run artifacts

| File | Why it is excluded |
|---|---|
| `output/fix_properties/ASSIGNMENTS.md` and `output/fix_properties/<id>/README.md` (8 files) | Output of one past cleanup run. Historical evidence, not instructions |
| `todo.md` | A scratch note |

---

## Keeping this current

- **Adding an MD file:** add a row here in the same pass, and a row in the Notion catalog only if agents outside this repo need to find it.
- **Changing a skill:** bump `version` in its `SKILL.md`, add a line to `skills/versions.md`, regenerate `skills/SKILL-VERSIONS.json`, and update the version in section 3.
- **Before trusting an install:** compare the installed `SKILL.md` version with this file. A mismatch means the install is stale — run `bash skill-dev/sync-skills.sh` and restart the host. Two agents running different versions of the same skill will overwrite each other's work.

*Counts on 18 September 2026: **56** tracked `.md` files — 2 entry points, 5 agent contracts, 12 skills, 17 skill reference files, 3 ontology/standard documents, 4 maintainer documents, 3 project documents, 9 run artifacts and 1 scratch note. Every tracked file appears in exactly one section above.*
