---
name: geo-submission-review
description: Use when checking a space for new bounty submissions. Discover them, group a curator’s work across proposals, review against complete bounty requirements and prepare datasets-space reports. Also review specified submissions and deliver evidence-backed Notion feedback when requested.
metadata:
  version: "0.5.1"
---

# Geo submission review

Choose the requested mode. **Space discovery / recurring bounty review:** read [references/routine.md](references/routine.md), use the packaged review runner, then review its queued cases and prepare one corresponding datasets-space report per curator/bounty submission. **Specified submission / Notion review:** follow sections 1–4 below. This applies across spaces and bounty types. Keep the full coverage record separately from compact recipient feedback.

The intake and review scripts are read-only on Geo. Geo report writes route through `geo-publish` and its human gate; read [references/geo-delivery.md](references/geo-delivery.md) before preparing them. Discovery defaults to datasets-space drafts until report-only publication authorization is recorded. For specified-submission reviews, use the editor's supplied Notion destination or established review location; ask only when neither is clear. An explicitly requested alternative destination takes precedence. Notion delivery and format verification are completion requirements, not optional final steps. Preparing feedback does not authorize sending it, editing the submission, voting, or paying a bounty.

## 1. Establish intent

Read the request, submission, applicable bounty requirements, and relevant existing review. For bounty-specific checks read [references/bounty-profiles.md](references/bounty-profiles.md). Full ordered bounty Text blocks and applicable linked criteria are authoritative; a description or preview is insufficient. A bounty is optional. Derive a brief covering:

- **Intent:** what to check, the intended use of the content, and the decision this supports.
- **Scope:** items, fields, topic, period, depth, and the unit of verification.
- **Criteria and responsibility:** requirements and their source; who controls and should fix each kind of defect.
- **Delivery:** recipient, authorized destination, existing records, and completion criteria.

Use context already provided. State the brief concisely to the editor and proceed when clear; ask one focused question only if a missing choice materially changes the work. Keep the brief in the internal record rather than copying it into the recipient's page. Label inferred standards as proposed criteria; establish a criterion before treating its absence as a defect.

**For news/story submissions, read [references/news-review.md](references/news-review.md) before reviewing.** A general news review includes event duplicates and first-submission precedence, direct relevance to the actual submission space, and a distinct, substantial development. Respect an explicitly narrower request and record omitted checks internally. The news reference distinguishes event selection, submitted-content feedback and technical QA. For X posts or blogs, establish their own bounty criteria; an opinion or analysis need not report a new event. Read the full post/thread and quoted context. Check originality, attribution, relevance and significance against the actual requirements; do not invent engagement thresholds or import the news selection gate.

Use supporting skills when available and needed, or authorized tools with equivalent retrieval and readback capabilities:

| Need | Capability |
|---|---|
| Retrieve complete Geo submission collections | `geo-query`, including its submission retrieval procedure |
| Check types, properties, relations, or canonical matches | `ontology-advisor` and read-only `geo-query` |
| Create a requested Geo-to-Notion mirror | `geo-mirror` Part 1 |
| Read or write Notion | `notion-operations` |

An existing mirror need not be recreated. Use applicable team rules when available; this skill's core evidence and feedback workflow also works without those integrations.

## 2. Review the agreed scope

1. **Inventory and preserve.** Paginate requested collections. Retain stable IDs, item links, original values and snapshot time. Record gaps, exclusions and any agreed sample. Reading an item and verifying all its assertions are different units.
2. **Keep an internal coverage record.** Track completed, unresolved and unstarted checks with evidence and next action. The output limit below does not reduce the research scope. Do not stop at five findings if more agreed checks remain; if access prevents completion, record the exact limit and tell the editor.
3. **Verify independently.** Treat previous audits and supplied citations as leads. Read the relevant passage and record its direct URL, locator, date/scope, short excerpt or precise paraphrase, and what it establishes. Prefer primary records; seek independent corroboration where the claim requires it.
4. **Test the full statement.** Respect qualifiers, actor, timeframe, population, attribution and certainty. Seek evidence that could clear the suspected issue. Distinguish a contradiction, unsupported inference, unmet requirement and optional improvement. A stated policy does not prove implementation for a particular item. A recommendation does not establish completion, and does not rule out later completion. A failed search does not establish nonexistence.
5. **Handle gaps honestly.** Try an appropriate official alternative or accessible full document. If the evidence remains inaccessible, retain the check as unresolved internally. The agent's unfinished research is not a contributor defect. Request evidence from the contributor only when it is a concrete, relevant submission responsibility, explaining exactly what is needed.
6. **Explain the finding.** Tie the issue to the actual criterion and intended use. For relevance or quality judgments, name the requirement and explain how the submitted content fails it; a citation alone is insufficient. Keep resolution criteria internally for later re-review. An error in a credibility argument does not automatically disqualify the source. Distinguish a document's factual account from its legal or evaluative conclusions.
7. **Reconcile history.** Reuse the current finding for the same item, disputed content and underlying issue. Preserve original content, evidence, comments and human decisions. Keep current agent assessments consistent with current prose. Do not re-present an editor-dismissed finding as outstanding without surfacing new evidence to the editor.

