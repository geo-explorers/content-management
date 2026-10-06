# Linked feedback and editor-approved votes

## Curator reply drafts

Prepare one short, constructive reply per curator/bounty case after publishing and verifying the report. Include its direct datasets-space URL and tell the curator to open the linked findings for details. Keep the language clear and kind. Do not send the draft unless the editor explicitly authorizes sending.

For a mixed batch, state that some items passed and others failed. Name the items that failed, or link a readable item list where the batch is large, and briefly explain the main reasons. Identify the work that passed by name or a clear linked group so the curator can focus on the rejected items and specific corrections rather than redoing accepted work. Do not expose internal counts, points, cap usage or payment-ledger checks. Do not imply that every item failed because the overall case needs a correction.

Use the actual stage: before voting, say “passed the review” / “recommended for acceptance” and “did not meet the requirements” / “recommended for rejection.” After verified votes, say “voted to accept/reject”; when execution is pending, say so. Only say the changes are published after execution and readback. Never imply payment without a payment receipt.

Accepted eligibility can coexist with a verified content correction. Name that exception clearly: the curator need not redo the accepted selection, but should address the specific wording, attribution or source issue. A correction-only case receives a correction request, not invented accepted/rejected groups. After approved voting, revise the draft to match the confirmed outcomes and preserve any required corrections.

## Concrete editor approval

Before asking, prepare the final reports, verified links and reply drafts. Give the editor a compact plan listing exact proposal IDs/links, curator, scope, recommended YES/NO and reasons. Separate correction holds from actual NO recommendations. A proposal containing both qualifying and disqualifying items cannot be partially accepted by a whole-proposal vote: flag it for splitting/correction or an explicit editor decision rather than applying an item-level tally as a blanket YES.

Explain the actual consequence of the proposed calls: a vote may also execute accepted content in fast mode, while slow mode can require a later execution transaction. Ask the editor whether to apply the listed accept/reject votes, explicitly including any immediate execution consequence. If separate execution is needed, include that action and its publication consequence in the same concrete approval request; otherwise obtain separate execution approval. Record the editor’s exact scope and any overrides with the case fingerprint, proposal content/version and approval evidence. Do not ask again for unchanged actions already approved. Approval for reports alone does not approve votes; approval for a YES vote alone does not establish separate execution authorization.

## Apply and verify approved actions

Use the workspace’s supported governance tools and geo-publish safeguards for content execution. The review runner records decisions and delivery receipts; it does not sign or broadcast. Do not import a private key into the read-only intake runner.

Refresh the proposal payload/version, current review applicability, editor identity/permissions, existing votes and live voting rules before acting. Pause only affected actions if content changed, authority is missing or a current restriction prevents them; report the exact blocker. Skip already completed matching actions. Keep correction holds unvoted unless the editor explicitly approves a different decision. Rejecting a proposal means the supported NO/rejection action, not deleting submitted entities.

Journal intended actions before broadcasting and save transaction IDs, on-chain results and indexed readback separately. After a timeout or unknown outcome, reconcile live state before retrying. Verify each approved vote; distinguish a recorded NO from the UI still displaying a pending proposal. Execute accepted proposals only when covered by explicit approval and current voting rules allow it. A future eligibility window requires a recorded pending action and authorized follow-up; never bypass the window or repeat the vote. Show dates/times in UTC.

Record confirmed editor decisions and delivery receipts in durable case state. Return published report links, revised feedback drafts and a brief editor-only outcome, including any pending execution. Payouts and Discord sending retain their separate authorization requirements.
