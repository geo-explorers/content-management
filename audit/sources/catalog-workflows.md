# AI workflows catalog

Source: Notion data source `collection://4b92adf1-a21a-4077-8072-e32398c77e20` (AI workflows).

## Coverage and verification

- Workflow-level rows retrieved: 15 (expected 15).
- Step rows retrieved: 118 (expected 118).
- Page fetches that failed: 0.
- Children links across workflows: 118. Unique step IDs referenced by a workflow: 118.
- Step rows not listed under any workflow's Children: 0.
- Step rows whose Parent does not point to a fetched workflow: 0.
- The query path (SQL with WHERE Level) was refused by the Notion usage limit. These rows come from page fetches of each Workflow and Step page; the Workflow-level table and the per-workflow steps are built from the Children links. See catalog-rows.raw.json.

## Workflow-level rows

| Name | Key | Readiness | Summary | Skills | Children count |
|---|---|---|---|---|---|
| Start and resume a Geo task | start | Documented procedure | Establish purpose, context, authority and current work state before operating. | — | 6 |
| Query and inspect Geo | query | Documented procedure | Retrieve accurate scoped graph evidence with explicit completeness and provenance. | geo-query | 10 |
| Mirror Geo content to Notion | mirror | Controlled use | Build or refresh a faithful editorial surface while preserving identity and unsynced work. | geo-mirror; geo-query; geo-mirror-and-group; notion-operations | 11 |
| Publish reviewed Notion changes to Geo | publish | Controlled use | Map and validate explicit editorial changes, submit authorized operations and verify the result. | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher | 13 |
| Group related claims and assign brackets | group | Controlled use | Compare proposition meanings, form Related groups, then assign exact supported bracket relations. | geo-claim-grouping; geo-query; geo-mirror-and-group; geo-claim-grouping-notion | 8 |
| Understand claims and map debates | semantics | Documented procedure | Develop grounded propositions, topic links and debate structures from content and evidence. | ontology-advisor; geo-query | 8 |
| Write original sourced descriptions | describe | Documented procedure | Extract facts, verify them and compose concise neutral descriptions for review. | geo-describe | 6 |
| Review press coverage against Geo | press | Documented procedure | Compare current external stories with scoped Geo coverage and recommend justified additions. | geo-press-review | 6 |
| Discover and diagnose content gaps | discover | Controlled use | Find entity and theme gaps in a scoped stream, then prepare reviewed findings. | geo-discovery; geo-query | 6 |
| Inspect and repair graph data | clean | Controlled use | Discover precise quality defects and apply only guarded, authorized repairs. | geo-clean; geo-query; ontology-advisor | 11 |
| Coordinate agents and dependent tasks | coordinate | Proposed | Make writer ownership, prerequisites, handoffs and recovery explicit. | Agent coordination and handoff | 8 |
| Maintain and distribute agent files | filesync | Proposed | Inventory reusable files, publish selected team editions and reconcile accepted revisions. | Agent document revision sync | 9 |
| Review results and maintain work evidence | qa | Documented procedure | Challenge semantic and structural quality and record meaningful completion. | — | 6 |
| Prepare an editor’s daily report | report | Documented procedure | Collect daily work, include outside activity and file a confirmed report under the editor’s identity. | daily-report | 5 |
| Recompose a Geo banner | banner | Documented procedure | Create a wide banner from an input image and verify dimensions and visual quality. | image-banner-recompose | 5 |

## Steps by workflow

## 100 · Start and resume a Geo task (`start`)

Readiness: Documented procedure · Steps listed: 6 of 6 children

Summary: Establish purpose, context, authority and current work state before operating.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Resolve objective and scope | Prepare | User request and supplied links | Written scope and completion criteria | Targets and permitted actions are explicit. | Ask only for a choice that materially changes scope. | — | — |
| 2 | Verify connection identity | Read | Notion connection | Verified workspace/account record | The connection matches the intended account and workspace. | Stop dependent writes if identity differs. | Resolve objective and scope | — |
| 3 | Restore task context | Read | Task link or known task key | Prior progress, authorization and unresolved work | Completed operations and remaining work are distinguished. | Treat unavailable context as unavailable; do not restart writes blindly. | Verify connection identity | — |
| 4 | Select documents and skills | Prepare | Scope and component catalog | Small relevant context set | Applicable definitions and procedures are loaded. | Resolve stale paths or missing capabilities before dependent work. | Restore task context | — |
| 5 | Establish write ownership | Prepare | Task scope and active assignments | Recorded writer and target scope | No unresolved overlapping writer is known. | Hold the dependent write and reconcile ownership. | Select documents and skills | — |
| 6 | Create execution manifest | Maintain | Verified scope and identities | Task manifest and work record | Another agent can identify the inputs and resume the work. | Keep a pending local record if Notion is unavailable. | Establish write ownership | — |

