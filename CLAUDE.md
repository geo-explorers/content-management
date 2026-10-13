# CLAUDE.md — content-management

**This repo is operated through skills, not by improvising. On EVERY request, first decide which skill applies, then invoke it.** Do not hand-write scripts to do a job a skill covers — the skills carry mandatory safeguards, and bypassing them is how duplicates and bad data reach Geo.

## Skill routing — check this before doing anything

| If the user wants to… | Use skill |
|---|---|
| **publish / create / update / delete** entities, relations, or content; "add X to Geo"; "publish…"; submit a proposal | **geo-publish** |
| **look up / search / inspect / query** the graph; "what type is…"; "show relations"; review or fact-check a submission | **geo-query** |
| find/merge **duplicates**, delete orphans, fix data types, move/copy entities, clean the graph | **geo-clean** |
| compare external press vs Geo — "what should we publish next" | **geo-press-review** |
| write **claim-grouping results** (exact / semantic duplicates, related, supporting / opposing) into a **Notion Claims mirror** as review columns instead of Geo proposals; "claim grouping to Notion" | **geo-claim-grouping-notion** |

If a request is ambiguous, ask which skill — don't guess and improvise.

## Agents — read `agents/` before creating or running one

If the task involves **creating, editing, or invoking an agent** — or doing any work inside the **Agents flow** Notion teamspace (Agents flow center, Geo content work, the "- new" mirrors, Project tracking) — read these first:

| File | Read it when |
|---|---|
| **[`agents/AGENT-WORKFLOW.md`](agents/AGENT-WORKFLOW.md)** | **Always, before any work in the Agents flow teamspace.** The operating contract: where to work, the mandatory task lifecycle (log the task → `In progress` → do the work → write the result **+ a link to where it lives** → `Done`), the Work tracker and QA issue tracker schemas with their exact option values, the hard rules, and the known traps. |
| **[`agents/README.md`](agents/README.md)** | Before **creating or installing** an agent — the file format, where agents get installed, and the index of existing agents. Check whether an agent already covers the job before writing a new one. |

Two rules that come from those files and are easy to get wrong:
- **Log the task BEFORE starting work**, in the Work tracker, with `Projects` set to **Agent flows** — every view filters on it, so a task without it is invisible to the team.
- **Problems go in the QA issue tracker**, with severity + urgency + evidence — never buried in a task note.

## Hard rules

1. **Never write to Geo by hand.** Any publish/create/update/delete MUST go through **geo-publish** — never write or run a raw SDK/publish script yourself. geo-publish runs the mandatory safeguards (semantic-duplicate check, schema check, type-required check, dry-run → explicit confirm). A raw script skips all of them. **One exception:** changes an editor or agent made in a mirrored Notion table (any table with a `Geo ID` column) are published with **geo-mirror Part 2** (`plan-notion-changes.mjs` → `sync-to-geo.mjs`), which has its own approval, live-value checks and dry run. Creating entities and changing relations still go through geo-publish.

2. **If the matching skill's `SKILL.md` is missing, STOP — do not improvise, and do not download a replacement yourself.** Tell the user, verbatim:
   > "The **geo-publish** skill isn't available. Run `bash skill-dev/sync-skills.sh` from this folder, restart the app (or start a new chat), then try again."
   A missing skill means no safeguards; publishing without a **genuine** skill is not allowed. Never fabricate skill content to fill the gap. Skills are updated only by a person, from a reviewed release — never by an agent in the middle of a task. See [`MAINTAINERS.md`](MAINTAINERS.md).

3. **Deletion is the highest-risk operation — treat it as a red line.** NEVER hand-write a delete, and NEVER write a loop that deletes many entities (an improvised script once mass-deleted an entire personal space). Any delete/merge/cleanup MUST go through **geo-clean**, which runs an orphan check + explicit human confirmation first. As a backstop, `publishOps` refuses any batch that removes data from more than ~50 relations/values unless `CONFIRM_DESTRUCTIVE=1` is set — **do not set that flag to route around the skill.** If a user asks to "clear/delete/reset my space", route to geo-clean; do not build it yourself.

4. **Secrets:** never read, print, or accept the user's private key — see the security contract in `README.md`.
