# Review 3 — "QA agent" tab, read as a product lead (not an engineer)

Reviewer stance: I use Claude daily, I know what agents, subagents, prompts, rubrics and tool calls are. I have never opened the repository and do not know its skill or script names. I read the Where tab's orientation box and lede, the QA tab in full, and the glossary.

## 1. Read-through, honestly

- Yes, I can retell it: one orchestrator runs a fixed pipeline; scripts collect and tidy, five parallel Claude "judges" each check one thing against a written rubric, a script merges, a model writes the review, the maintainer approves, and only then is anything shared or published. The curator gets a Notion page with verdict + findings table. That is a clear story.
- The lede, the three In/Out cards and the diagram carry the whole tab. I understood the flow from those before reading any table.
- The **Check matrix legend** ("script / judge / human", severities S–C, "never skipped silently") is the best paragraph on the tab. It is where the design clicked. Everything else should read like that.
- I got lost in **"How the skills are used"**: bare names (geo-query, geo-claim-grouping "discovery part", geo-publish "its gates only"), plus "(D1)" and "(D2)" with no referent on this tab. I re-read it twice and still could not say what "the discovery part" is.
- I shrugged at "new-ontology / reuse-ontology": I guessed it means "bounties that invent new kinds of things vs. bounties that fill in existing kinds", but the word is never defined.
- The three JSON examples do not tell one story (bounty about a US–China AI hotline; entity about sanctioning banks; finding about 2025 emissions). I stopped to work out whether I had misread the structure. I had not; the example is just inconsistent.
- "Who does what" + "Check matrix" + diagram + pseudocode are four views of the same five checks. By the fourth I was skimming.
- Three humans appear (curator, maintainer, "editor") and I am sure about only two of them.

## 2. Blocking for a non-engineer

1. [How the skills are used] "geo-query; the proposal reader from PR #52" / "geo-claim-grouping, discovery part" / "geo-publish, its gates only" — the "Skill or module" column is a list of repository names; "discovery part" and "gates" are repository concepts. I can guess geo-query and geo-publish from the glossary's skill entry; not the rest. — Rewrite: add a plain gloss after each name: "geo-query (reads Geo)", "the proposal reader from PR #52 (turns a proposal into a list of changes)", "geo-claim-grouping, search step only (finds claims with similar meaning; the step that writes groups to Geo is not used)", "geo-publish, pre-flight checks only (validates a batch the way a real publish would, then stops)".
2. [How the skills are used, rows C2 and C3] "which of the 13 Verified tags apply (D1)" / "naming and description quality (D2)" — D1/D2 are decision numbers from the Where tab; on this tab they are two letters. — Rewrite: "(decision D1, Where tab: the agent applies only the 13 Verified tags)" and "(decision D2, Where tab: the existing ontology-advisor skill is the judge until the ontology docs exist)", or link `#where`.
3. [How the review is orchestrated, diagram step 3 and C3] "adds new types or properties? → new-ontology, else reuse-ontology" — "ontology", "type" and "property" are never defined; the whole branch rests on them. — Rewrite: add one sentence to the orchestration paragraph: "Most bounties fill in existing kinds of entities. Some ask for new kinds or new properties (changes to the space's *ontology*); those get one extra check, C3." Mark `ontology` with a glossary entry.
4. [In and out, Submission card] "decoded into the entities, values and relations they would add or change" — three nouns, two undefined; the glossary's Geo entry uses different words ("properties and links"). — Rewrite: "unpacked into the plain list of what it would add or change in Geo: entities, their properties (values) and the links between them (relations)", and use the same two words in the glossary.
5. [What already exists] "the editor authorizations, payout policy and voting embedded in it are left out" — three things from a PR I have never seen, one of which (payout policy) sounds like a product decision I should have an opinion on. — Rewrite: "PR #52 also contains logic for who may edit, how payouts are decided and automatic voting. None of that belongs in an advisory reviewer, so it is left out."
6. [What the records look like] bounty "US-China AI hotline claims" / entity "The US should sanction banks…" / finding "Emissions fell 8% in 2025" — not a repository problem, but the worked example contradicts itself three times, so the section cannot be followed as an example. — Rewrite: one bounty, one claim from it, one finding about that claim, with the summary sentence matching the finding.
7. [Diagram step 1 and glossary] "optional editor context" — who is the editor? The human gate is the maintainer; the orientation box says editors publish to Geo. — Rewrite: if it is the maintainer, say "optional notes from the maintainer"; if it is a Geo team editor, say so and say what context they add.

## 3. Technical but fine (do not simplify away)