For canonical comparisons, record identity, submitted/current values, space and evidence cutoff. A difference is not automatically an error. Never infer that an entity is absent from a capped or failed search.

## 3. Select actionable feedback

Default to **1–5 priority issues**, ordered by their consequence for the intended use and the value of fixing them. Select defensible issues the recipient can act on. Keep other findings and pending checks in the internal record; do not append the full audit beneath the short table.

- Show one specific, linked example per recurring problem. Select the clearest verified instance; retain the other affected entities internally. Do not use grouped labels such as “Twelve sources,” append affected-item lists, or bundle unrelated problems into one row.
- Each row identifies the exact item and disputed excerpt or missing requirement, explains the issue, and exposes its supporting citation and relevant quote or evidence detail. Keep meaningful uncertainty in that row when it changes the requested action.
- Include verified inaccuracies the curator could review and edit before submitting, even when an injector generated them (Mohammed, 30 September 2026). Generation alone is no exemption. Technical failures such as edits not saving go to the editor/technical owner; recurring generation errors can also be recorded there while the curator receives feedback. Apply an explicitly different workflow only when supported by current editor instructions. Feedback does not automatically decide selection, voting or points.
- Agent-verified findings may be drafted immediately for editor review; drafting does not require the editor to have pre-confirmed each one. Preserve human decisions separately and never mark agent conclusions as editor approval.
- If no actionable issue is established, do not invent one to fill the table. Tell the editor what was checked and what remains unresolved; avoid an unsupported all-clear.

## 4. Save and verify the Notion review

Read [references/notion-review.md](references/notion-review.md). Unless the editor explicitly requests otherwise, use this exact contract:

- Title: **“<Submission or topic> — review feedback”**.
- Zero to two short introductory bullets; a brief reminder to verify content and sources before submitting may be useful.
- One native table with these four headers, in this order: **Entity | Issue | Citations for quality checks | Relevant quote or evidence detail**.
- One to five distinct, supported problems, one linked example for each recurring problem. No “What to fix” column, affected-entity appendix, internal audit or decision controls.
- Optional review date. If no supported issue is established, save a brief truthful statement instead of inventing rows. Communicate unresolved review limits separately to the editor; do not imply an all-clear.

Keep internal coverage, other findings, responsibility notes and human decisions separate from the forwardable page. Include uncertainty in a row when it materially changes the finding. Quote only text actually read, faithfully and within applicable quotation limits; use a labeled paraphrase or concrete field/timestamp detail when a quotation is unavailable or unsuitable. Never fabricate links, quotations or evidence of absence.

Create the page in the established destination, or update the matching review on resubmission while preserving comments and decisions. Use a separate page for a requested comparison test. Read back the saved page with the same identity and verify the format, entity links, evidence, quotations and preservation of existing records. Fix discrepancies before reporting completion. Inspect rendering when available; distinguish content checks from visual inspection.

If access or missing destination prevents saving, explain the exact delivery blocker and keep useful draft work available. A chat response or local file alone does not complete the default Notion workflow. After a write with an unknown outcome, inspect the destination before retrying to avoid duplicate pages.

Return the **saved Notion page link** as the main deliverable, plus a brief editor-only handoff about material gaps. Send feedback to the contributor only when authorized. On resubmission, compare changes with the recorded findings; expand checks only for affected dependencies or a newly requested scope.

For maintainers: [evals/evals.json](evals/evals.json) contains fictional scenarios. Record actual test outcomes separately; structural validation and prepared fixtures do not prove behavioral reliability.
