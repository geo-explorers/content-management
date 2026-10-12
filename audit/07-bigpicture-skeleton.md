# 07 — Big-picture skeleton: bounty-submission reviewer

## A. Roles (who is a subagent and why)
| Role | Kind | Skills loaded | Why separate |
|---|---|---|---|
| `bounty-reviewer` | orchestrator subagent (session) / agent config (hosted) | AGENT-WORKFLOW, report-writing standard | owns intake, task logging, dispatch, synthesis, the human gate |
| `proposal-reader` | script (no model) | — | deterministic: proposal → IPFS → decodeEditAuto → submission.json |
| `claim-tagger` | the MVP pipeline (script + judge adapters) | claim-verification | reused as-is for every submitted Claim |
| `source-checker` | judge worker | claim-verification (source-reading part) | reads pages; context-heavy; isolated |
| `ontology-reviewer` | worker | ontology-advisor (+ ONTOLOGY.md) | only for kind-2 bounties; loads a large reference |
| `duplicate-finder` | script + small judge | geo-claim-grouping (discovery, read-only) | semantic search vs canonical spaces |
| `schema-checker` | script | geo-publish gates (read-only reuse) | type-required / relation-target / data-type checks |
| `report-writer` | worker | report-writing standard; Review finding schema | renders findings → Notion page or Geo proposal plan |
Subagents pay off here for three concrete reasons: (1) context isolation — one proposal's decoded edit can be thousands of ops; (2) parallelism across proposals and across checks; (3) skill isolation — each worker loads one SKILL.md (300–600 lines each) instead of all 15.

## B. Data contracts
### submission.json (from proposal-reader)
```json
{ "bounty": { "id": "8181dcf5…", "space": "41e85161…", "name": "…", "rulesText": "…", "maintainer": "Catalin", "status": "Todo" },
  "curator": { "geoId": "…", "name": "…" },
  "proposals": [ { "id": "df516852…", "space": "c9f267dc…", "name": "…", "createdAt": "…", "votes": {"yes":0,"no":1}, "executed": false,
                   "contentUri": "ipfs://…", "ops": 17,
                   "entities": [ { "id": "9aaa4e3f…", "existsOnGeo": false, "types": ["News story"], "values": {"Name": "…", "Description": "…"}, "relations": [ {"type":"Sources","to":"…"} ] } ] } ],
  "aggregate": { "entityCount": 42, "byType": {"Claim": 30, "Article": 12}, "newTypes": [], "newProperties": [], "kind": "reuse-ontology" } }
```
### findings/<check>.json → review.json (Review finding shape, verbatim from the three example evaluations)
```json
{ "check": "C2-claim-tagger", "findings": [ { "relatedEntities": ["9aaa4e3f…"], "fullOriginalStatement": "…", "exactExcerpt": "…",
    "issue": "Please …", "sources": ["https://…"], "evidenceDetail": "…", "severity": "A", "tag": "Improperly sourced", "confidence": 0.81 } ] }
```
### review.json (synthesized)
`{ bounty, curator, proposalsReviewed[], lastReviewed, verdict: "approve|revise|reject", summary, findings[] (ordered: S→C), followUpOf: <previous review id|null> }`

## C. Execution loop with pseudocode
```js
const task = await workTracker.logStart(input);                     // AGENT-WORKFLOW step 1 (Projects = Agent flows)
const bounty = await geo.readBounty(input.bountyId, input.space);   // Bounty entity + body blocks (rules) + maintainer
const proposalIds = await submissionSource.resolve(input);          // NEED MORE INFO: adapter — curatorApi | proposedByWindow | editorList
const submission = await proposalReader.read(proposalIds);          // IPFS + decodeEditAuto; resolve ids on live graph
submission.aggregate.kind = classifyBountyKind(submission);         // new Type/Property entities or unknown relation types → "new-ontology"
const checks = pickChecks(submission.aggregate.kind);               // C1,C2,C4,C5 always; C3 for new-ontology
const findings = await Promise.all(checks.map(c => c.run(submission, bounty)));   // workers write findings/<c>.json
const review = synthesize(findings, bounty, submission, previousReview(bounty, curator));  // S→A→B→C ordering; follow-up diff
const draft = await reportWriter.render(review, { target: cfg.target });  // "notion" (page) | "geo" (proposal plan via geo-publish dry run)
await workTracker.logResult(task, draft.link);                      // result + link; QA issues for systemic problems
// human: maintainer edits/approves → publish (geo-publish two-phase) or share the Notion page with the curator
```
Check C1 (rule compliance) pseudocode:
```js
const rules = extractRules(bounty.rulesText);              // model: "list each rule as {id, text, kind: tag|deterministic|judgment, tagName?}"
for (const e of submission.entitiesOfInterest) for (const r of rules)
  results.push(r.kind === 'tag' ? fromTagger(e, r.tagName)          // e.g. contested → Debate; context-independent → Self-contained
             : r.kind === 'deterministic' ? evalDeterministic(e, r)  // e.g. has Debate tag id; Topics link to X; source approved by space (tag 044f2dc2… in space)
             : judgeRule(e, r));                                      // free-form rule → pass/fail + reason + confidence
```
Bounty-kind classifier: `new-ontology` iff the aggregate creates entities typed Type (e7d737c5…) or Property (808a04ce…), or uses a relation type id not resolvable on Geo; else `reuse-ontology`.

