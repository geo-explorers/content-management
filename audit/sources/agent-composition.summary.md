# Agent Composition — summary

Source: Notion page "🧩 Agent Composition" (id 3dc273e214eb814088b8de2e3184f988), under Agents flow center. Full verbatim copy: `agent-composition.md` in this folder.

## Summary

"Agent Composition" is the shared map of everything that makes up a Geo agent: its documents, skills, AI workflow procedures and connectors. The initial catalog edition is dated 16 September 2026; the composition sections were refreshed on 29 September and 2 October 2026. The page is organised around five linked databases: a Composition directory, MDs & documents (51 records, documents only, in five levels), Skills (15 installed, 2 proposed, plus the Notion → Geo publisher capability), AI workflows (15 workflows, 118 steps) and Connectors & runtime (8 records). Documents define identity, rules and contracts; skills are reusable procedure packages; workflows describe actions as step records with dependencies; connectors record system access and setup. A worked example, Geo → Notion mirroring, combines geo-query, geo-mirror, a mirror contract, a Geo read client, Notion and a local runtime across eleven steps.

The page sets seven working agreements: search by stable Key before creating anything; keep one authoritative editable source per component; label design requirements and limits; update related steps when a document, skill or connector changes; compare baseline, Notion and local revisions before distributing updates; log tasks first in Project tracking with Projects = Agent flows; and write many Notion rows through a paced script rather than one agent call per row. Notion → Geo publishing goes through geo-mirror Part 2 (dry run, then publish), while relation changes and new entities go through geo-publish. Agents find documents through the installable repository, the content-management entry points (CLAUDE.md, README.md, agents/AGENT-WORKFLOW.md) and load-on-demand routing by Load when, Documents, Skills, Parent and Depends on. File-sharing guidance keeps team-edited rules in Notion, publishes dated snapshots for download, keeps scripts in a versioned repo, and keeps private context and credentials out of exports. The cataloguing itself changed no workspace membership, published nothing to Geo and enabled no public sharing.

## Principles, rules and patterns

- **Directory first; open a component for detail** (top of page, Composition directory).
- **Catalog holds documents only, in five levels** (1 All agents, 2 All Geo agents, 3 Agent role, 4 Individual agent, Reference and setup) (MDs & documents).
- **No "current task" level; live tasks go to Project tracking** with Projects = Agent flows (MDs & documents; Working agreements 6).
- **STATUS.md continuity template is a reference template, not a task record** (MDs & documents).
- **Repository files stay in the repo**; catalog rows link to them, e.g. MD-FILES.md listing 63 Markdown files (MDs & documents).
- **Document origin and status labels** distinguish team guides, shared sources, drafts, proposals and research reports (MDs & documents).
- **Report-writing standard** governs written reports (MDs & documents).
- **Skills are catalogued by installed/proposed availability; SKILL.md hashes are verified across repos** (Skills).
- **Notion → Geo publisher lives inside geo-mirror Part 2, with no SKILL.md of its own** (Skills).
- **Three vendored general-purpose skills are not catalogued here** and carry their own PROVENANCE.md (Skills).
- **Workflows are Parent/Children/Depends on/Order step records; cleanup branches apply only to the requested operation** (AI workflows).
- **New reusable actions become new step records; executions go to the task tracker with evidence** (AI workflows).
- **Each agent verifies its own account and permissions; credentials stay outside the catalog** (Connectors & runtime).
- **Working agreement 1: search by stable Key before creating a duplicate** (Working agreements).
- **Working agreement 2: one authoritative editable source per component; link existing shared documents** (Working agreements).
- **Working agreement 3: label design requirements and implementation limits; Notion → Geo dry run before publish; Proposed… columns publish only rows approved in Publish status** (Working agreements).
- **Working agreement 4: update related steps when a document, skill or connector changes; keep authorization and approval requirements** (Working agreements).
- **Working agreement 5: compare baseline, current Notion and local revisions; record accepted revision, hash and verification** (Working agreements).
- **Working agreement 6: log the task first with Projects = Agent flows** (Working agreements).
- **Working agreement 7: bulk Notion writes via a paced script (bulk-set-property.mjs), not one agent call per row** (Working agreements).
- **Sharing: team rules in Notion, dated MD snapshots for download, scripts in a versioned repo; private context and credentials outside exports** (Sharing the Noesis folder).
- **Notion import is a one-off copy, not live sync with the local folder** (Sharing the Noesis folder).
- **Internet publication is a separate setting; cross-account access needs team confirmation** (Sharing the Noesis folder).
- **Agent entry points route to AGENT-WORKFLOW.md; installed agents route back to this catalog by database ID** (How an agent finds the right document).
- **Keep a small local entry point; load only relevant content via Load when, Documents, Skills, Parent and Depends on** (How an agent finds the right document).
- **Debate claim curation adds debate-value selection, broad-to-specific ordering, semantic novelty and feedback review** (Debate claim curation; a working procedure for a future skill).

## Child pages appended (under `## [Child page]` headings)

- 🧰 Agent skills outside the toolkit — what to install and how — `3df273e214eb81d7b977e677a0052fc1`
- 📋 Geo skills quick reference — `3df273e214eb81aaaffbf6ab71e35257`

## Linked databases appended (under `## [Linked database]` headings; schema and views only, no rows)

- Composition directory — `e3790ccb79b549eb96c2639c6ea12c45`
- MDs & documents — `28ae8943f8ab4e5d8e7fa6dc4d8e05d6`
- Skills — `149cd4c4e37f4ca690fe2f1cd38c40ed`
- AI workflows — `8ff88dbfc9464b67b9fa9508a442cf49`
- Connectors & runtime — `1e9b3838d87a40f385d20415a032263a`

## Referenced Notion pages not fetched

The page also cites about 16 other Notion pages in running text (for example Project tracking, Library map, Report-writing standard, the installable repository, master project documentation, and the publication contract). They were not fetched, because they are cross-references rather than embedded children of this page.