## 200 · Query and inspect Geo (`query`)

Readiness: Documented procedure · Steps listed: 10 of 10 children

Summary: Retrieve accurate scoped graph evidence with explicit completeness and provenance.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Resolve supplied identities | Read | Requested URLs, names and space | Verified target IDs | Each target has the expected space membership and type. | Return ambiguity or access failure rather than substituting a fuzzy match. | — | geo-query |
| 2 | Inspect live schema | Read | Target type and required fields | Schema map | Every requested field has a supported query shape and meaning. | Correct the query against live schema; do not interpret errors as empty data. | Resolve supplied identities | geo-query |
| 3 | Define time semantics | Prepare | User’s date request | Explicit date field and half-open bounds | The selected time answers the requested question. | Clarify or inspect history if membership time is required. | Inspect live schema | geo-query |
| 4 | Count scoped entities | Read | Scope and filters | Expected count | Count query succeeded with the intended filters. | Preserve GraphQL/network errors and retry with bounded backoff. | Define time semantics | geo-query |
| 5 | Retrieve candidate identities | Read | Scope and schema map | Candidate ID set | Selection matches requested constraints. | Narrow an unexpectedly broad query before hydrating. | Count scoped entities | geo-query |
| 6 | Paginate root results | Read | Paged root query | Complete root result set | Page flags end and counts reconcile. | Stop on repeated cursor or missing response path and record partial coverage. | Retrieve candidate identities | geo-query |
| 7 | Hydrate required values and edges | Read | Candidate IDs and required fields | Scoped values and full edge records | Required nested collections are complete. | Reduce root page size for nested data and resume recorded cursors. | Paginate root results | geo-query |
| 8 | Reconstruct page ordering | Understand | Page blocks and positioned edges | Faithful ordered page representation | Order follows each block’s actual rule. | Document missing positions or ambiguous block metadata. | Hydrate required values and edges | geo-query |
| 9 | Adjudicate semantic candidates | Understand | Candidate text and neighborhood | Accepted, rejected and uncertain matches | Each accepted match satisfies the requested semantics. | Retain uncertainty and actual search coverage. | Reconstruct page ordering | geo-query |
| 10 | Save and report retrieval evidence | Maintain | Retrieved snapshot and count checks | Dated evidence and answer | Requested, retrieved and verified coverage are stated. | Do not label a capped or failed retrieval complete. | Adjudicate semantic candidates | geo-query |

## 300 · Mirror Geo content to Notion (`mirror`)

Readiness: Controlled use · Steps listed: 11 of 11 children

