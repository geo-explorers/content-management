# CLAUDE.md — content-management

**This repo is operated through skills, not by improvising. On EVERY request, first decide which skill applies, then invoke it.** Do not hand-write scripts to do a job a skill covers — the skills carry mandatory safeguards, and bypassing them is how duplicates and bad data reach Geo.

## Skill routing — check this before doing anything

| If the user wants to… | Use skill |
|---|---|
| **publish / create / update / delete** entities, relations, or content; "add X to Geo"; "publish…"; submit a proposal | **geo-publish** |
| **look up / search / inspect / query** the graph; "what type is…"; "show relations"; review or fact-check a submission | **geo-query** |
| find/merge **duplicates**, delete orphans, fix data types, move/copy entities, clean the graph | **geo-clean** |
| compare external press vs Geo — "what should we publish next" | **geo-press-review** |

If a request is ambiguous, ask which skill — don't guess and improvise.

## Hard rules

1. **Never write to Geo by hand.** Any publish/create/update/delete MUST go through **geo-publish** — never write or run a raw SDK/publish script yourself. geo-publish runs the mandatory safeguards (semantic-duplicate check, schema check, type-required check, dry-run → explicit confirm). A raw script skips all of them.

2. **If the matching skill is not loaded/available, STOP — do not fall back to improvising.** Tell the user, verbatim:
   > "The **geo-publish** skill isn't loaded in this session. Run `bash skill-dev/sync-skills.sh` from this folder, restart the app (or start a new chat), then try again."
   A missing skill means no safeguards; publishing without it is not allowed. (Common cause: the deployed skill copy is stale or absent — `git pull` alone does NOT update the running skill.)

3. **Secrets:** never read, print, or accept the user's private key — see the security contract in `README.md`.
