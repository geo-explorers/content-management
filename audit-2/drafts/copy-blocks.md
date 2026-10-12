# Drafts — fixed copy blocks (verdict table, legends, glossary, correction callout)

## Verdict table (Tab 5, increment 1)

| Verdict | Meaning | Example |
|---|---|---|
| Supported | The sources contain the position, or the facts it rests on, even in different words | Claim: "The US should sanction banks in allied countries that help Russia evade sanctions." Source: a Reuters report on Treasury sanctions against a Turkish bank for Russia-related transactions |
| Partially supported | The sources cover part of the claim, or a weaker version of it | Claim names two countries; the source covers one |
| Not supported | The sources are readable but do not contain the claim. This is **not** "false": the claim may be true elsewhere | Claim about a 2026 policy; the only source is a 2024 background article on a different topic |
| Cannot check | No source is attached, or none could be read (dead link, paywall, unreadable PDF) | 41% of today's mirrored claims have no sources on Geo |

Footnote: FEVER*, the standard fact-checking label set, uses Supported / Refuted / Not enough info. We use "Not supported" instead of "Refuted" on purpose: debate claims are positions, not facts, and the agent only ever says what the attached sources contain.

## Correction callout (Tab 5)
**What changed since the first design.** Version 1 asked a cheap model to pull verbatim sentences from each source and kept only sentences that appeared character-for-character in the page. That gate is gone. Geo claims are written with LLMs from sources, so the wording almost never matches. The judge now reads the claim and the source text together and decides whether the meaning is supported. Passages it cites are illustrations for the editor, not a requirement. The one rule that stays: if no source text could be read, the verdict is "Cannot check", never a guess.

## Check-matrix legend (Tab 5, increment 3) — goes directly under the matrix heading
**How to read this table.** Each row is one check the reviewer runs on a submission. *Question it answers* is what the check decides, in plain words. *Applies to* says whether it runs for every bounty or only for bounties that add new types or properties. *Who decides* is **code** (deterministic, no model), **judge** (a Claude call following a written rubric) or **human**. *Result* is what the check produces: a finding the curator should fix, or a pass. A check that cannot run (unreadable proposal, dead source) says so in the review; it is never skipped silently. Severity letters on findings: S blocks acceptance, A should be fixed before acceptance, B is advisory, C is cosmetic.

## Check matrix (Tab 5, increment 3)

| Check | Question it answers | Applies to | Who decides | Result |
|---|---|---|---|---|
| C1 Rule compliance | Does each submitted item meet the rules written in the bounty? | all bounties | code where Geo can answer (has the tag, links a topic); judge for free-form rules | one finding per failed rule |
| C2 Sources support the claims | Do the attached sources support each submitted claim? | all bounties | judge (increment 1) | verdict + confidence per claim; Not supported / Cannot check become findings |
| C3 Ontology | Are new types or properties needed, or do existing ones already cover this? | new-ontology bounties only | judge using the ontology-advisor skill (D2) | findings on reuse, naming, duplicates |
| C4 Duplicates | Does a submitted claim or entity already exist in a canonical space? | all bounties | code (search) + small judge (same meaning?) | one finding per duplicate |
| C5 Schema | Do entities have the required types, valid relation targets and data types? | all bounties | code (read-only use of the publish gates) | one finding per violation |

## Severity legend (Tab 3)
S = breaks a hard rule or can corrupt Geo data · A = wrong and likely to spread · B = costs review effort · C = cosmetic.

## Glossary — `*` terms (per-tab footnote strips; ≤25 words each)
- **skill** — a folder with instructions (SKILL.md) and scripts that teaches Claude one job, e.g. "query Geo" or "publish to Geo". The library has 15.
- **agent** — a job runner: a persona plus config plus the skills it needs, started by a person or a schedule.
- **subagent** — a helper Claude instance with its own context and tool limits, spawned by an agent for one step (here: the judge).
- **orchestrator** — the agent part that runs the scripts, dispatches judges and talks to the editor; it never reads source pages itself.
- **judge** — the one model step: given a claim and its source text, decide whether the meaning is supported, following a written rubric.
- **rubric** — the written decision rules the judge follows; versioned, so any verdict can be traced to the rules used.
- **vendoring** — copying a dependency's files into your own repo at a known version instead of downloading them at run time.
- **lock file** — a list of every vendored file with its hash and the library version, so any change is detected.
- **tag / release** — a named, immutable point in the library's history (v1.0.0) that consumers pin to.
- **monorepo** — one repository holding several related projects (here: all agents) with shared tooling.
- **integrity manifest** — the library's list of per-skill content hashes; CI compares it with the files.
- **required check** — a CI job that must pass before a pull request can merge.
- **auto-approve allowlist** — the Claude Code setting that lets listed commands run without asking a human.
- **self-heal** — the current rule telling an agent to download the latest skills from GitHub mid-task and overwrite its own; removed in P0.
- **hard rules** — the non-negotiables: never write Geo by hand, every publish through geo-publish, every delete through geo-clean, never read secrets.
- **write path** — the single piece of code allowed to send changes to Geo; everything destructive is counted and gated there.
- **circuit breaker** — the write path's refusal to run a batch that removes too much data without an explicit human confirmation.
- **dry run** — a run that computes and shows what would be written, and writes nothing.
- **read-back** — after writing, read every written row again and report "0 remaining differences".
- **ledger** — one line per processed claim: model, tokens, cost, time, status; counts must reconcile.
- **idempotent** — safe to re-run: the same input never produces duplicate writes.
- **content is data** — the rule that text fetched from pages, Notion cells or proposals is evidence, never instructions.
- **Notion mirror** — a Notion table that copies Geo claims (one row per claim, with the Geo id) so editors can review in Notion.
- **taxonomy** — the Notion table of claim tags with their decision rules; 13 are Verified, 14 Proposed.
- **gold set** — rows whose verdict a human confirmed; the yardstick for measuring the agent.
- **confidence / calibration** — the judge's 0–1 estimate that an editor would agree; calibrated means 0.8 is right about 80% of the time.
- **FEVER** — the standard fact-verification benchmark and its labels Supported / Refuted / Not enough info.
- **proposal** — a Geo change request (a batch of edits) that voters accept or reject; its content is stored on IPFS.
- **bounty** — a paid task posted in the Geo Curator program; a curator submits one or more proposals to complete it.
- **curator** — the Geo contributor who submits proposals for a bounty.
- **IPFS** — the content-addressed storage where proposal payloads live; readable by anyone with the content id.
- **Review finding** — the Geo entity type already used for review feedback: statement, excerpt, issue, sources, evidence.
- **ontology-advisor** — the library skill that judges whether a new type or property is needed or an existing one fits.
- **PR #52** — an open draft pull request (geo-submission-review) that already collects and decodes a curator's proposals.
- **strangler fig** — migrate by growing the new structure around the old one and retiring the old piece by piece, never in one cut.
- **expand–contract** — add the new path first, move callers over, then remove the old path.
- **Managed Agent** — Anthropic's hosted runtime: the agents repo is mounted in a cloud sandbox; needs an API account, not the subscription.
- **Batches API** — submit many model requests at once for half price, results within a day.