- "Claude subagents that each load one skill and one rubric, read files only, and write their findings to files" — I understood this and it is the sentence that makes the design credible (isolation, one skill each). Keep it.
- "a single decoded proposal can be thousands of operations, so each worker gets a clean context" — the why behind the fan-out; clear enough for anyone who has hit a context limit.
- The Check matrix legend and the S/A/B/C severities — technical, perfectly followable.
- "Every record is checked against its schema before the next step uses it" — glossary covers it.
- The pseudocode — readable; the `findings/<check>.json` and `review.json` names are noise I skip, not a blocker.
- The finding JSON and its field table — the single most persuasive object on the tab (statement / issue / evidence / confidence). Keep this one.
- "geo-publish runs its dry run and waits for the explicit publish word" — glossary explains dry run; the human gate is obvious.
- "Never reads proposal payloads or source pages itself" — "payloads" is jargon but inferable. Add the why in six words: "so text in a submission cannot steer it".

## 4. Too much / too little

Too much for a stakeholder meeting:
- Two JSON blocks plus two field tables (~95 lines of the tab). Keep the finding example; collapse or drop the reconstructed-submission JSON.
- The pseudocode repeats the diagram one-to-one. Keep the diagram; put the pseudocode in a collapsible block.
- "Who does what" largely repeats the Check matrix. One table with a "Worker" column would do.

Too little (I expected and did not find):
- How a review starts: automatically when a submission lands, or when the maintainer asks? Where does the maintainer run it, and must they have Claude Code?
- What the maintainer actually sees and does in step 6: a Notion draft? A terminal? Can they delete a finding or change the verdict, and does that teach the rubric anything?
- What happens when the agent is unsure. Findings carry a confidence score, but nothing says what happens at 0.5: lower severity, "could not be verified" section, hidden from the curator? And what if C4 says duplicate while C2 says the claim is fine?
- Who owns the agent and its rubrics, and who receives the QA issues it raises.
- Cost and time per review, and how many submissions per week this is meant to handle.
- How we will know it is good: a pilot against the three hand-written reviews? What agreement rate means "ship"?
- Whether the curator sees the confidence score and the verdict, or only the findings.

## 5. Glossary check

Marked, but the entry does not explain or contradicts the tab:
- **judge** — entry describes only the C2 claim-support judge ("given a claim and its source text…"); the tab has judges for rules, ontology and duplicates too. Suggest: "A Claude step that applies one written rubric to one input and explains its decision. The QA agent has one per check."
- **subagent** — "Here: the orchestrator and the judge"; the tab has five judges and a report writer.
- **orchestrator** — "talks to the editor"; on the tab the human is the maintainer.
- **QA agent** — "checks claims (first), applies tags (second), reviews bounty submissions (third)" contradicts D7 and the tab, where bounty review is the whole job. Stale from the first design.
- **Review finding** — five fields listed; "What already exists" says "six-field finding format"; the JSON shows nine. Pick one count.
- **proposal** — "stored on IPFS" introduces a new undefined term; "stored in a public file store" or drop it.
- **taxonomy** — fine, but add "(approved for use)" after Verified so "Verified tags" stops reading as "tags that verify the claim".

Used on this tab, should be marked: **ontology** (and new-/reuse-ontology), **type / property / value / relation**, **dry run** (in the glossary, not marked here), **Verified tag**, **editor**, **space**, **workflow guide / Work tracker / QA issue tracker**, and the three skill names if they stay bare.

## 6. Three questions I would ask in the meeting

1. Who presses go? Does a review start by itself when a submission arrives, or does the maintainer run it, and from where? What does the maintainer actually see at step 6, and how long does one review take and cost?
2. When the agent is not sure, or two checks disagree, what reaches the maintainer and what reaches the curator? Does the curator ever see a confidence number?
3. Before a curator ever sees one of these pages, how do we prove it is good? Will we run it on the three hand-reviewed submissions and compare, and who owns the rubrics when they turn out to be wrong?

## 7. Verdict

**Ready with the blocking fixes.** The design and its story are right; the fixes are vocabulary, one consistent example, and three missing "who/when" answers, not architecture.

---
## Conversation outcome (author ↔ reviewer, 2026-10-11)
- Accepted all 7 blocking items and all glossary fixes; new glossary entries ontology, entity/property/relation, space, Work tracker.
- Pushback 1 (pseudocode): kept visible, trimmed to 8 lines, no file names; diagram and pseudocode aligned step for step. Reviewer accepted.
- Pushback 2 (submission record): collapsed under "Details for engineers: what step 2, Reconstruct, produces". Reviewer accepted.
- Pushback 3 (skill names): bare names with an inline plain gloss, consistent naming afterwards. Reviewer accepted.
- Missing items → "Starting, deciding, learning" (5 bullets) with the reviewer's amendments: adoption clause for non-developer maintainers; "not verified, without the score" for the curator and one content-team floor; measurable pilot bar, three reviews = smoke test; time-and-cost line.
- Final pass: nothing needs repository knowledge; one worked example across all records; verdict **ready**. Three optional polish items applied.
