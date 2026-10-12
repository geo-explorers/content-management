# Interview — question bank, batches, and running assumptions (DRAFT, phase 1)

Status: drafting while fetches complete. Batches of 5–8, most important first, only things the docs don't answer.

## Facts already established (do NOT ask)
- Team: Claude Max, agents run locally (scheduled commands / manual skill invocation in Claude Code or Cowork).
- MVP = claim verification on the Notion Claims mirror (World affairs), no Geo connection.
- Big picture = bounty submission review across multiple proposals; two bounty kinds (reuse ontology vs new ontology); ontology docs to come later.
- Required capabilities: geo skills, web access, standardized reporting.
- Bounty = Geo entity of type Bounty (808af0ba…) with Task status / Difficulty / Bounty budget / Creator / Maintainers + Blocks body. Curator API (curator-api-staging-testnet.up.railway.app) has /space/<s>/bounty/<b>/submissions.
- Bounty A has explicit per-claim acceptance rules; Bounty B (dataset import) has none.
- Agent Composition catalog: roles taxonomy (Quality review agents exists), AI workflows w/ Stage enum, a second repo geo-editor-agent vendors the skills.
- geo-research = prior "Basic Agent MVP" (model + web search + allowlist/source policy, read-only, cited draft).
- AGENT-WORKFLOW.md mandates Work tracker + QA issue tracker logging.