Summary: Build or refresh a faithful editorial surface while preserving identity and unsynced work.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Define mirror selection | Prepare | Mirror request. One of: a space and primary type; an id list (a curated tab or review set); or a Geo page whose Data blocks hold Collection item relations, read with extract-page-collections.mjs — one Notion database per collection. | Mirror scope contract | The entry shape is named, and the selection is explicit about two things a page or id-list mirror routinely hits: mixed entity types in one collection, and items resident in other spaces. Both are kept deliberately, not by accident. | Resolve missing scope before exporting. A whole-type or whole-space run with no scope is refused by design. If no entry shape fits the request, say what is missing and stop — never hand-roll a mirror script. | — | geo-mirror; geo-query |
| 2 | Retrieve complete source snapshot | Read | Scope contract | Dated source snapshot | Root and required nested counts reconcile. | Hold writes if retrieval is incomplete. | Define mirror selection | geo-mirror; geo-query |
| 3 | Map graph fields to Notion | Understand | Snapshot and current Notion schema | Field and identity mapping | Every mirrored field has a source and supported representation. | Mark unsupported or lossy fields; do not invent a round-trip mapping. | Retrieve complete source snapshot | geo-mirror; geo-query |
| 4 | Read destination identity index | Read | Destination databases | Existing row index and edit baseline | All destination rows are indexed without duplicate Geo IDs. | Resolve duplicate identities before upserting. | Map graph fields to Notion | geo-mirror; geo-query |
| 5 | Compare baseline and current values | Review | Three value sets | Safe refresh diff and conflict list | No unsynced proposal or review value is overwritten. | Leave conflicts unresolved with before/after evidence. | Read destination identity index | geo-mirror; geo-query |
| 6 | Create or resolve rows | Write | Validated identity map and diff | Stable Notion row IDs | Every intended entity has one destination row. | Recover uncertain creates by identity lookup before retry. | Compare baseline and current values | geo-mirror; geo-query |
| 7 | Link relation endpoints | Write | Row map and graph edges | Linked Notion relations | All endpoints resolve and mapped relations match. | Record unmapped targets or unsupported edge metadata. | Create or resolve rows | geo-mirror; geo-query |
| 8 | Configure editorial views | Write | Populated databases | Usable editorial views | View settings expose the intended population. | Check whether missing rows are hidden by filters before recreating. | Link relation endpoints | geo-mirror; geo-query |
| 9 | Verify mirror fidelity | Verify | Source snapshot and Notion readback | Fidelity report | All scoped mapped values pass or exceptions are explicit. | Repair mapped discrepancies and rerun affected comparisons. | Configure editorial views | geo-mirror; geo-query |
| 10 | Prove zero-change return path | Verify | Snapshot, baseline and current mirror | Zero-change test result | No unsolicited publication operations are produced. | Keep return-path publication disabled for failing fields. | Verify mirror fidelity | geo-mirror; geo-query |
| 11 | Save baseline and refresh record | Maintain | Verified mirror | Resumable baseline and task record | Future refresh can distinguish source and editor changes. | Keep prior baseline until the new one is verified. | Prove zero-change return path | geo-mirror; geo-query |

## 400 · Publish reviewed Notion changes to Geo (`publish`)

Readiness: Controlled use · Steps listed: 13 of 13 children

Summary: Map and validate explicit editorial changes, submit authorized operations and verify the result.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Select reviewed proposed fields | Read | Reviewed Notion rows | Selected proposal set | Each field has a current decision and defined intended value. | Exclude unreviewed, ambiguous and unsupported fields. | — | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher |
| 2 | Resolve explicit write destinations | Prepare | Proposal set and field mapping | Operation target map | No write authority is inferred from first space membership. | Stop unresolved destinations. | Select reviewed proposed fields | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher |
| 3 | Re-read current Geo values | Read | Operation target map | Current before-values | Every touched assertion is scoped to its destination. | Do not publish against a stale or failed read. | Resolve explicit write destinations | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher |
| 4 | Detect three-way conflicts | Review | Baseline and current states | Conflict-free candidates and exceptions | Concurrent changes are resolved per field. | Retain conflict evidence and defer affected operations. | Re-read current Geo values | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher |
| 5 | Check ontology and semantic duplicates | Understand | Candidate changes and live definitions | Adjudicated model and duplicate report | New entities and relationships are justified. | Reuse correct identities or leave ambiguous matches for review. | Detect three-way conflicts | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher |
| 6 | Validate types and relation identities | Review | Candidate operations | Schema-valid operation set | Every operation has valid identity, type and datatype. | Reject invalid or unmapped operations. | Check ontology and semantic duplicates | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher |
| 7 | Prepare concrete dry run | Draft | Validated operation set | Dry-run package | The package exposes exact targets, changes and limitations. | Fix dry-run failures before requesting missing approval. | Validate types and relation identities | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher |
| 8 | Resolve applicable approval | Review | Dry run and authorization record | Approved executable scope | All applicable approval requirements are satisfied. | Ask for the specific missing approval with the governing rule. | Prepare concrete dry run | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher |
| 9 | Recheck freshness and ownership | Read | Approved package and latest state | Freshness pass | Before-values still match and no conflicting writer owns the scope. | Regenerate the diff and re-resolve changed approval scope. | Resolve applicable approval | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher |
| 10 | Submit permitted operations | Write | Approved operations and configured signer | Proposal/transaction receipts | Submission identities and response state are recorded. | Resolve uncertain submissions from receipts before any retry. | Recheck freshness and ownership | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher |
| 11 | Verify governance execution | Verify | Submission receipts | Execution status | The intended proposal executed or a pending/failure state is explicit. | Report pending governance without claiming completion. | Submit permitted operations | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher |
| 12 | Verify indexed graph values | Verify | Executed operation receipts | Indexed verification result | The intended values and relationships are visible and correct. | Investigate lag or mismatch; do not resubmit blindly. | Verify governance execution | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher |
| 13 | Reconcile fulfilled mirror proposals | Write | Verified indexed state and current Notion | Reconciled mirror and completion evidence | Fulfilled proposals are accounted for without erasing concurrent edits. | Leave conflicts visible for field-level resolution. | Verify indexed graph values | geo-publish; geo-orchestrate; Conflict-aware Notion → Geo publisher |

