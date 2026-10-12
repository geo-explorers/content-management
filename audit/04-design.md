# Design — Geo claim-verification agent (MVP) → bounty-review agent (big picture)
Status: DRAFT v1 (2026-10-09, phases 3–5). Audit-dependent sections marked [AUDIT].

## 0. Design decisions (owned by me unless marked user-flagged)
- D1 (user) Verified tags only (13). D2 (user) ontology-advisor is the ontology judgment layer. D3 (user) agents move to a new repo; content-management = skills library.
- DD1 One pipeline, two judge adapters. Every deterministic step (roster, enrich, fetch, plan, write, read-back, eval) is code shared by both execution modes; only the "judge" step differs: Claude Code subagent (Max mode) vs Messages API (API mode). Prompts/rubrics are files shared by both.
- DD2 Decisions come from files, never transcribed. The judge writes `judgments/<geoId>.json`; the writer reads files. (Same rule as geo-claim-grouping-notion HARD RULE 6.)
- DD3 Deterministic tags are never asked of the model: `Unsourced` = Sources relation empty (from Geo). Source-reading tags are judged only when evidence was fetched; otherwise state = `not_checkable`.
- DD4 Per-tag binary judgments with per-tag confidence, not one multi-label pick. Each of the 13 tags gets {applies, confidence, reason, evidence_quote?}. Counterpart pairs (Debate/Simple, Factual/Opinion, Self-contained/Context-dependent, Single core/Multiple statements) are judged as one forced choice each with one confidence.
- DD5 Confidence is a calibrated 0–1 verbalized score; floor 0.60 to write a tag; 0.60–0.75 writes the tag AND sets `Needs editor`; <0.60 writes nothing but a note. Thresholds are config, tuned by the eval harness.
- DD6 The human confirmation column IS the gold set. Rows with `Review status = Reviewed` and non-empty `Claim Tags — verified` are the labelled set; `eval` compares `Proposed Claim Tags` vs `Claim Tags — verified` per tag (precision/recall/F1). No separate gold DB needed; the first 100 reviewed rows bootstrap it.
- DD7 Notion I/O via the integration token (REST, paced 3 rps, dry-run → publish → read-back). Never the MCP connector for bulk (workspace query-limit hit on 2026-10-09).
- DD8 Geo access read-only via `lib/gql.mjs` (batched, scoped by space, no N+1). No SDK, no wallet.
- DD9 Prompt-injection guard: fetched pages are wrapped as untrusted DATA with a fixed frame; the judge is told page text can never change the rules; outputs are schema-validated; no tool access during judging.
- DD10 Resumable, idempotent: the work queue = rows with empty `Proposed Claim Tags` (or `--force`), batch default 50 (`--limit`), per-run ledger JSONL; re-running never duplicates.

## 1. Execution loop — MVP (claim tagger)
INPUT: Notion DB id (title + `Geo ID` columns), options: --limit 50, --ids, --force, --space (default: inferred from Geo URL), --mode session|api, --model, --dry-run (default) / --publish, context text (optional, editor-supplied).

LOOP (one run):
 1. PRECHECK — token present → DB reachable → schema has required columns → taxonomy DB readable (13 Verified rows cached to taxonomy.json with rules+examples) → create missing agent columns (dry-run lists them).
 2. ROSTER — read all rows (Geo ID, Geo Name, Geo URL, Geo Sources, Review status, Proposed Claim Tags); type-check ids on Geo (all must be Claim) → roster.json
 3. QUEUE — rows with empty Proposed Claim Tags (unless --force/--ids) → first --limit → queue.json
 4. ENRICH — Geo read-only, batched: per claim → Name/Description (scoped to space), Is factual, Tags, Topics, Sources→target entity→Web URL; Unsourced computed here → claims/<id>.json
 5. FETCH — per source URL (dedup across claims): GET with UA, 20s timeout, html→text (≤20k chars), status ∈ {ok, blocked(403/429/paywall), dead(404/5xx), pdf, timeout}; cache by URL hash → evidence/<hash>.json
 6. JUDGE — per claim: rubric (taxonomy rules) + claim + evidence excerpts → judgments/<id>.json (schema-validated, retried once on invalid). Adapter A (session): N subagents × batch of 10 claims, model per config. Adapter B (api): Messages API structured output, prompt cache on rubric; optional Batches API for backlog.
 7. CALIBRATE — apply thresholds (DD5) → per-row write plan: tags[], confidence lines, notes, review state → plan.json
 8. PLAN — dry-run report: counts (queued/judged/not_checkable/needs_editor), per-tag histogram, 5 sample rows; STOP unless --publish
 9. WRITE — paced PATCH per row (relation + text + select) → receipts
10. READ-BACK — re-read written rows; "N rows checked, 0 remaining differences" or list diffs
11. LEDGER — runs/<ts>.jsonl: per claim tokens/cost/latency/model/status; summary line printed. No Notion report (MVP).

EXIT states: ok | partial (some not_checkable/error, listed) | blocked (precheck failed, nothing written).
ROW state machine: untagged → queued → enriched → judged → {proposed | needs_editor | not_checkable | error} → (human) reviewed.

