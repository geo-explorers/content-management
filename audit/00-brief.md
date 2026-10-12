# Brief (verbatim from user, 2026-10-09) — "Understanding next agent"

## Big picture
An agent that would perform bounty submission reviews on Geo. In Geo Curator program we recruit curators to make changes to the knowledge graph. Sometimes we ask to collect and structure data from public websites, sometimes ask to organize existing data, there are also bounties for continuous type of work (e.g. ingesting daily news stories). There are typically two type of bounties:
1. Type of bounty that can reuse existing ontology (types and properties). Easier to review: only verify data correctness and format.
2. Type of bounty that requires new types and properties. Verify data AND ontology: ensure reusable things are reused, new ones structured well. Documentation to be provided later.
Bounties may be presented in multiple Geo proposals -> agent checks each proposal and aggregates.
Big picture has ambiguities; we don't need all answers now. What we build will morph.

## Small picture (First MVP)
Isolated fraction: verify claims. MVP does NOT connect to Geo; works with mirrored data.
- Claims mirrored from World Affairs space to Notion: https://app.notion.com/p/0e2273e214eb83b0a2b1013e7d0958fc?v=2b0273e214eb83ec884888873d57cceb
- How to verify claims (specs table): https://app.notion.com/p/f05273e214eb8353b0a981544507de32?v=fcd273e214eb825d9be008f05e6e7392
- Not all specs immediately clear; not required to fully decompose this session.
- Goal: design the STRUCTURE of the new agent, not final details.

## Known required capabilities
- Other geo skills (actionable and not)
- Web access (verify info online)
- Standardized reporting
- ...more to come

## Task
1. Understand requirements; interview thoroughly until clear.
2. Analyse current repo setup:
   - Could this agent be deployed as a Claude Managed Agent in future?
   - Are we coupling all current/future agents to this repository?
   - Impact on team's way of working.
   - Does the new agent need to reside in this repository?
3. Design execution loop (MVP + Big picture).
4. Skeleton of first MVP (flows, diagrams, pseudocode).
5. Skeleton of big-picture agent.
6. Claude Artifact with output: tabs, tables, diagrams, visualizations.

## Context
- Team uses Claude Max subscription; runs agents locally (scheduled commands or manual skill invocation in Claude Code / Cowork).
- User: former content-team member, back from long break; repo created after they left; no senior technical supervision -> expect hacks/workarounds/vibecode.
- Team: non-technical + somewhat technical; no senior engineers before user.

## Open questions
- How should the agent be structured?
- Would subagents serve a purpose in the big picture?
- How much code is really needed?

## Resources
- Agent Composition (must read entirely): https://app.notion.com/p/Agent-Composition-3dc273e214eb814088b8de2e3184f988
- Example bounties:
  - https://curator.geobrowser.io/bounty/41e851610e13a19441c4d980f2f2ce6b/8181dcf5c33666a5a9328cffaa0be3d0
  - https://curator.geobrowser.io/bounty/4582fbbee28a16589154f7e36f1ee3c5/974d54402b9a4d53b90b8219a500e3bd
- Example bounty evaluations (Geo):
  - https://www.geobrowser.io/space/da96a4c26e718bfa6c27c3b1f3c316cd/57fa8a9f27ca54b1a2d65923d28aee7c
  - https://www.geobrowser.io/space/5908c73ad336472ccbd983491d2d17e4/d0518fed275253c0ab6e2fb0c3bfc6ba
  - https://www.geobrowser.io/space/5908c73ad336472ccbd983491d2d17e4/86895b9be59e5d30a76fa3a3b5378bfe

## Rules
- Quit immediately if any resource inaccessible; ask for alternative.
- Questions in batches of 5-8, most important first, prioritise what docs don't answer. Don't re-ask stated things. Running assumptions list shown before phase 2. Phases 2-6 only after "go".
- Verify work; ask when needed.
- Internet search for best practices to validate design decisions.
- Work until picture clear and report prepared. No rush.
- Subagents: Haiku = fetch/summarise pages; Opus/Sonnet = repo audit + best-practice search; main (Fable) = interview, verification, synthesis, final design.
- Be skeptical of repo design patterns; identify critical technical/workflow issues + proper solutions.
- Use geo-query / skills instead of Geobrowser links directly.
- Document as you work in ./special-agent (survive compaction).
- Side note: "Surprise me, I want to see the true power of Fable 5.1."

## Output
Claude artifact, visual: tabs, tables, diagrams, visualizations.