## 500 · Group related claims and assign brackets (`group`)

Readiness: Controlled use · Steps listed: 8 of 8 children

Summary: Compare proposition meanings, form Related groups, then assign exact supported bracket relations.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Choose grouping scope | Prepare | Grouping request | Scoped seed and candidate population | Selection and write destinations are explicit. | Clarify materially different candidate scopes. | — | geo-claim-grouping; geo-query |
| 2 | Generate candidate pairs | Read | Scoped claim snapshot | Scored candidate pairs | Pairs have stable IDs and traceable retrieval signals. | Report search coverage; do not call candidates equivalent. | Choose grouping scope | geo-claim-grouping; geo-query |
| 3 | Read propositions and context | Understand | Candidate pair content | Semantic comparison notes | Comparisons preserve scope, polarity and modality. | Mark insufficient context as uncertain. | Generate candidate pairs | geo-claim-grouping; geo-query |
| 4 | Adjudicate every candidate | Understand | Pairs and comparison notes | Complete decisions file | Every retrieved pair has a reasoned decision. | Return uncertain cases for review rather than forcing a bracket. | Read propositions and context | geo-claim-grouping; geo-query |
| 5 | Establish Related claim groups | Draft | Accepted pair decisions | Proposed initial groups and edges | Every link is justified as related under the rubric. | Reject accidental cross-group connections. | Adjudicate every candidate | geo-claim-grouping; geo-query |
| 6 | Assign exact brackets | Draft | Initial groups and rubric | Bracket proposals with directions | Each bracket satisfies its strict definition. | Leave related-only where a stricter bracket is unsupported. | Establish Related claim groups | geo-claim-grouping; geo-query |
| 7 | Review graph effects | Review | Proposed relations and live graph | Minimal reviewed relation diff | No duplicates or incompatible classifications are introduced. | Revise the decisions file and retain rationale. | Assign exact brackets | geo-claim-grouping; geo-query |
| 8 | Dry-run and publish authorized relations | Write | Reviewed relation diff | Controlled proposal receipts | Applicable publication gates and verification are completed. | Keep unapproved relations as proposals. | Review graph effects | geo-claim-grouping; geo-query |

## 600 · Understand claims and map debates (`semantics`)

Readiness: Documented procedure · Steps listed: 8 of 8 children