## D. Output rendering
- **Notion page** (default): header (bounty link, curator, proposals reviewed as governance links, last reviewed UTC, verdict), executive overview per the report-writing standard (3–5 bullets, outcome first), then a findings database (one row per Review finding, columns = the Geo Review finding properties + severity + tag + confidence), then "What could not be verified".
- **Geo proposal** (optional, human-gated): the same findings as `Review finding` entities inside a `Page` in the space's datasets space, published through geo-publish (dry run → `publish`). Follow-up reviews prepend a "Follow-up review" block, as eval-1 does.

## E. What is reused vs new
| Need | Reuse | New |
|---|---|---|
| read bounty + blocks | geo-query (Blocks, POSITION_ASC with ASCII fix) | — |
| proposals + content | lib/gql.mjs `Q.PROPOSALS`; `@geoprotocol/grc-20 decodeEditAuto`; pinata gateway from geo-mirror | proposal-reader.mjs (≈150 lines) |
| claim checks | claim-verification (MVP) | rule-extractor prompt |
| ontology checks | ontology-advisor | adapter that feeds it submission.json |
| duplicates | geo-claim-grouping discovery scripts | scope = submitted claims vs canonical spaces |
| schema checks | geo-publish gates | run them read-only (no ops) |
| report | report-writing standard; Review finding schema; geo-publish | report-writer prompt + Notion renderer |
| tracking | AGENT-WORKFLOW (Work tracker, QA tracker) | — |

## F. Need more info (explicit)
- Bounty → submission → proposals link: not derivable from Geo today (Bounty has no relation; reviews are not backlinked; Curator API `submissions` returned empty). The design isolates this behind `submissionSource` with three adapters so the rest is unaffected.
- Whether rejected proposals' entities are retained on IPFS indefinitely (pinata served a 2026-10-02 proposal fine).
- Ontology documentation "to come later" → C3 uses ontology-advisor until then (D2).

## G. Update after the audit: prior art and the linkage answer
- `Bounties` relation: proposal entities carry a `Bounties` relation to the Bounty entity when the curator sets it (PR #52 `review-stage0.mjs` step 3 reads `relationsList` where `type.name === "Bounties"`). The `submissionSource` adapters are therefore, in order: (1) the `Bounties` relation on proposals in the space window; (2) same curator (`proposedBy`) within the bounty window across the main and datasets pair; (3) Curator API submissions once populated; (4) editor-pasted proposal links. Proposals matching none go to a `needs-identification` queue (PR #52's term), never silently dropped.
- Reuse from PR #52 after triage: the stage-0 scan (proposals → curators → proposal meta → actions → IPFS with multi-gateway cache → decodeEdit → entities, values, relations), the review JSON with the six fields plus `originalRef {proposalId, entityId, propertyId, cid, opIndex}`, the recorder that rejects non-verbatim excerpts, deterministic report page ids, and delivery receipts with read-back. Do not reuse: per-editor authorizations embedded in the skill, Discord, points and payout policy inside the skill, votes inside a skill labelled non-actionable, and the five-gateway IPFS list until its timings are re-measured.
- Mapping to this design: PR #52 stage 0 = COLLECT + RECONSTRUCT; its review JSON ≈ findings/*.json; its `reports` ≈ REPORT; its `decision` and `delivery` records ≈ HUMAN plus receipts. New here: the role split (one worker per check), the claim-tagger as C2, ontology-advisor as C3, and the hard separation of advisory output from any Geo write or vote.