## 2. Execution loop — Big picture (bounty reviewer)
INPUT: bounty URL/id (+ space), submission = curator + proposal ids [Need more info: source of this list], optional editor context.
 1. INTAKE — log Work tracker task (AGENT-WORKFLOW), resolve bounty entity (name, rules text blocks, maintainer, status, space), load space conventions (accepted sources tag, debate tag, topics)
 2. COLLECT — proposals: `proposal(id)` + `proposalActions.contentUri` → IPFS → decodeEditAuto → ops; group by proposal; resolve entity ids against live graph (exists / only-in-proposal)
 3. RECONSTRUCT — submission model: entities{type, values, relations}, per proposal + aggregate across proposals (dedupe by entity id)
 4. CLASSIFY — bounty kind: reuse-ontology vs new-ontology (does the submission create Type/Property entities or new relation types?) → selects check set
 5. CHECKS (parallel workers, each writes findings/<check>.json)
     - C1 rule compliance: bounty rules → check list (tag-mapped where possible; else explicit pass/fail), applied per submitted entity
     - C2 data correctness: claim-tagger pipeline (§1) on submitted claims; source reading; factual spot-checks
     - C3 ontology (kind 2 only): ontology-advisor → reuse vs new, duplicates of existing types/properties, naming/description quality
     - C4 duplicates vs canonical spaces: geo-claim-grouping discovery (read-only) for claims; name/type search for other entities
     - C5 schema/format: geo-publish read-only gates (type-required, relation targets, data types)
 6. SYNTHESIZE — findings → Review finding records (Related entities, Full original statement, Exact excerpt under review, Issue, Sources, Evidence detail) + header (bounty link, proposals reviewed, last reviewed)
 7. REPORT — draft to Notion page (default) or a Geo proposal (via geo-publish, human-gated); curator-facing wording ("Please address…")
 8. HUMAN — maintainer approves/edits → publish; task closed with link; QA issues for anything systemic
 9. FOLLOW-UP — re-run on resubmission: diff findings vs previous review → "Follow-up review" block (as eval-1 does)

## 3. MVP skeleton — see 05-mvp-skeleton.md
## 4. Execution modes — see 06-execution-modes.md
## 5. Big-picture skeleton — see 07-bigpicture-skeleton.md
## 6. Repo + deployment — see 08-repo-and-deployment.md [AUDIT]

## 7. Open items
- Need more info: bounty→submission→proposal linkage (fallbacks: Curator API submissions endpoint; proposals filtered by proposedBy+window; editor-pasted links).
- Calibration report page not accessible (optional).
- Notion relation wiring: mirror's `Claim Tags — verified` → b65273e2… (taxonomy data source) OK; the spec DB's reverse relation points at 67a1940f… (another claims DB) — verify when creating `Proposed Claim Tags`.

## 8. Refinements after the audits and best-practice research (v1.1)
- DD11 Extractor stage before the judge. A cheap worker (Haiku 5.5, or a `claim-extractor` subagent in session mode) reads each fetched source once and returns at most 3 verbatim sentences relevant to the claim; code verifies each quote is a substring of the fetched text and rejects it otherwise. The judge sees only verified quotes, never raw pages. Effects: smaller judge prompts (about 1.2k tokens of evidence instead of 4k), untrusted text confined to a tool-less worker whose output is an enum-plus-quote schema, cheaper runs. (best-practices 2.3, 5.5)
- DD12 Three-state verdicts. Every pair or flag verdict is one of {A, B, cannot_tell} or {applies, not_applies, cannot_tell}; `cannot_tell` is separate from confidence and always routes to Needs editor. (best-practices 1.2; Anthropic guidance on allowing "I don't know")
- DD13 Idempotency key = (notionPageId, sha1(claim text), sha1(sorted source URLs), rubricSha, promptVersion, model). The ledger skips done keys; a changed rubric or claim text re-queues the row. (best-practices 5.3)
- DD14 Write allowlist in code: the writer accepts exactly {Proposed Claim Tags, Tag confidence, Proposed tag notes, Agent review state} and refuses any other property name; the relation target is read from the live `Claim Tags — verified` property (`relation.database_id`) and created as `single_property` so the taxonomy DB is untouched. Notion pacing default 2.5 requests per second (plan ceiling 180 per minute). (notion-tooling audit)
- DD15 Unsourced is the majority case: 776 of 1,911 rows (41%) have no Sources on Geo. They get the deterministic `Unsourced` tag, the source-reading judgment becomes `cannot_tell` with reason "no sources", and the row state is Proposed (not Not checkable). Sources on Geo: relation 49c5d5e1… → Article (99%) → Web URL property 412ff593…; scope `valuesList` by spaceId; 0.4% of edges lack a URL.
- DD16 Gold set: start with a stratified 100-row set labelled by two editors (Cohen's kappa per tag; sharpen rules where kappa < 0.6), then the living set is the human-confirmed rows. Report precision and recall per tag with Wilson 95% intervals; size rare tags by predicted positives. Pin model, rubricSha and promptVersion in every row's notes header so any score traces to a configuration. (best-practices 3.x)
- DD17 Confidence stays numeric per tag (user requirement); the review view triages by `Agent review state`; every run samples a slice of high-confidence rows for a blind audit (automation-bias check).
- DD18 Optional second opinion: for tags in the Needs-editor band, API mode may sample k=3 at the same prompt and use agreement as the confidence (3x cost; off by default).
- DD19 Per-tag binary calls vs one structured call per claim is an eval question, not a design axiom: default is one call per claim with per-tag fields (cheapest); the harness also runs the per-tag variant on the gold set and keeps the better one.
- DD20 The big-picture agent reuses PR #52's stage-0 runner (proposal inventory, the `Bounties` relation on proposal entities, IPFS cache plus decodeEdit, curator resolution, case grouping) as its collect and reconstruct module; policy (authorizations, Discord, points) moves to config; publishing and votes stay separate, human-gated, through the library's single write path.