Summary: Develop grounded propositions, topic links and debate structures from content and evidence.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Read content and neighborhood | Read | Selected entities | Contextual evidence set | Meaning is grounded in actual content. | Retrieve missing source passages before strong judgments. | — | ontology-advisor; geo-query |
| 2 | Extract proposition commitments | Understand | Claim and source text | Structured interpretation | The interpretation preserves qualifiers and uncertainty. | Mark ambiguous attribution or scope. | Read content and neighborhood | ontology-advisor; geo-query |
| 3 | Assign relevant topics | Draft | Interpretation and topic candidates | Proposed topic links | Each topic is substantively about the claim. | Avoid lexical-only assignments and unjustified new topics. | Extract proposition commitments | ontology-advisor; geo-query |
| 4 | Assess support and contradiction | Understand | Compared propositions | Supported relation judgments | Support and opposition are explained by content. | Do not infer contradiction from difference alone. | Assign relevant topics | ontology-advisor; geo-query |
| 5 | Map positions and participants | Draft | Verified statements and relation judgments | Proposed debate structure | Practical current decisions mapped to coherent 2–4-claim collections; relevant existing claims and important gaps identified; participant positions sourced. | Keep inferred positions explicitly tentative. | Assess support and contradiction | ontology-advisor; geo-query |
| 6 | Draft new claims or wording | Draft | Verified evidence and editorial objective | Original and proposed wording with rationale | Important gaps or weak fits addressed inline; every PROPOSED row links its closest existing claims; new commitments distinguished from wording alternatives and inverses. | Remove unsupported claims and retain uncertainty. | Map positions and participants | ontology-advisor; geo-query |
| 7 | Review borderline judgments | Review | Proposed structure and rationale | Accepted, revised and unresolved cases | Current decision relevance, coverage, comparable breadth, inline proposals, closest-claim links, semantic differences and feedback checked; structural verification recorded separately. | Escalate unresolved editorial decisions without publishing. | Draft new claims or wording | ontology-advisor; geo-query |
| 8 | Save proposals for controlled publication | Write | Reviewed semantic proposal | Reviewable Notion artifact | A reader can trace each proposal to evidence. | Use the publication workflow only when authorized. | Review borderline judgments | ontology-advisor; geo-query |

## 700 · Write original sourced descriptions (`describe`)

Readiness: Documented procedure · Steps listed: 6 of 6 children

Summary: Extract facts, verify them and compose concise neutral descriptions for review.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Ingest and classify sources | Read | Entity and supplied sources | Source inventory | Identity and source relevance are established. | Resolve mismatched entities or inaccessible material. | — | geo-describe |
| 2 | Extract factual statements | Understand | Source content | Attributed fact list | Each fact has a precise supporting source. | Separate unsupported inference. | Ingest and classify sources | geo-describe |
| 3 | Verify accuracy | Review | Fact list | Verified facts and uncertainty | Evidence meets the description workflow’s standard. | Omit or qualify unverified facts. | Extract factual statements | geo-describe |
| 4 | Compose original description | Draft | Verified facts | Description draft | The text preserves meaning and avoids leading with the entity name. | Revise overlong or source-dependent phrasing. | Verify accuracy | geo-describe |
| 5 | Check originality and rules | Review | Draft and evidence | Vetted description | All checks pass or exceptions are recorded. | Rewrite close phrasing and remove unsupported details. | Compose original description | geo-describe |
| 6 | Emit review package | Write | Vetted draft | Reviewable proposed description | Description and sources remain linked. | Do not publish solely because drafting is complete. | Check originality and rules | geo-describe |

## 800 · Review press coverage against Geo (`press`)

Readiness: Documented procedure · Steps listed: 6 of 6 children

Summary: Compare current external stories with scoped Geo coverage and recommend justified additions.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Define topic and date scope | Prepare | Coverage request | Search contract | The comparison population is explicit. | Resolve ambiguous date meanings. | — | geo-press-review |
| 2 | Retrieve Geo coverage | Read | Search contract | Geo coverage map | The Geo side is complete for its stated scope. | Report partial retrieval separately. | Define topic and date scope | geo-press-review |
| 3 | Search external sources | Read | Search contract | External candidate stories | Every candidate has a usable source link. | Describe external search limits. | Retrieve Geo coverage | geo-press-review |
| 4 | Verify each source story | Review | Candidate links | Verified story facts | The recommendation matches the actual source. | Drop inaccessible or mismatched evidence. | Search external sources | geo-press-review |
| 5 | Match stories semantically | Understand | Geo coverage and verified stories | Already-covered and uncovered classification | Each classification has a reason and corresponding Geo link when found. | Mark uncertain matches for review. | Verify each source story | geo-press-review |
| 6 | Rank recommendations | Draft | Uncovered stories | Ranked editorial recommendation | Ranking rationale is clear. | Do not claim exhaustive web coverage or publish automatically. | Match stories semantically | geo-press-review |

## 900 · Discover and diagnose content gaps (`discover`)

Readiness: Controlled use · Steps listed: 6 of 6 children

