# 00 — Brief for session 2 (2026-10-11), verbatim, plus interview answers

Continuation of the session documented in `special-agent/Summary.md`. Original artifact: https://claude.ai/artifact/58bibLGuYwkAvftdsNUvqm

## The user's brief (verbatim)

> I want to use work of the previous session to distil a new document.
>
> Goal for this session is an artifact that includes:
>
> * Shortly document the need for migration.
> * Realistic migration path to 2+ repository system (*1) that unblocks development
> * Backlog for issues that needs fixing ranked by their severity.
> * Provide suggested directory structure for both repos.
> * QA agent setup (currently named big picture). Some feedback from original artifact: Data contracts json is poorly formatted and hard to read. Check matrix needs a description on how to read the table.
>
> You do not have to follow the bullet point structure in your final output. This will be presented during a team meeting. We have to establish the current status, the need to separate repositories, and present a clear picture on how the agents should be structured, and the big picture implementation plan for the QA agent.
>
> Notes:
>
> * We are a live product and can't block development and start refactoring everything. We may be ok with carrying over some tech debt, if allows us to migrate without blocking other devs.
> * More focus on local agents with Claude Subscription as the default. Only mention claude managed agents as an alternative.
>
> Critique on original artifact:
>
> * It has missed the point of the mvp. We should not look for quotes in verbatim, because Geo users use LLMs to generate claims out of sources, so the claim will not be identically framed in original sources. It needs an LLM analysis whether [cut off — clarified in interview: whether the sources semantically support the claim]
>
> Rules:
>
> * Artifact must be easy to read
> * Less is more. We don't need to write full spec with every code line written out. This information will be presented during a team technical meeting and must be clear and easy to follow. Any keywords that carry a lot of context can be marked with (`*`) with context below main content.
> * Utilize tabs, tables, diagrams and pseudo code.
> * You will ask me 4-5 follow up questions in batches, until the requirements are clear.
> * You will use internet search to confirm best practices are used. All best practices and their sources should be documented in the final artifact.
> * You will be the main orchestrator and utilize subagents efficiently - use Haiku for small units of work or fetching info, Sonnet 5.5 to work with code, Opus 5.5 for hard work, reasoning.
> * All Json must be formatted properly.
> * You will not assume that reviewers of the final artifact will have prior deep knowledge about the repository. Don't just drop function names and expect everyone to understand. Consider how each section will help the reviewer to understand. The document must big high level and must be understood by non-technical people/stakeholders. Details can be polished at later stages.
> * Your working directory is `./special-agent-2`. Make sure to document as you go, so your work survives session compaction.
> * This is a long running task - do not quit early. Create Fable or Opus subagent that reviews the final document, and ask him to verify the output and it's structure. If needed, decide on the final output together.
>
> *1 Would ALL agents live there, or would there be 1 skills repo and many agents repo?

Mid-turn note from the user (while planning): **"Keep in mind geo-editor-agent was also vibecoded by the same devs. Do not use that as a golden standard."**

## Interview — batch 1 (asked and answered 2026-10-11)

| # | Question | Answer |
|---|---|---|
| 1 | What should the MVP's core verification verdict be? | **"Simplest for now."** |
| 2 | Footnote *1: shape of the 2+ repo system? | **1 skills library + 1 agents repo** (all agents in one repo, one folder per agent) |
| 3 | Which repository becomes the agents repo? | **New repo under geo-explorers** (not geo-editor-agent) |
| 4 | How much library clean-up must land before agents move? | **Fence first, refactor later** (safety fixes + tagged release only; the rest incrementally after) |

## Interview — batch 2

| # | Question | Answer |
|---|---|---|
| 5 | Confirm reading of "simplest": MVP = ONE semantic verdict per claim (do the attached sources support it?) + 0–1 confidence + short reasoning note in the Notion table; 13-tag taxonomy later | **Yes, exactly that.** Verdicts: Supported / Partially supported / Not supported / Cannot check |
| 6 | Backlog scope | **All audit findings, ranked S/A/B/C, each tagged before / with / after move; cosmetic collapsed** |
| 7 | Execution modes in the document | **Subscription default, API-key mode as a note, Managed Agents as the alternative** |
| 8 | Timeline concreteness | **Phases + rough effort range + owner role (no dates)** |