## Candidate questions (to be pruned/ordered after claims-mirror + specs are read)
### MVP (claims)
- Q: What does the MVP OUTPUT look like and WHERE does it land? (Proposed-style review columns on the Claims mirror like geo-claim-grouping-notion does? A separate "Verification" DB? A report page?) Who consumes it (editor approving in Notion)?
- Q: What is the verdict vocabulary? (e.g. Verified / Partially / Unverifiable / False / Needs editor) — or is it defined in the specs table? [check specs first]
- Q: Source policy: must the MVP cite only the research-agent allowlist (134 domains) / "sources approved by the space", or any reputable web source? Is the claim's existing Geo Sources relation the primary evidence to check, with web search secondary?
- Q: Scope/volume: how many claims per run (all rows? only rows with empty verification columns? only Debate-tagged)? Expected cadence (scheduled vs on-demand)?
- Q: Success criteria for the MVP: who judges, what is "good enough" (precision over recall?), is there a labelled sample?
- Q: Identity for writing to Notion: integration token (NOTION_TOKEN; subagent-safe) vs MCP connector (main session, editor identity)? Does the team have the token? (.env missing on this machine)
### Big picture (bounties)
- Q: How does the agent find the proposals for a bounty — Curator API submissions, a relation on the Bounty entity, or a human-supplied list? Are proposals the unit (edits with diffs) — does Geo expose proposal diffs via GraphQL (Q.PROPOSALS exists in lib/gql.mjs)?
- Q: Who triggers a review and what happens with the verdict — advisory report to the maintainer (Catalin/Dan) or does it gate payout? Does the review itself get published to Geo as an entity (like the 3 example evaluations in dataset spaces)? [check evals]
- Q: For "new ontology" bounties: is ontology-advisor (+ ONTOLOGY.md) the intended judgment layer, pending the promised docs?
- Q: Multi-model/cost: Max subscription only → everything runs in Claude Code sessions; is API spend (Managed Agents, batch) acceptable later?
### Architecture / repo
- Q: Appetite for restructuring: may the design propose moving agents out of content-management (e.g. a separate agents repo or the geo-editor-agent repo), or must it stay here?
- Q: Deployment target preference: Claude Code subagent definition (agents/*.md) + skill, vs Claude Agent SDK app, vs Managed Agent — any constraints (no API keys? data residency?)
- Q: Which team members will RUN the MVP (technical level) — determines how much CLI vs prompt-only.
- Q: Windows users on the team? (sync-skills.sh is macOS/Linux; bun missing here)

## Running assumptions (will show before phase 2)
A1. The Notion Claims mirror in the brief was produced by geo-mirror `mirror-claims-topics.mjs` (space mode) → columns `Geo Name/ID/URL/Tags/Is factual/Score/Topics/Supporting…/Opposing…/Related people/projects/Sources` + `Proposed …` agent columns. [verify from fetch]
A2. MVP output should follow the established pattern: agent writes `Proposed …`-style review columns + a notes column, never touches `Geo …` columns; editor approves; nothing goes to Geo. [confirm]
A3. The MVP agent is read-only on Geo and the web; writes only to Notion (and local report files).
A4. "Standardized reporting" = conforms to the Notion Report-writing standard + AGENT-WORKFLOW task/QA logging. [verify after fetch]
A5. Big-picture agent is advisory: produces an evaluation for the bounty maintainer; humans decide payout/acceptance.
A6. Running environment for v1 = Claude Code on a team member's machine (Max subscription), optionally scheduled; no API-key spend assumed.
A7. The team wants to keep skills as the unit of reuse; the agent = orchestration + judgment on top of skills.

---
## BATCH 1 (sent 2026-10-09) — MVP output contract, scope, economics, big-picture linkage

1. MVP output contract: fill `Claim Tags — verified` + `Review notes` (+ who sets `Review status`)? Or a separate findings table in the Geo `Review finding` shape?
2. Prior AI tagger (Moh's pipeline, glm-5.3 benchmarks, 1,129 tags already on US Politics claims): reuse, replace, or benchmark against?
3. Tag groups in scope: text-only / deterministic / source-reading (needs Geo source URLs) / duplicate-vs-canonical / human-only. May the MVP read Geo (read-only)? Verified-only or Proposed tags too?
4. What "verify" means for Debate claims (all 1,911 are Debate): sources support the position / taxonomy+quality / bounty-rule compliance — rank.
5. Volume + cadence + economics: backlog vs incremental; scheduled vs on-demand; Claude Code sessions only (Max) vs API-key scripts allowed?
6. Notion write identity: integration token vs MCP connector; is the mirror connected to the integration?
7. Success criteria + judge + gold set.
8. Big picture: how submission→bounty→proposals is linked today; does the API expose proposal contents?

Answers (2026-10-09):
1. MVP sets the correct tag in the World Affairs claims Notion DB (for now).
2. Ignore the prior AI tagger (user not familiar with it).
3. MVP MAY make read-only Geo queries.
4. Rank C > A > B (bounty-rule compliance > sources contain the position > taxonomy/quality). The DB may be debate claims but could be swapped for another DB with the same schema; prototype must work with ALL kinds of claims.
5. Invoked on demand by an Editor. Propose BOTH execution modes: Claude Max subscription and Claude API.
6. Repo freshly cloned, MCP connected; assume NOTION_TOKEN will live in .env.
7. Agent proposes a Tag + Tag Confidence Score; humans evaluate in Notion after runs.
8. Need more info on bounty<->proposal linkage; assume it is possible. Mark `Need more info`.


## BATCH 2 (sent 2026-10-09) — output columns, rule source, invocation, evidence, confidence, modes, users, repo placement
1. Write to new `Proposed …` columns (+ confidence, notes) vs the human `Claim Tags — verified`; may the MVP create columns; one vs many tags; confidence per tag?
2. Rule source for "C" in the MVP: taxonomy only vs editor-supplied bounty text; report PASS/FAIL per rule?
3. Invocation shape, filters, batch size/resume, end-of-run report destination.
4. Evidence: attached sources only vs web search for corroboration vs allowlist; store evidence quotes?
5. Confidence semantics and abstain threshold.
6. Mode preferences: subagent/Haiku-Sonnet split on Max; API key budget + Batches API + model prefs.
7. Who runs it, OS, Cowork vs CLI, Windows support.
8. Repo placement appetite + dependency constraints.
Answers (2026-10-09):
1. Agree: create `Proposed Claim Tags` / `Tag confidence` / `Proposed tag notes` columns. One claim can have SEVERAL tags.
2. User asked for more context (re-asked in batch 3).
3. No reporting needed for the MVP (reporting is big-picture). Output = the updated Notion table. Set a default batch size with an override.
4. Evidence: ONLY the sources attached (no web search for corroboration).
5. Confidence 0–1, scored separately per tag per claim. Requesting editor input is welcome; I propose the shape.
6. Execution-mode design (Max vs API) left entirely to me; the area the user cares about most.
7. Claude Code CLI acceptable. No explicit Windows support needed if it runs through WSL.
8. Moving agents out of content-management "seems like a great idea".


## BATCH 3 (sent 2026-10-09) — rule source (with context), tag-set version, big-picture output, ontology layer, repo home, hosting constraints, eval harness
1. Rule source: taxonomy-as-rules vs editor-supplied rule text vs both (recommend both; taxonomy default).
2. Verified-only vs Proposed tags; duplicate tags (no spec) in or out of MVP.
3. Big picture: is the Geo `Review finding` page the standard output, published via geo-publish? Audience curator vs maintainer?
4. Ontology bounties: ontology-advisor + ONTOLOGY.md as the judgment layer until docs arrive?
5. New agents repo: fresh geo-explorers repo vs geo-editor-agent; content-management becomes a skills library?
6. Hosting constraints: is Anthropic-hosted (Managed Agents / cloud) acceptable in principle; data-leaving-machine concerns?
7. Eval harness + gold set: who labels, how many claims?
8. Anything the agent must NEVER do beyond the repo hard rules?
Answers (2026-10-09):
1. Reframe requested (re-asked with assumptions list).
2. VERIFIED tags only. DOCUMENT THIS DECISION in the final output.
3. Big-picture output = a new Notion page OR a Geo proposal; shape of the final report does not matter now. The review is FOR THE CURATOR to go back and make fixes.
4. REUSE ontology-advisor for ontology bounties. DOCUMENT THIS DECISION in the final output.
5. A NEW agents repository is ideal. content-management becomes a PURE SKILLS LIBRARY.
6. No hosting constraints.
7. Yes to an evaluation harness + gold set.
8. No extra hard limits at the moment.


## Decisions to document in the final output (user-flagged)
- D1. MVP applies only Status=Verified tags from "Claim Tags — verified" (13 tags); Proposed tags (14) and the two undefined duplicate tags are out of scope until verified.
- D2. Ontology-bounty reviews reuse the ontology-advisor skill (+ ONTOLOGY.md) as the judgment layer until the promised documentation arrives.
- D3. content-management becomes a pure skills library; agents move to a NEW agents repository.

## RUNNING ASSUMPTIONS — shown to user before phase 2 (2026-10-09)
Scope and data
- A1. MVP input = any Notion table with a title column + `Geo ID` column (schema-driven, claim-type-agnostic). Current target: "World affairs debate claims (1)" (1,911 rows, data source eec273e2…).
- A2. MVP output = three new agent-owned columns on that table: `Proposed Claim Tags` (relation → Claim Tags — verified), `Tag confidence` (per-tag 0–1, encoded alongside the tag), `Proposed tag notes` (evidence + reasons). `Claim Tags — verified`, `Review status`, `Review notes` stay human-owned. `Geo …` columns are never written.
- A3. Only the 13 Verified tags are applied (D1). Editor verified is never set by the agent.
- A4. Evidence = only the Sources attached to the claim on Geo (resolved via read-only geo-query to their web URLs); no web search for corroboration. A source that cannot be fetched → NOT-CHECKABLE, never a pass.
- A5. "Verify" = (C) rule compliance first, (A) sources contain the position, (B) taxonomy/quality. Rule source = taxonomy by default + optional editor-supplied rule text (pending Q1 reframe).
- A6. No run report for the MVP; the updated table is the deliverable. Default batch size with an override flag; runs are resumable (rows with empty `Proposed Claim Tags` are the work queue).
- A7. Editor-input shape (to be proposed by me): a per-row "needs editor" signal + question text, surfaced in the Notion table, no new tracker statuses invented.
Execution
- A8. On-demand invocation by an editor from Claude Code CLI (WSL acceptable; no native Windows requirement). Both execution modes are designed: Max-subscription session mode and API mode; I choose the split.
- A9. Notion writes use the integration token from `.env` (paced REST), not the MCP connector (bulk query limits observed). Geo access is read-only GraphQL.
- A10. No hosting constraints: hosted/Managed Agent deployment may be proposed.
- A11. An evaluation harness with a human-labelled gold set is in scope (size + labeller to be proposed).
Big picture
- A12. Review output = a Notion page or a Geo proposal (shape TBD later); the reader is the curator who must fix the submission; publishing goes through geo-publish after human approval.
- A13. Bounty→proposal linkage: `Need more info`, assumed solvable.
- A14. Ontology-bounty judgment layer = ontology-advisor + ONTOLOGY.md (D2).
Repo and team
- A15. Agents move to a NEW agents repository; content-management becomes a pure skills library consumed as a dependency (D3).
- A16. The team keeps AGENT-WORKFLOW.md task/QA logging for agent runs that touch the Agents flow teamspace.

### Batch 3 Q1 — final answer (2026-10-09)
MVP = tag claims with EXISTING Verified tags only. No editor-supplied rules, ever: rules are defined INSIDE the agent (the taxonomy's "When to use" rules). Editors may supply additional CONTEXT / guidance on how to work with the dataset, never new tags or rules. Future bounty-review version: same principle — editors ask for a submission review and may add context; rules live in the agent.
=> A5 amended: rule source = the agent's internal rule set (Verified taxonomy for the MVP; bounty text is INPUT CONTEXT the agent reads, not an editor-authored rule set). Editor-provided text is context only.
=> Option B for untagged checks is moot for the MVP; for the big picture, non-taxonomy checks are findings in the review output, not new tags.