Summary: Find entity and theme gaps in a scoped stream, then prepare reviewed findings.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Harvest scoped content stream | Read | Space and time bounds | Dated stream snapshot | Selection and completeness are recorded. | Resume failed retrieval rather than treating it as no activity. | — | geo-discovery; geo-query |
| 2 | Extract entities and themes | Understand | Stream snapshot | Candidate entities and themes | Candidates retain source evidence. | Reject unsupported inferred entities. | Harvest scoped content stream | geo-discovery; geo-query |
| 3 | Diagnose gap type | Understand | Candidates and graph evidence | Classified gap findings | The claimed gap is justified by scoped comparison. | Distinguish search failure from missing content. | Extract entities and themes | geo-discovery; geo-query |
| 4 | Score and route findings | Draft | Classified findings | Ranked proposed findings | Score meaning and route are explicit. | Avoid invented precision and preserve uncertainty. | Diagnose gap type | geo-discovery; geo-query |
| 5 | Analyze emerging themes | Understand | Theme evidence over time | Theme-level findings | Time-based inference has enough evidence. | Label sparse or periodic coverage. | Score and route findings | geo-discovery; geo-query |
| 6 | Review and prepare publication | Review | Proposed gap findings | Reviewed publish candidates or blocked issues | Implementation and approval requirements are satisfied. | Revalidate recorded SDK migration debt before executing publication. | Analyze emerging themes | geo-discovery; geo-query |

## 1000 · Inspect and repair graph data (`clean`)

Readiness: Controlled use · Steps listed: 11 of 11 children

Summary: Discover precise quality defects and apply only guarded, authorized repairs.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Find exact-name duplicate candidates | Read | Type/space scope | Exact-name candidate groups | Candidates retain IDs, types, memberships and backlinks. | Do not merge merely because names match. | — | geo-clean; geo-query; ontology-advisor |
| 2 | Find semantic duplicate candidates | Understand | Hydrated candidate entities | Adjudicated duplicate judgments | Accepted duplicates denote the same thing. | Retain distinct meanings and uncertain cases. | Find exact-name duplicate candidates | geo-clean; geo-query; ontology-advisor |
| 3 | Inspect missing types and blank values | Read | Scoped entity data | Typed defect inventory | Each defect refers to a real eligible entity. | Exclude system bookkeeping and distinguish empty from intentional values. | — | geo-clean; geo-query; ontology-advisor |
| 4 | Inspect stale and duplicate edges | Read | Relations and endpoint data | Relation defect inventory | Each candidate is a verified structural defect. | Do not remove valid repeated cross-space assertions. | — | geo-clean; geo-query; ontology-advisor |
| 5 | Inspect datatype mismatches | Read | Property schema and values | Conversion candidates and failures | Conversions are loss-aware and supported. | Escalate unparseable values instead of coercing silently. | — | geo-clean; geo-query; ontology-advisor |
| 6 | Select canonical identities | Understand | Duplicate group evidence | Canonical choice per group | Canonical choice respects all protected cases. | Apply both-scored and other required escalation gates. | Find semantic duplicate candidates | geo-clean; geo-query; ontology-advisor |
| 7 | Check protected and cross-space impact | Review | Candidate operations | Eligibility and impact report | Every protected-case gate is satisfied. | Exclude or escalate protected targets; preserve voting data. | — | geo-clean; geo-query; ontology-advisor |
| 8 | Prepare move or copy semantics | Draft | Explicit move/copy request | Before/after per-space plan | Destination and retained content are explicit. | Do not infer relocation from a merge request. | Check protected and cross-space impact | geo-clean; geo-query; ontology-advisor |
| 9 | Prepare orphan or space deletion plan | Draft | Authorized deletion scope | Deletion candidates and exclusions | No candidate bypasses the relevant safeguard. | Require the applicable specific approval for protected or mass deletion. | Check protected and cross-space impact | geo-clean; geo-query; ontology-advisor |
| 10 | Dry-run guarded repairs | Review | Validated operation plan | Reviewable repair package | All safeguards and impact counters are visible. | Fix failed gates and refresh expired plans. | Check protected and cross-space impact | geo-clean; geo-query; ontology-advisor |
| 11 | Publish and validate end state | Write | Approved fresh repair package | Executed and verified repair evidence | End-state invariants and affected backlinks pass. | Investigate mismatches before marking complete. | Dry-run guarded repairs | geo-clean; geo-query; ontology-advisor |

