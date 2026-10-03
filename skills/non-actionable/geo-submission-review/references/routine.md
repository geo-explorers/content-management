# Discovery and recurring review

## Runtime and durable configuration

Use `scripts/review.mjs` with Node.js (Node 20+), fetch and the installed `@geoprotocol/grc-20` decoder. Stage 0 finds the decoder through `GEO_CM_DIR` when this skill is deployed separately from content-management. No private key is needed for intake. Use the workspace's configured public editor/injector IDs. Keep configuration, state, cache and dated runs outside the installed skill. Do not derive a first-run checkpoint from an old brief.

The JSON configuration contains `editorSpaceId`, optional `injectorSpaceId`, shared `cacheDir`, `concurrency` (default 8), `intakeTimeoutMs`, and `spaces`. Each space has `enabled`, `firstSince`, `bountyProfiles` by full bounty ID, evidence-backed `dispositions` for verified non-bounty work, explicit `assignments` where needed and verified `editOrder` for multi-payload proposals. Supported keys are crypto, ai, health, world-affairs and us-politics. Scripts carry the main/datasets IDs. A profile is `{family:"routine",kind:"news|x|blog|fact-check|organize-claims"}` or `{family:"bespoke",singleDeliverable:true}`. Distinct deliverables need an explicit `caseKey`. Profiles classify work; they do not replace full requirements.

`reviewHistory` maps exact proposal IDs to `{evidence:[...],...}` with actual review/decision receipts. Seeds never mean approved or paid unless the receipt says so. Untagged assignments require recorded evidence and item IDs; mixed bounties require explicit disjoint item partitions. Do not guess from title similarity. Routine case keys are Lagos submission dates; revisions to the same existing items follow their earlier case. A mix of repairs and new items needs explicit partitioning. Bespoke cases span proposals/days for the same deliverable.

Run commands from the installed skill directory, with absolute paths for configuration/state/output:

```bash
node scripts/review.mjs preflight --config CONFIG --state STATE --out RUN
node scripts/review.mjs scan --space crypto --config CONFIG --state STATE --out RUN
node scripts/review.mjs evidence --state STATE --out EVIDENCE
node scripts/review.mjs record --review REVIEWS_JSON --state STATE --out RECEIPT
node scripts/review.mjs reports --state STATE --out DRAFTS
```

`scan` uses an explicit first cutoff, then the saved discovery cutoff with 60-second overlap. Both latest-300 feeds must cross the cutoff; incomplete discovery fails closed. Saved `proposalHistory` is the tested cursor fallback for overflow/bootstrap. It is not automatically substituted by the fast scanner. Do not attempt recovery by changing only `--until` on the same saturated latest feed. Keep failed retrieval receipts and exact blocker; no-new-work is a complete empty result, not a failed fetch.

Stage 0 saves a full proposal inventory and skipped-editor/injector reasons, lossless `raw-edits.json`, actions, names and compact previews. Only full raw values drive reviews. Full-field reads retain typed values, ownership and count checks. Cached binaries are decoded/validated before reuse. Specifications are fetched once per distinct bounty and include ordered blocks, complete text, snapshot hash and linked-criteria candidates. Linked Geo criteria page/block shells are snapshotted and included in the specification fingerprint; their table rows/query results and external documents still require explicit retrieval and coverage checks. Resolve relevant linked criteria before assessing the case, and record effective scope/date. Current changed requirements need applicability evidence before being imposed retrospectively.

## Review the queue

Read `case-summary.json`, `review-queue.json` and the persisted identification queue. A complete intake is not a completed review. `evidence` writes each case's ordered submitted operation history and projection. Unchanged fields require a captured baseline; today's live graph is not automatically the submission-time baseline. Preserve pending/deleted/unindexed/error distinctions. Inspect submitted IDs before name-search matches; empty stubs cannot replace the actual payload.

Use the review workflow in SKILL.md, [bounty-profiles.md](bounty-profiles.md), and the News reference as applicable. Every scoped item and applicable requirement needs an outcome and evidence or a precise gap. Reviews use `meets_requirements`, `needs_correction`, `does_not_meet_requirements` or `unresolved`; these are agent assessments, not votes or editor decisions. `checkedAt` is the actual evidence cutoff. Include at most five distinct priority feedback rows, but retain all assessed items and unresolved checks internally.

A review JSON has `caseId`, current `fingerprint`, `outcome`, `checkedAt`, `coverage:[{itemId,outcome,evidence,note}]`, `requirements:[{criterion,outcome,evidence}]`, and `findings`. Each finding has `itemId`, optional verified `itemUrl`, full `original`, `originalRef:{proposalId,entityId,propertyId,cid?,opIndex?}`, exact `excerpt`, `issue`, `citations:[{url,locator,retrievedAt}]`, and `evidenceDetail`. Missing-field rows use `missingField:true`, `missingRequirement` and no invented excerpt. The recorder rejects stale fingerprints, omitted items, shortened originals and nonverbatim excerpts. It verifies provenance, not factual accuracy; sources must still be independently read.

Record publication receipts separately through `delivery --delivery FILE`; a verified receipt needs current fingerprint, report ID, URL and readback time. Failed/unknown updates retain earlier delivery history. Record explicit human decisions through `decision --decision FILE`, with stable `id`, `caseId`, `kind`, `recordedAt`, and authorization `evidence`. Preserve previous assessments, comments and editor close-outs. A later discretionary payout/close-out does not erase QA, and old QA must not revive an unpaid hold. `review_unresolved` cases remain in state; revisit at a configured retry interval or when evidence changes rather than researching unchanged inaccessible evidence twice daily.

## State, recovery and delivery

`state.json` schema 1 stores per-space discovery cutoff, pending identification, proposals with raw snapshots/items/prior receipts, cases with stable identity, specification, fingerprints, reviews/revisions, editor decisions, and separate delivery status. Locks are exclusive; investigate ownership before removing a stale lock. State replacement is atomic. Discovery advances only after durable capture; unresolved review/delivery work remains separate. Captured cases and ambiguous work are reconsidered on subsequent scans without downloading immutable CIDs again. Fatal runs do not replace a successful state.

`reports` generates Markdown and JSON drafts with deterministic report page IDs and the corresponding datasets target. Identical cases map to the same report; an explicitly adopted existing report ID is retained. Unchanged drafts are listed separately in the receipt and retain verified delivery status. Changed drafts retain prior delivery history. The six fields are **Entity | Full original statement | Exact excerpt under review | Issue | Citations for quality checks | Relevant quote or evidence detail**. Full originals survive; no supported finding produces a truthful scope statement, not manufactured problems. Read [geo-delivery.md](geo-delivery.md) for authorized publication and readback. Report draft creation does not complete Geo delivery.

A scheduled agent executes enabled spaces serially with one shared CID cache and bounded pool. It then reviews new/changed or due unresolved cases, records supported assessments, prepares drafts, and reports material failures or required editor action. Set an overall session budget; inaccessible work stays queued. No-change runs stay quiet. Record the tested skill commit/config and dated receipts; a configured schedule is not proof of completed runs. Votes, points, promotion and Discord sends remain separate explicit workflows.
