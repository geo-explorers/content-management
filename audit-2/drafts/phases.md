# Phases

Efforts are rough, for one person working mostly on this, and carry no calendar dates. Normal content work continues in every phase.

| Phase | What happens (plain words) | Effort (rough range) | Owner role | What it unblocks | Done when (observable) |
|---|---|---|---|---|---|
| P0 Fence (safety only) | Make today's library safe to run against: lock away dangerous scripts, tighten auto-approval and key handling, remove self-update, retire the one-"go" publisher and the unchecked voting publisher, make the integrity check required. | 2-4 days | Library maintainer; repo admin for merge rules | Safe to point agents at the library; automated checks become trustworthy | Integrity check is green and blocks merging; old delete and write scripts are gone; no self-update instruction remains; a search for the two removed publishers finds nothing |
| P1 Tag + new repo | Cut a signed release v1.0.0 of the library. Create the new agents repository (geo-explorers/geo-agents). Copy skills at that release with a fingerprint list per file. Move agents, the workflow document and ids (into config) over. Add a check that copies match the release. | 1-2 weeks | Library maintainer (release); repo admin (new repository); agent developer (move) | Agents live apart from the library; every agent run uses a known, verified skill version | New repository exists; a tampered skill copy fails its check; the library no longer holds agent files; ids load from config |
| P2 QA agent, increment 1 | In the agents repository, build the claim-checking agent: one judgment per claim on whether the attached sources support it. Supervised runs of 50 claims; editors review the first 100 rows to form a reference set; loop is preview, publish, read back. | 3-5 weeks | Agent developer; editor (content team) for review | First real agent output in Notion; a measured accuracy baseline | 100 reviewed rows saved as the reference set; 50-claim run finishes with every row read back and matching; editors sign off the verdict rules |
| P3 Incremental consolidation | In parallel with normal work, one skill per change: one shared code package with a single write path and complete mass-delete stop; skills use it; duplicate clients removed; query and publish fixes; shorter descriptions; one runtime; Windows-safe checks. | 6-10 weeks, spread over normal work | Library maintainer; agent developer | Backlog rows left "after move"; hosted runs; lower review cost | Every skill uses the shared package; one write path remains; all backlog rows closed or consciously deferred; checks pass on Windows |
| Later | Increment 2: apply the 13 verified tags. Increment 3: bounty-submission reviewer, including triage of the existing draft submission-review proposal (PR #52). Option: run agents hosted (Managed Agent). | 2-3 weeks; 3-5 weeks; 1-2 weeks | Agent developer; editor (content team) | Tag application; reviewer workload relief; unattended scheduled runs | Each increment has its own reviewed reference set and a supervised run; hosted run has a spend budget and a limited network list |

Plan source: P0 is migration step 1 plus removing self-update (step 4) plus the two publisher problems (backlog rows 5 and 6). P1 is steps 4 (release tag) and 5. P2 is step 6. P3 is steps 2 and 3. Later is steps 7 and 8.

## Debt we deliberately carry until P3

- Duplicated query and Notion clients (about 18 and 8) and seven copies of the space list stay; they work, they are just costly to change.
- Long skills and over-long descriptions stay, so context cost remains high and skill selection is imperfect.
- Delete-safety is partly prose: the mass-delete stop is incomplete until the single write path exists, so deletions stay behind the cleanup skill and a person's confirmation.

## What keeps working during every phase

- Editors keep publishing, cleaning and querying through the existing skills, each with its confirm-before-publish steps.
- The Notion mirror, claim grouping and press review keep running as they do today.
- The task and QA tracker routine keeps its logging rules; nothing about daily editorial work has to pause.