## 1100 · Coordinate agents and dependent tasks (`coordinate`)

Readiness: Proposed · Steps listed: 8 of 8 children

Summary: Make writer ownership, prerequisites, handoffs and recovery explicit.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Identify overlapping work | Read | Proposed task and active assignments | Overlap/dependency assessment | Potential collisions and prerequisites are named. | Do not assume different task titles imply disjoint targets. | — | Agent coordination and handoff |
| 2 | Claim bounded writer ownership | Prepare | Overlap assessment | Ownership record | All involved agents can identify the current writer. | Resolve competing claims before writes; a status row is not an atomic lock. | Identify overlapping work | Agent coordination and handoff |
| 3 | Share a source snapshot | Prepare | Source manifest | Common analysis input | Workers use the same scope and revision. | Refresh deliberately if source change invalidates the shared baseline. | Claim bounded writer ownership | Agent coordination and handoff |
| 4 | Check prerequisite completion | Read | Dependency link | Prerequisite accepted or blocked | The receipt satisfies the downstream input contract. | Keep downstream writes blocked on failed or partial work. | Share a source snapshot | Agent coordination and handoff |
| 5 | Transfer a handoff package | Maintain | Completed upstream work | Handoff record | The recipient can resume without repeating extraction. | Fill missing evidence before calling the handoff complete. | Check prerequisite completion | Agent coordination and handoff |
| 6 | Accept and revalidate handoff | Review | Handoff and current state | Accepted dependency revision | Recipient’s assumptions still hold. | Return a precise mismatch and request reconciliation. | Transfer a handoff package | Agent coordination and handoff |
| 7 | Recover interrupted ownership | Maintain | Interrupted task evidence | Resumed or reassigned scope | Previously applied work will not be duplicated. | Resolve uncertain operations before retry. | Accept and revalidate handoff | Agent coordination and handoff |
| 8 | Complete shared task record | Maintain | Verified output | Clear completion state | Downstream tasks know whether they may proceed. | Keep partial or pending stages visible. | Recover interrupted ownership | Agent coordination and handoff |

## 1200 · Maintain and distribute agent files (`filesync`)

Readiness: Proposed · Steps listed: 9 of 9 children

Summary: Inventory reusable files, publish selected team editions and reconcile accepted revisions.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Inventory relevant files | Read | Project folder | Dated local inventory | Reusable context is separated from task evidence and runtime files. | Avoid scanning or displaying credential content. | — | Agent document revision sync |
| 2 | Classify sharing scope | Review | File inventory | Sharing decision per selected component | Only authorized reusable content enters the team export. | Keep private records and credentials outside shared attachments. | Inventory relevant files | Agent document revision sync |
| 3 | Choose canonical source | Prepare | Selected components | Ownership and source-of-truth contract | No component has two competing unqualified authorities. | Resolve ambiguous ownership before syncing. | Classify sharing scope | Agent document revision sync |
| 4 | Create readable team document | Write | Approved component text | Editable Notion document | Team members can read the complete shared edition. | Label adaptations and preserve original source provenance. | Choose canonical source | Agent document revision sync |
| 5 | Attach dated source snapshot | Write | Approved file bytes | Downloadable snapshot | Attachment is associated with the correct document. | Do not call the attachment a live sync. | Create readable team document | Agent document revision sync |
| 6 | Link skills and workflow usage | Write | Document and capability identities | Navigable dependency map | A task can find the needed component from its workflow. | Fix unresolved links before declaring the catalog ready. | Attach dated source snapshot | Agent document revision sync |
| 7 | Compare revisions before update | Review | Three revisions | Accepted diff or conflict | Concurrent changes are preserved. | Review a merge instead of overwriting one side. | Link skills and workflow usage | Agent document revision sync |
| 8 | Install approved local revision | Write | Approved revision and host mapping | Installed version record | The runtime has the intended bytes and valid routes. | Do not replace existing instructions without applicable authorization. | Compare revisions before update | Agent document revision sync |
| 9 | Verify teammate access and refresh evidence | Verify | Published component and team access | Access and revision evidence | The intended audience can retrieve the approved content. | Leave cross-account access unverified until tested. | Install approved local revision | Agent document revision sync |

## 1300 · Review results and maintain work evidence (`qa`)

Readiness: Documented procedure · Steps listed: 6 of 6 children

Summary: Challenge semantic and structural quality and record meaningful completion.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Check structural integrity | Verify | Applied operations and expected state | Structural verification | Stored content matches the intended operation set. | Repair mismatches within scope and recheck affected fields. | — | — |
| 2 | Review semantic correctness | Review | Proposed or applied content | Reasoned semantic assessment | Meaning meets the editorial objective. | Preserve disputed interpretations and revise supported defects. | Check structural integrity | — |
| 3 | Triage reviewer findings | Understand | Reviewer report and current content | Finding disposition with evidence | Each finding has a grounded response. | Do not rewrite a reviewer’s finding to manufacture agreement. | Review semantic correctness | — |
| 4 | Apply authorized corrections | Write | Validated findings and authorization | Corrected content and operation record | Corrections pass relevant verification. | Prepare additional scope for review when authorization is missing. | Triage reviewer findings | — |
| 5 | Record outcome and remaining stages | Maintain | Verified task evidence | Durable completion record | Draft, written, submitted, executed and indexed stages are distinguished. | Keep unresolved stages open. | Apply authorized corrections | — |
| 6 | Update reusable lessons | Maintain | Verified finding and repair evidence | Dated reusable lesson | The lesson states evidence and conditions for reuse. | Do not convert an untested proposal into a current fact. | Record outcome and remaining stages | — |

## 1400 · Prepare an editor’s daily report (`report`)

Readiness: Documented procedure · Steps listed: 5 of 5 children

Summary: Collect daily work, include outside activity and file a confirmed report under the editor’s identity.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Gather today’s work evidence | Read | Date and editor session access | Daily activity evidence | Date bounds and source coverage are explicit. | Report missing access rather than inventing activity. | — | daily-report |
| 2 | Distill progress statements | Draft | Daily activity evidence | Draft report bullets | Each statement is supported and meaningful. | Remove speculative completion claims. | Gather today’s work evidence | daily-report |
| 3 | Collect activity outside captured sessions | Prepare | Draft and known coverage gaps | Editor top-up | External activity is represented or explicitly absent. | Keep the request pending if needed for completeness. | Distill progress statements | daily-report |
| 4 | Confirm final report | Review | Completed report draft | Confirmed report | The editor has approved the exact submission. | Do not file unconfirmed text. | Collect activity outside captured sessions | daily-report |
| 5 | File and verify the report | Write | Confirmed text and correct identity | Filed daily update | The row’s content and authorship are correct. | Resolve uncertain creation before retry. | Confirm final report | daily-report |

## 1500 · Recompose a Geo banner (`banner`)

Readiness: Documented procedure · Steps listed: 5 of 5 children

Summary: Create a wide banner from an input image and verify dimensions and visual quality.

| Order | Name | Stage | Inputs | Outputs | Done when | Failure response | Depends on | Skills |
|---|---|---|---|---|---|---|---|---|
| 1 | Inspect source image | Read | User-provided image | Composition assessment | Key content and constraints are understood. | Request the missing image if unavailable. | — | image-banner-recompose |
| 2 | Choose recomposition strategy | Understand | Composition assessment | Strategy and focal placement | Important content can survive the 2364 × 640 format. | Choose a different strategy if cropping destroys key content. | Inspect source image | image-banner-recompose |
| 3 | Generate banner composition | Write | Source and selected strategy | Banner candidate | The output reflects the requested image and format. | Inspect failed or distorted results and revise. | Choose recomposition strategy | image-banner-recompose |
| 4 | Verify dimensions and visual quality | Verify | Banner candidate | QA result | 2364 × 640 and visual checks pass. | Revise defects before delivery. | Generate banner composition | image-banner-recompose |
| 5 | Deliver usable image | Maintain | Verified banner | Downloadable final asset | The user can retrieve the image. | Do not report an unavailable asset as delivered. | Verify dimensions and visual quality | image-banner-recompose |

