Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3dc273e214eb814088b8de2e3184f988 as of 2026-10-02T13:21:30.559Z:
<page url="https://app.notion.com/p/3dc273e214eb814088b8de2e3184f988" icon="🧩">
<ancestor-path>
<parent-page url="https://app.notion.com/p/3da273e214eb80599115cdca4c631888" title="Agents flow center"/>
</ancestor-path>
<properties>
{"title":"Agent Composition"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"🧩"}</iconMetadata>
<content>
<callout icon="🧩" color="blue_bg">
	**One shared map of what composes a Geo agent:** its documents, skills, work procedures and connections. Start with the directory, then open a component to read its purpose, dependencies and detailed instructions.
</callout>
Built for step 1 of the [team sync](https://app.notion.com/p/3dc273e214eb804a9277ce5b8b4b3b9d). Initial catalog edition: **16 September 2026**.
<table_of_contents color="gray"/>
## Composition directory
<database url="https://app.notion.com/p/e3790ccb79b549eb96c2639c6ea12c45" inline="true" data-source-url="collection://7e0f5971-fcb2-4bc1-b20d-d132d56296cb">Composition directory</database>
## How the pieces connect
- **MDs & documents** define identity, context, rules and design contracts. Each row hosts a readable document or points to an existing shared source.
- **Skills** are reusable procedure packages. Their Documents and Connectors relations explain what they need.
- **AI workflows** describe what the agent does. Broad workflows have individual **Step** records with Parent, Children, Depends on, Order, inputs, outputs and completion checks.
- **Connectors & runtime** record how the agent reaches systems and what access or setup it needs.
**Example:** Geo → Notion mirroring uses geo-query and geo-mirror, the mirror contract, the Geo read client, Notion and a local runtime. Its eleven steps cover selection, retrieval, field mapping, conflict checks, rows, relations, views, fidelity, zero-change checking and baseline storage.
## MDs & documents
**51 records, recounted 29 September 2026.** Browse shared rules, Geo guidance, role guides, individual-agent templates, and reference/setup material by document level and role.
This catalog holds **documents only**, in five levels: 1 — All agents, 2 — All Geo agents, 3 — Agent role, 4 — Individual agent, and Reference and setup. There is no "current task" level: a live task is not a document, and belongs in [Project tracking](https://app.notion.com/p/3db273e214eb818c90ebe4d42baace74) with `Projects = Agent flows`. The `STATUS.md` continuity template stays here, under Reference and setup, because it is a template; the task it records does not.
**Repository files:** [MD-FILES.md](https://github.com/geo-explorers/content-management/blob/main/agents/MD-FILES.md) lists all 63 tracked Markdown files in content-management, what each contains, who reads it and when it loads. The files stay in the repo; catalog rows link to them.
Open a document to read its current edition. **Document origin** distinguishes team-written guides, links to existing sources, and drafts; **Document status** identifies working guides, templates, proposals, references, and research reports. The [Library map](https://app.notion.com/p/3dc273e214eb81d4a3e1d9aad99a874f) explains the hierarchy and labels dated downloads.
**Writing a report?** Start with the [Report-writing standard](https://app.notion.com/p/3dd273e214eb81d5aba6d4f27da8c9ba), including the [decision memo](https://app.notion.com/p/3dd273e214eb81d5aba6d4f27da8c9ba#d3a8e1aa1b824305b4f81133945e3c03), [priority rules](https://app.notion.com/p/3dd273e214eb81d5aba6d4f27da8c9ba#783acdfcef94475aafae9c8cd8442331), and editable decision examples.
<database url="https://app.notion.com/p/28ae8943f8ab4e5d8e7fa6dc4d8e05d6" inline="true" data-source-url="collection://c765fef1-2167-470d-840e-ff4da67d83d4">MDs & documents</database>
## Skills
**Install:** all fifteen, plus three vetted general-purpose skills, come with the installable repository — <mention-page url="https://app.notion.com/p/3e2273e214eb81aa8959e12f3196edb2"/> — one prompt to an agent sets everything up.
**Quick reference:** <mention-page url="https://app.notion.com/p/3df273e214eb81aaaffbf6ab71e35257">Geo skills quick reference</mention-page> — plain-language descriptions grouped by task. There are no slash commands: in a session, say the skill's name.
**18 records: 15 installed skills, the Notion → Geo publisher capability, and 2 proposed capabilities.** Installed means the source was found in this environment; it does not mean every execution path was retested. Coordination and file revision sync remain requirements, not skills. The Notion → Geo publisher is implemented inside geo-mirror Part 2, which is why it has no [SKILL.md](http://SKILL.md) of its own; only relation proposals and new entities still go through geo-publish.
**Verified 29 September 2026** against `geo-explorers/content-management` @ `main` and the vendored copy in `geo-explorers/geo-editor-agent`: all 15 [SKILL.md](http://SKILL.md) files are byte-identical across both repositories, and 14 of 15 recorded SHA-256 hashes still matched. Only geo-mirror had moved — now **v0.13.0**, which adds mirroring a single Geo page's collections into one Notion database per collection.
Not catalogued here: the three general-purpose skills the editor-agent build vendors in full — `notion-knowledge-capture`, `notion-research-documentation` and `karpathy-guidelines`. Each carries its own `PROVENANCE.md`; the installation guidance and the karpathy licence caveat are on [Agent skills outside the toolkit](https://app.notion.com/p/3df273e214eb81d7b977e677a0052fc1).
<database url="https://app.notion.com/p/149cd4c4e37f4ca690fe2f1cd38c40ed" inline="true" data-source-url="collection://2b45943c-152a-47a7-bf9d-212b951221b1">Skills</database>
## AI workflows
**15 workflows and 118 individually addressable steps.** Open Children to inspect details. Use the **All steps** tab for the full work-step catalog; Parent groups steps into their broader workflow and Depends on records prerequisites. Order gives the normal reading sequence. Conditional cleanup branches apply only to the requested operation.
This catalogs the defined reusable procedures found in the reviewed sources and the newly authored coordination/file-sharing procedures. It is not an exhaustive transcript of every historical tool call. New reusable actions should become new step records; executions belong in the existing task tracker with their own evidence.
<database url="https://app.notion.com/p/8ff88dbfc9464b67b9fa9508a442cf49" inline="true" data-source-url="collection://4b92adf1-a21a-4077-8072-e32398c77e20">AI workflows</database>
## Connectors & runtime
**8 records**, with availability and setup requirements. Each agent must verify its own account and permissions. Credentials are kept outside the catalog.
<database url="https://app.notion.com/p/1e9b3838d87a40f385d20415a032263a" inline="true" data-source-url="collection://8ba28b16-0d70-41a0-ad88-2a7add5250c8">Connectors & runtime</database>
## Sharing the Noesis folder
[Read the file-sharing and revision guide](https://app.notion.com/p/3dc273e214eb81ffb00ccd8c65ca4d8a).
The initial inventory found **9,911 files**, including **9,676 under work/** and **215 Markdown files overall**, after excluding dependency folders, Git internals and runtime caches. Most files support particular runs; the reusable agent composition is much smaller.
**Recommended arrangement:** team-edited rules and guides in Notion; dated MD snapshots for download; scripts, references and dependency files in a versioned team repository or controlled folder; selected task evidence linked from work records. Private context and credentials stay outside team exports.
Notion supports Markdown import and file attachments, including importing a folder ZIP. Imports do not create live synchronization with the local folder. [Notion import documentation](https://www.notion.com/help/import-data-into-notion).
This page is under **Agents flow center** for team collaboration. Internet publication is a separate sharing setting. The catalog has not changed workspace membership or enabled public-web sharing; cross-account access still needs confirmation from a team member. [Notion permissions](https://www.notion.com/help/sharing-and-permissions).
## How an agent finds the right document
**Installed agents:** the <mention-page url="https://app.notion.com/p/3e2273e214eb81aa8959e12f3196edb2"/> repository packages this catalog's team-written documents (`docs/`), the fifteen skills and the runtime into one clone. Its `AGENTS.md` is the entry point there, and it routes back to this catalog by database ID rather than by memory.
**Repo entry point:** in [content-management](https://github.com/geo-explorers/content-management), `CLAUDE.md` and `README.md` route every agent — any model, not only Claude — to [`agents/AGENT-WORKFLOW.md`](https://github.com/geo-explorers/content-management/blob/main/agents/AGENT-WORKFLOW.md): task lifecycle, Work tracker and QA tracker fields, hard rules and known traps.
Keep a small local entry point that routes to this catalog and the current task. Use **Load when**, **Documents**, **Skills**, **Parent** and **Depends on** to retrieve only relevant content. Local files do not all become active instructions just by existing. Codex discovers its configured instruction chain at startup; other project documents are read deliberately through these routes. [OpenAI instruction-loading guide](https://learn.chatgpt.com/docs/agent-configuration/agents-md).
## Working agreements for this catalog
1. Search by stable Key before creating a duplicate component.
2. Keep one authoritative editable source per component; link existing shared documents.
3. Label design requirements and implementation limits. **Notion → Geo works:** geo-mirror Part 2 compares edited text fields with Geo, shows a dry run, then publishes. Reviewed row changes can also go through **geo-publish**. Relation changes and new entities go through geo-publish. It works on any Notion table with a `Geo ID` column, whatever it's called: `plan-notion-changes.mjs` plans the changes, and tables with `Proposed …` columns publish only rows approved in `Publish status` (see the [publication contract](https://app.notion.com/p/3dc273e214eb818aacf3c92e1146bd1a)).
4. Update related steps when a document, skill or connector changes. Preserve task-specific authorization and approval requirements.
5. Compare baseline, current Notion and local revisions before distributing updates. Record accepted revision, hash and verification.
6. Keep run assignments and completion evidence in [Project tracking](https://app.notion.com/p/3db273e214eb818c90ebe4d42baace74): log the task first, with **Projects = Agent flows** (every view filters on it); use this catalog for reusable composition.
7. Write many Notion rows with a paced script (`bulk-set-property.mjs` in geo-mirror), not one agent call per row — about 5 minutes instead of 50.
## Sources and scope
Reused the [master project documentation](https://app.notion.com/p/3da273e214eb8186891df24275668b5d), [mirror readiness report](https://app.notion.com/p/3dc273e214eb815d80beff77dc34b85f), [work and communication guide](https://app.notion.com/p/3db273e214eb8107900efbf7304353ad), [transport design](https://app.notion.com/p/3db273e214eb81ab9646c09cb79b36cb) and [skill standard](https://app.notion.com/p/1c2273e214eb8364b14b813f3502a8f0), plus current local instruction routes and twelve installed Geo-related `SKILL.md` files. Older reports retain their dates; catalog procedures are an authored synthesis.
No local instruction files were moved or replaced, no Geo publication was performed and no background synchronization or coordination service was installed.
## Debate claim curation
For question-based claim collections, use <mention-page url="https://app.notion.com/p/3dd273e214eb818a9c06d4a766982463"/>. It adds debate-value selection, coherent broad-to-specific ordering, semantic novelty and feedback review to steps 5–7 of <mention-page url="https://app.notion.com/p/3dc273e214eb81a4b607c2bed2ce76e2"/>. This is a working procedure for a future skill.
Editor feedback and the applied example: <mention-page url="https://app.notion.com/p/3dd273e214eb81baa108d0c9e71dd6b4"/>.
<page url="https://app.notion.com/p/3df273e214eb81d7b977e677a0052fc1">Agent skills outside the toolkit — what to install and how</page>
<page url="https://app.notion.com/p/3df273e214eb81aaaffbf6ab71e35257">Geo skills quick reference</page>
</content>
</page>

## [Child page] 🧰 Agent skills outside the toolkit — what to install and how

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3df273e214eb81d7b977e677a0052fc1 as of 2026-09-21T10:50:23.600Z:
<page url="https://app.notion.com/p/3df273e214eb81d7b977e677a0052fc1" icon="🧰">
<ancestor-path>
<parent-page url="https://app.notion.com/p/3dc273e214eb814088b8de2e3184f988" title="Agent Composition"/>
<ancestor-2-page url="https://app.notion.com/p/3da273e214eb80599115cdca4c631888" title="Agents flow center"/>
</ancestor-path>
<properties>
{"title":"Agent skills outside the toolkit — what to install and how"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"🧰"}</iconMetadata>
<content>
Skills that do **not** ship with the content-management repo. The twelve Geo skills are catalogued in the Skills database on the parent page — these are the ones you add yourself.
Reviewed 18 September 2026.
> A skill is a set of instructions an agent will follow. Treat installing one like adding a dependency: read it first.
> **Installing through the repository?** <mention-page url="https://app.notion.com/p/3e2273e214eb81aa8959e12f3196edb2"/> already contains notion-knowledge-capture, notion-research-documentation and karpathy-guidelines, pinned and vetted — nothing to add. The steps below are for adding skills by hand elsewhere.
## Add these
<table header-row="true">
<tr>
<td>Skill</td>
<td>What it does</td>
<td>Source</td>
<td>Priority</td>
</tr>
<tr>
<td>notion-knowledge-capture</td>
<td>"Save this to Notion" → a structured page, linked from a hub so it stays findable</td>
<td>Notion, official</td>
<td>Start here</td>
</tr>
<tr>
<td>notion-research-documentation</td>
<td>"Research X in the workspace" → a report citing every point back to its source page</td>
<td>Notion, official</td>
<td>Start here</td>
</tr>
<tr>
<td>skill-creator</td>
<td>How to write a skill, plus a format checker</td>
<td>Anthropic</td>
<td>Recommended</td>
</tr>
<tr>
<td>pdf</td>
<td>Reads PDFs — press-review sources often arrive as one</td>
<td>Anthropic</td>
<td>Recommended</td>
</tr>
<tr>
<td>karpathy-guidelines</td>
<td>Four coding habits: surface assumptions before writing code, keep it minimal, change only what was asked, define a verifiable finish</td>
<td>Community — multica-ai</td>
<td>Recommended, with caveats</td>
</tr>
<tr>
<td>xlsx</td>
<td>Reads and writes spreadsheets</td>
<td>Anthropic</td>
<td>Optional</td>
</tr>
<tr>
<td>mcp-builder</td>
<td>Scaffolds your own connector</td>
<td>Anthropic</td>
<td>Optional</td>
</tr>
</table>
All of these are pure markdown — no executable code — and each is pinned to a fixed upstream version.
**On karpathy-guidelines.** The only community skill here, so it carries caveats the official ones do not:
- **No licence file in the repository.** The skill text and plugin manifest both claim MIT, but nothing in the repo backs that. Redistribution rights are unclear — treat as internal use until clarified.
- **Not written or endorsed by Andrej Karpathy.** It is a third party's packaging of his public observations.
- **Popularity is not validation.** The repo shows roughly 213,000 stars for nine files. That establishes attention, not safety. Our approval rests on reading every file, not on the count.
- **Partly redundant** with the built-in code-review and simplify skills. Its distinctive value is surfacing assumptions before coding and defining verifiable success criteria.
- Install the skill folder only. The upstream one-click route also installs a plugin wrapper and its own `CLAUDE.md`, which override project instructions.
## Avoid these
Already evaluated and rejected — no need to review them again.
<table header-row="true">
<tr>
<td>Skill</td>
<td>Reason</td>
</tr>
<tr>
<td>notion-cli</td>
<td>Install step downloads a script and runs it immediately. Also teaches the agent to hunt for API tokens in environment files — ours holds the Geo wallet key</td>
</tr>
<tr>
<td>notion-meeting-intelligence</td>
<td>Links an internal briefing into an externally shared agenda. Leak shape, and we do no meeting prep</td>
</tr>
<tr>
<td>hermes-agent Notion skill</td>
<td>Community-written. Same download-and-run install, plus tells you to disable OS password storage</td>
</tr>
<tr>
<td>notion-spec-to-implementation</td>
<td>Safe, but we do not turn specs into task lists</td>
</tr>
</table>
## Already yours
**Ships with the content-management repo** — no install needed:
- **notion-operations** — ground rules for scripted Notion work: which of the two logins to use, what to check before writing, how to write hundreds of rows safely
- **geo-mirror-and-group** — the full mirror-then-group pipeline in one request instead of eight; measures the space first and picks the settings
**Built into Claude Code** — nothing to fetch:
- **code-review** — bugs and cleanups in changed code
- **security-review** — security pass on pending changes
- **claude-api** — model names, pricing, API behaviour
- **dataviz** — charts and dashboards
## Setup
**Fastest route:** the installable repository — <mention-page url="https://app.notion.com/p/3e2273e214eb81aa8959e12f3196edb2"/> — sets up all the Geo skills and the three above with one prompt. By hand:
A skill is a folder containing a `SKILL.md` file. Installing one means putting that folder in the right place.
**1 — Choose the location**
<table header-row="true">
<tr>
<td>Location</td>
<td>Scope</td>
<td>Use for</td>
</tr>
<tr>
<td>Personal skills folder</td>
<td>Every project you open</td>
<td>The general-purpose skills above</td>
</tr>
<tr>
<td>Project skills folder</td>
<td>That repository only</td>
<td>Skills specific to one codebase</td>
</tr>
<tr>
<td>content-management repo</td>
<td>Everyone who clones it</td>
<td>Geo and Notion procedures</td>
</tr>
</table>
- **macOS / Linux** — `~/.claude/skills`
- **Windows** — your user folder → `.claude` → `skills`
**2 — Name the folder exactly after the skill**
The folder name must match the `name` written inside the skill file. Published skills frequently get this wrong — both Notion skills above needed renaming. A mismatch means the skill silently fails to load.
**3 — Copy the whole folder in**
Keep the `reference` and `examples` subfolders. They load only when needed, so they cost nothing.
**4 — Restart your session.** Skills load at startup.
**5 — Confirm** by asking the agent which skills it has.
## Check before installing
- **Is there a scripts folder?** If yes, read every script. If no, only the wording needs judging.
- **Does it download and execute anything?** Anything fetching a file and running it immediately is a no.
- **Does it look for tokens or passwords?** Especially anything reading environment files.
- **Does it delete, archive or overwrite?** Know what, before it runs.
- **Does it share outward?** Watch for private material linked into externally shared documents.
- **Record the source and version.** So the install can be reproduced or audited.
## Worth building next
<table header-row="true">
<tr>
<td>Idea</td>
<td>What it would do</td>
<td>Evidence</td>
</tr>
<tr>
<td>toolkit-doctor</td>
<td>Validate every skill file; check the Skills database matches disk</td>
<td>Three catalog mismatches found by hand this week</td>
</tr>
<tr>
<td>geo-space-profile</td>
<td>One call: a space's size, growth, signal coverage, known problems</td>
<td>Answered one query at a time over two days</td>
</tr>
<tr>
<td>notion-catalog-sync</td>
<td>Keep the Skills database in step with the repo</td>
<td>Three skills missing from the catalog; every row points at a non-existent folder</td>
</tr>
</table>
## Catalog corrections
Found while compiling this page. Two are wrong on the parent page or in the Skills database; the first row was my error and is kept as a retraction.
<table header-row="true">
<tr>
<td>Catalog says</td>
<td>Actually</td>
</tr>
<tr>
<td>The Notion-to-Geo publisher is planned by plan-notion-changes.mjs</td>
<td>CORRECT — this entry was wrongly flagged here on 18 September and has been retracted. The file was added to main by PR #45 on 16 September. It was missing only from a local clone that was two commits behind origin. Check claims like this against origin, not a working copy</td>
</tr>
<tr>
<td>Installed skills live under a .codex skills folder</td>
<td>That folder does not exist. They are in content-management, under skills/actionable and skills/non-actionable</td>
</tr>
<tr>
<td>Three skills are proposed, not built</td>
<td>Two are. The Notion-to-Geo publisher works — but our agent definition still tells agents never to plan as if it exists</td>
</tr>
</table>
</content>
</page>

## [Child page] 📋 Geo skills quick reference

Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3df273e214eb81aaaffbf6ab71e35257 as of 2026-10-02T13:21:30.559Z:
<page url="https://app.notion.com/p/3df273e214eb81aaaffbf6ab71e35257" icon="📋">
<ancestor-path>
<parent-page url="https://app.notion.com/p/3dc273e214eb814088b8de2e3184f988" title="Agent Composition"/>
<ancestor-2-page url="https://app.notion.com/p/3da273e214eb80599115cdca4c631888" title="Agents flow center"/>
</ancestor-path>
<properties>
{"title":"Geo skills quick reference"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"📋"}</iconMetadata>
<content>
<empty-block/>
<table_of_contents color="gray"/>
All fifteen below are installed by the repository build — <mention-page url="https://app.notion.com/p/3e2273e214eb81aa8959e12f3196edb2"/>. In a session, say the skill's name to run it.
## Find and understand Geo content
<table header-row="true">
<tr>
<td>Skill</td>
<td>What it does</td>
<td>Writes to Geo?</td>
<td>Relevant links</td>
</tr>
<tr>
<td>geo-query</td>
<td>Find records — people, projects, news stories, claims — in a chosen space and inspect their details and connections</td>
<td>No</td>
<td><mention-page url="https://app.notion.com/p/3dc273e214eb81af80c0fc2dbe738e94"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb8179952ce59235ca91b9"/></td>
</tr>
<tr>
<td>ontology-advisor</td>
<td>Explain how to organise information in Geo: which record types, fields and connections to use</td>
<td>No</td>
<td><mention-page url="https://app.notion.com/p/3dc273e214eb8103a0ece3c9ee3add83"/><br><mention-page url="https://app.notion.com/p/3df273e214eb81468cd4f69dff711a49"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb81f0beacfc8a8382ccf7"/></td>
</tr>
<tr>
<td>geo-press-review</td>
<td>Compare web news coverage against stories already in Geo and recommend what is missing</td>
<td>No</td>
<td><mention-page url="https://app.notion.com/p/3db273e214eb808caa91fd674145d546"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb81f1aefdd6b86fc75d4f"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb81e7b57dcd723cc0cf64"/></td>
</tr>
<tr>
<td>geo-discovery</td>
<td>Inspect a space for missing, outdated, thin or poorly connected content and rank the findings</td>
<td>No</td>
<td><mention-page url="https://app.notion.com/p/3dc273e214eb8181bb03d5c481b5595c"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb81f1aefdd6b86fc75d4f"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb812db979db29f9518d17"/></td>
</tr>
</table>
## Write and organize content
<table header-row="true">
<tr>
<td>Skill</td>
<td>What it does</td>
<td>Writes to Geo?</td>
<td>Relevant links</td>
</tr>
<tr>
<td>geo-describe</td>
<td>Research source material and draft original, factual, cited descriptions for review</td>
<td>No</td>
<td><mention-page url="https://app.notion.com/p/3dc273e214eb81f1aefdd6b86fc75d4f"/><br><mention-page url="https://app.notion.com/p/3db273e214eb808caa91fd674145d546"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb8121a945d0a89ba366e5"/></td>
</tr>
<tr>
<td>geo-claim-grouping</td>
<td>Compare claims to find duplicates, near-duplicates, and supporting or opposing arguments, then prepare the connections</td>
<td>Yes, at the publish stage</td>
<td><mention-page url="https://app.notion.com/p/3dc273e214eb81748483f00d3273d938"/><br><mention-page url="https://app.notion.com/p/3dd273e214eb8075b06ddc3e0cf2111a"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb81cd9bcbde95021b9bc7"/></td>
</tr>
<tr>
<td>image-banner-recompose</td>
<td>Recompose an uploaded image into a 2364 × 640 banner</td>
<td>No</td>
<td><mention-page url="https://app.notion.com/p/3dc273e214eb812890d2d5962c4f9782"/></td>
</tr>
</table>
## Edit and publish in Geo
<table header-row="true">
<tr>
<td>Skill</td>
<td>What it does</td>
<td>Writes to Geo?</td>
<td>Relevant links</td>
</tr>
<tr>
<td>geo-orchestrate</td>
<td>Turn a plain-language request into a plan, preview the affected records, and route approved changes to the right skill</td>
<td>Yes, via the skills it routes to</td>
<td><mention-page url="https://app.notion.com/p/3db273e214eb818c90ebe4d42baace74"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb81709975f60e77110a7d"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb815a839ee34bd12a4d23"/></td>
</tr>
<tr>
<td>geo-publish</td>
<td>Create or update records and connections, after type, duplicate and schema checks plus a dry run</td>
<td>Yes</td>
<td><mention-page url="https://app.notion.com/p/3dc273e214eb818aacf3c92e1146bd1a"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb8103a0ece3c9ee3add83"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb819bba20d47aada62780"/></td>
</tr>
<tr>
<td>geo-clean</td>
<td>Find duplicates, orphans, invalid values and broken connections, then preview and apply approved repairs, merges, moves or deletions</td>
<td>Yes — and the only skill that deletes</td>
<td><mention-page url="https://app.notion.com/p/3dc273e214eb8103a0ece3c9ee3add83"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb81709975f60e77110a7d"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb81a39dc9da3c3e702168"/></td>
</tr>
</table>
## Work with Notion
<table header-row="true">
<tr>
<td>Skill</td>
<td>What it does</td>
<td>Writes to Geo?</td>
<td>Relevant links</td>
</tr>
<tr>
<td>geo-mirror</td>
<td>Copy Geo records into linked Notion databases, refresh them, and send reviewed text edits back to Geo after a preview</td>
<td>Yes, on the way back only</td>
<td><mention-page url="https://app.notion.com/p/3dc273e214eb8001b78ae2fe1d46bc84"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb813aa69dfd74ac07fd27"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb818aacf3c92e1146bd1a"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb81e0bad3e83aa719e6b6"/></td>
</tr>
<tr>
<td>geo-mirror-and-group</td>
<td>Do the whole job in one request: mirror a scoped set of claims into Notion, then group them for review — instead of running the eight steps yourself</td>
<td>No</td>
<td><mention-page url="https://app.notion.com/p/3dc273e214eb813aa69dfd74ac07fd27"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb81748483f00d3273d938"/><br><mention-page url="https://app.notion.com/p/3df273e214eb81629b5fc4258bd74d40"/></td>
</tr>
<tr>
<td>geo-claim-grouping-notion</td>
<td>Write claim-grouping results into a Notion mirror as review columns instead of Geo proposals, for an editor to approve</td>
<td>No</td>
<td><mention-page url="https://app.notion.com/p/3dc273e214eb8001b78ae2fe1d46bc84"/><br><mention-page url="https://app.notion.com/p/3dd273e214eb8075b06ddc3e0cf2111a"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb81748483f00d3273d938"/><br><mention-page url="https://app.notion.com/p/3df273e214eb81d491b1dc1fbc652abb"/></td>
</tr>
<tr>
<td>notion-operations</td>
<td>The ground rules for any scripted Notion work: which of the two logins to use, what to check before writing, how to write hundreds of rows without losing any</td>
<td>No</td>
<td><mention-page url="https://app.notion.com/p/3dc273e214eb810bbfb2f9a473161adc"/><br><mention-page url="https://app.notion.com/p/3e2273e214eb81aa8959e12f3196edb2"/><br><mention-page url="https://app.notion.com/p/3df273e214eb81c99ed4defdd65c698f"/></td>
</tr>
<tr>
<td>daily-report</td>
<td>Summarise your day's work and file a daily update to Notion under your own identity, after you approve the draft</td>
<td>No</td>
<td><mention-page url="https://app.notion.com/p/25e273e214eb80f5a810c1b506041000"/><br><mention-page url="https://app.notion.com/p/257273e214eb80b0bf3debc675d7ddad"/><br><mention-page url="https://app.notion.com/p/3dc273e214eb816f8ed5e83de50a5b26"/></td>
</tr>
</table>
<empty-block/>
<empty-block/>
<empty-block/>
</content>
</page>

## [Linked database] Composition directory

Note: the fetch returned the database schema only (no row content).

Here is the result of "fetch" for the database URL https://app.notion.com/p/e3790ccb79b549eb96c2639c6ea12c45 (metadata: type data_source):

<data-source url="{{collection://7e0f5971-fcb2-4bc1-b20d-d132d56296cb}}">
The title of this Data Source is: Composition directory

Here is the database's configurable state:
Properties with `readOnly: true` are synced or system-managed. Do not try to update their values with page update tools.
<data-source-state>
{"name":"Composition directory","schema":{"Catalog":{"description":"","name":"Catalog","type":"url"},"Name":{"description":"","name":"Name","type":"title"},"Order":{"description":"","name":"Order","type":"number"},"Purpose":{"description":"","name":"Purpose","type":"text"},"Status":{"description":"","name":"Status","options":[{"color":"green","description":"","name":"Populated","url":"collectionPropertyOption://7e0f5971-fcb2-4bc1-b20d-d132d56296cb/dFR4Pw/ZTQyYWQ5MGEtZDZiOC00NWQyLTkyMmUtY2ZhNGJiYTkzMzM2"}],"type":"select"}},"url":"collection://7e0f5971-fcb2-4bc1-b20d-d132d56296cb"}
</data-source-state>

Here is the SQLite table definition for this data source.
<sqlite-table>
CREATE TABLE IF NOT EXISTS "collection://7e0f5971-fcb2-4bc1-b20d-d132d56296cb" (
	url TEXT UNIQUE,
	createdTime TEXT, -- ISO-8601 datetime string, automatically set. This is the canonical time for when the page was created.
	"Order" FLOAT,
	"Catalog" TEXT,
	"Status" TEXT, -- one of ["Populated"]
	"Purpose" TEXT,
	"Name" TEXT
)
</sqlite-table>
</data-source>

## [Linked database] MDs & documents

Note: the fetch returned the database schema and views only (no row content).

<database url="{{https://app.notion.com/p/28ae8943f8ab4e5d8e7fa6dc4d8e05d6}}" inline="true">
The title of this Database is: MDs & documents
<ancestor-path>
<parent-page url="https://app.notion.com/p/3dc273e214eb814088b8de2e3184f988" title="Agent Composition"/>
<ancestor-2-page url="https://app.notion.com/p/3da273e214eb80599115cdca4c631888" title="Agents flow center"/>
</ancestor-path>
Here are the Database's Data Sources:
You can use the "fetch" tool on the URL of any Data Source to see its full schema configuration.
<data-sources>
<data-source url="{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}">
The title of this Data Source is: MDs & documents

Here is the database's configurable state:
Properties with `readOnly: true` are synced or system-managed. Do not try to update their values with page update tools.
<data-source-state>
{"name":"MDs & documents","schema":{"Document form":{"description":"","name":"Document form","options":[{"color":"blue","description":"","name":"Instruction file","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/TG97cw/N2FlZjFkN2ItOGEwNi00YWE2LWEzNTEtNTYwM2FkNGZlMTkx"},{"color":"purple","description":"","name":"Skill entry file","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/TG97cw/MmEwMGNhNzUtNDIxMS00MDJlLTg1NmQtY2ZkYTI5N2FlZjU1"},{"color":"green","description":"","name":"README","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/TG97cw/ZmM5YTg5MGMtZjU2Mi00N2E0LWIzYzEtZjgyZTUyZjU1MjVi"},{"color":"yellow","description":"","name":"Instruction section","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/TG97cw/MmU2NWIzZTYtNDdmNy00NjcwLWIwNDQtNzZlY2FiYjgyMWYz"},{"color":"orange","description":"","name":"README section","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/TG97cw/ZTU1YjIxMjItNjc1Yy00NDJhLTkzZjctMTlmMDhjYzc1NTk2"},{"color":"brown","description":"","name":"Project-specific guide","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/TG97cw/OTNmY2NhMDktNjUyYS00NjQ3LTliMTItNDFhYTliNDE1MTQx"},{"color":"gray","description":"","name":"Reference page","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/TG97cw/NjExODc1YWEtOWYxZC00NjA3LWJiOTUtNGU2NjUzN2I3MDMw"}],"type":"select"},"Document level":{"description":"","name":"Document level","options":[{"color":"blue","description":"","name":"1 — All agents","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/RV5rbw/MzVjYWNkNzAtMGUwNi00MTYwLThkYjktY2MxNDYyY2E1Y2Ey"},{"color":"green","description":"","name":"2 — All Geo agents","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/RV5rbw/OWRjYTgzOTYtYjhiNC00YWY2LWI5MDQtMDNjYWUyNWFiNDg1"},{"color":"purple","description":"","name":"3 — Agent role","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/RV5rbw/M2ZhMDViYzgtMmQ4Zi00MWE2LThjY2UtNWVjNzVhZDJiMmM5"},{"color":"orange","description":"","name":"4 — Individual agent","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/RV5rbw/NDJkNGZmMDEtZjY0NS00N2UwLWIwNDAtY2MzYTNhYjk2ZTlh"},{"color":"gray","description":"","name":"Reference and setup","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/RV5rbw/OWYxYTk0ODktYzNkMS00YjBlLWJjZjctYjJiY2IyZGVmMTNj"}],"type":"select"},"Document origin":{"description":"","name":"Document origin","options":[{"color":"default","description":"","name":"Team-written guide","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/P19SdA/MTFjOTAwMDUtYWU0ZS00MTY4LWJmNWYtZWI3ODhjMDY1MmY0"},{"color":"default","description":"","name":"Link to existing source","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/P19SdA/OGU0YmU2MWEtMDJjMS00ZGM0LTg1ODYtOGI1ZDQxZmNhZmFj"},{"color":"default","description":"","name":"Draft document","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/P19SdA/ZmU2ODc0NTctMWY4Yy00OTU3LTllZmUtMzIyZDk1NGU3OGEz"}],"type":"select"},"Document status":{"description":"","name":"Document status","options":[{"color":"green","description":"","name":"Working guide","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/a3tRVA/NGY2MjJlZmUtNThjYi00OWJkLWFjZTgtZmUxODg2MWNkZGY3"},{"color":"blue","description":"","name":"Template to fill in","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/a3tRVA/YjE4ZmQ2ODktYjVjOC00NjBhLTg5ZGMtZjQ3MmRlZDRmMDk3"},{"color":"yellow","description":"","name":"Proposal to review","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/a3tRVA/NjM0ZGYwNWUtOTczMS00N2NjLTgwN2YtZWMxZTA3ZDk5N2Mz"},{"color":"gray","description":"","name":"Reference only","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/a3tRVA/YTQ1MzE0MzUtNWVkZi00YzNjLWEwNzktOTM5MTJlNjU0Nzdk"},{"color":"purple","description":"","name":"Research report","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/a3tRVA/MTcxMjVmMGItYjU4ZC00NWMxLWJlMTgtMGZmNDc3NDFmYzA2"}],"type":"select"},"Document type":{"description":"","name":"Document type","options":[{"color":"blue","description":"","name":"Core instruction","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/akVIeQ/NTc2ZmE1NmItNzNhZi00NTI2LThhMDctMTJlYWI5N2M0ZmQ4"},{"color":"green","description":"","name":"Guide","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/akVIeQ/ZWM0NjJjNmUtMWI3OC00N2Q2LWIxMjItMzgwOGE2MWM5MWFi"},{"color":"gray","description":"","name":"Reference","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/akVIeQ/MTI2MzliOGMtZGE3Yy00ODliLWJlOTctYThmMWNjYjYwMTFh"},{"color":"purple","description":"","name":"Design","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/akVIeQ/Mzg1ODBkMTQtNGMyNS00MjdhLWFkYzMtYWYxZWMwOTA3MzJm"}],"type":"select"},"Documents below":{"dataSourceUrl":"collection://c765fef1-2167-470d-840e-ff4da67d83d4","description":"","name":"Documents below","type":"relation"},"Filename":{"description":"","name":"Filename","type":"text"},"Filename basis":{"description":"","name":"Filename basis","options":[{"color":"blue","description":"","name":"Platform-recognized filename","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/e3JPbQ/ODAwOWM1YjAtYzA4MS00ZDg3LTgyNDktNjQ4MzNmOGM5MDMx"},{"color":"gray","description":"","name":"Reference page","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/e3JPbQ/MmQzMGJkZmYtZWEzOC00M2FjLThhOTgtZmM4YjVmZGMzODYw"},{"color":"default","description":"","name":"Established README convention","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/e3JPbQ/MGEyYjg4MzktNDRmYS00OTdjLWFmNTUtYzlhMzk5NTljMzFi"},{"color":"default","description":"","name":"Section of an established document","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/e3JPbQ/NTU2YzA4MTQtZDg0Zi00M2I1LTlhMWUtYzI0Mjc5YTZlZDFk"},{"color":"default","description":"","name":"Project-specific filename","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/e3JPbQ/N2IxZmEyN2ItYmIyNS00YjczLTk4NjYtY2NjZTFmOTM2N2Zj"}],"type":"select"},"Files":{"description":"","name":"Files","type":"file"},"Key":{"description":"","name":"Key","type":"text"},"Maintained by":{"description":"","name":"Maintained by","type":"text"},"Name":{"description":"","name":"Name","type":"title"},"Naming reason and source":{"description":"","name":"Naming reason and source","type":"text"},"Parent document":{"dataSourceUrl":"collection://c765fef1-2167-470d-840e-ff4da67d83d4","description":"","name":"Parent document","propertyUrl":"collectionProperty://c765fef1-2167-470d-840e-ff4da67d83d4/cDtWVw","type":"relation"},"Reading instructions":{"description":"","name":"Reading instructions","type":"text"},"Reviewed on":{"description":"","name":"Reviewed on","querySqlColumns":{"columns":[{"name":"date:Reviewed on:start","sqlType":"TEXT"},{"name":"date:Reviewed on:end","sqlType":"TEXT"},{"name":"date:Reviewed on:is_datetime","sqlType":"INTEGER"}],"usage":"For connections.notion.querySql. Main schema name not queryable."},"type":"date"},"Skills":{"dataSourceUrl":"collection://2b45943c-152a-47a7-bf9d-212b951221b1","description":"","name":"Skills","propertyUrl":"collectionProperty://2b45943c-152a-47a7-bf9d-212b951221b1/b01zYQ","type":"relation"},"Source hash":{"description":"","name":"Source hash","type":"text"},"Source link":{"description":"","name":"Source link","type":"url"},"Source path":{"description":"","name":"Source path","type":"text"},"Sources and review notes":{"description":"","name":"Sources and review notes","type":"text"},"Suggested file location":{"description":"","name":"Suggested file location","type":"text"},"Summary":{"description":"","name":"Summary","type":"text"},"Tags":{"description":"","name":"Tags","options":[{"color":"blue","description":"","name":"Context","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/WHNZUw/Njk5ZWMxYTAtZWE1Mi00NWZjLTllMWEtNjJjNDg1MjNhMjk2"},{"color":"purple","description":"","name":"Retrieval","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/WHNZUw/NGQ1OThkNzMtMjRjMi00NGU2LTg3ZTEtM2I4NzU5YjVlNGNj"},{"color":"green","description":"","name":"Mirroring","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/WHNZUw/ZThjNTgxNDYtNWY4YS00NmUxLTkzNzEtNTEwZDQxMTA2OWU1"},{"color":"orange","description":"","name":"Publishing","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/WHNZUw/ODA0YzcwMjItYWVkNS00MTBmLWEzZTktZGU3OWFiNzA3MzAz"},{"color":"pink","description":"","name":"Semantics","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/WHNZUw/ZWM1YWE5YTgtZDc3My00OTBlLTgxNTAtMTBhMzcwODc1YTBk"},{"color":"red","description":"","name":"Quality","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/WHNZUw/YzZhZDE3YTItMGY3Yi00ZTlkLTk5YTAtMDU0YzJmN2E3NTBh"},{"color":"yellow","description":"","name":"Coordination","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/WHNZUw/OTZjNjJiNzgtZGQ1MC00YWE1LTg2NjUtZjlkMWVhZTYwZTFj"},{"color":"brown","description":"","name":"Maintenance","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/WHNZUw/ZTlhMjhkNGEtYzFmYS00MGRhLWI4YzItNTAwYWU5NDhkMmJm"},{"color":"default","description":"","name":"Project-specific","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/WHNZUw/MDFmMDJmMTMtMzhhNC00MzZkLWI1NjEtNDIwN2Y0YjM3NWFj"}],"type":"multi_select"},"Used by":{"description":"","name":"Used by","options":[{"color":"default","description":"","name":"Every Geo agent","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/VlhUfg/YzgzZDE0YjctN2M1ZC00OGMxLTliN2MtYzc4YzliMWE3ODYw"},{"color":"default","description":"","name":"Content agents","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/VlhUfg/ZmY2Y2IyY2ItNjdmNC00YjhlLTgyMGMtNDc5MWYyMmQ1YmY3"},{"color":"default","description":"","name":"Data and schema agents","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/VlhUfg/YmRkNzkzMjctMjY2Ny00NDJiLTk0ZWEtMjI3NTU2NDJjOGMx"},{"color":"default","description":"","name":"Project management agents","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/VlhUfg/Y2Y2ZGE1OTItYjljZC00N2YxLThlMjctZjgwYTJhMGJiYTU4"},{"color":"default","description":"","name":"Quality review agents","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/VlhUfg/ZDBhMjVhNmQtOTYwMy00ZmY5LTk5ZmMtNTcwNmRlNTY3YzFl"},{"color":"default","description":"","name":"Library maintainers","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/VlhUfg/ZmI4Y2ZmNjUtY2MyZC00NDg4LWEwMWQtYTdkY2JlZmVmNmUx"}],"type":"multi_select"},"What belongs in it":{"description":"","name":"What belongs in it","type":"text"},"What changes between agents?":{"description":"","name":"What changes between agents?","options":[{"color":"default","description":"","name":"Same for everyone who uses it","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/X1lcZQ/ODk5ZjBiZGMtZGI0Zi00NWJjLWI3OTgtNzM0NTEzMzhlNTk3"},{"color":"default","description":"","name":"Fill in for each agent","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/X1lcZQ/N2NmN2VlMTUtZjk3Yi00NTdiLWFlNzUtZWE1NTNjMzdmOTAy"},{"color":"default","description":"","name":"Fill in for each task","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/X1lcZQ/ZTY2MDk1YzMtYjFiNC00MjkyLTk0MzctNmZlYTQxNjM3MzU5"},{"color":"default","description":"","name":"Choose for the platform","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/X1lcZQ/YjI0MmJiYmEtZjYzMS00MzFhLThhMjYtMTI0ODdhZGE1MmRl"},{"color":"default","description":"","name":"Not distributed to agents","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/X1lcZQ/ZDM4N2FiYzgtZjZhZC00ZGVhLWEwMGYtMjUyYmNjMjQ3Y2Y5"}],"type":"select"},"What this document is":{"description":"","name":"What this document is","type":"text"},"When to read":{"description":"","name":"When to read","options":[{"color":"default","description":"","name":"At startup","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/eF1zTg/YjMyZDllYWYtYmM1MS00NTY1LTgyYTktMzNmYTU1YzdjNzlm"},{"color":"default","description":"","name":"When resuming work","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/eF1zTg/ZGZjNjEwMjctZWMxZS00YjMyLTlhOGEtYzg1Njk1Mzc3NjIz"},{"color":"default","description":"","name":"For a matching task","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/eF1zTg/ZDNmOWQwZjEtMTQ3Zi00MzhlLWFmYmItNDE3ZjNiYjc3YzFh"},{"color":"default","description":"","name":"During setup","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/eF1zTg/NjVlODRjZTQtMGNlNi00ZTBhLWFjMjEtNmY2NWY4YmMxYTA1"},{"color":"default","description":"","name":"When looking up background","url":"collectionPropertyOption://c765fef1-2167-470d-840e-ff4da67d83d4/eF1zTg/MDkzYzgwODQtZWFmYy00ODhiLWI0ZTAtMzI0NjYzNzE2NGU5"}],"type":"select"},"Why this file exists":{"description":"","name":"Why this file exists","type":"text"},"Workflows":{"dataSourceUrl":"collection://4b92adf1-a21a-4077-8072-e32398c77e20","description":"","name":"Workflows","propertyUrl":"collectionProperty://4b92adf1-a21a-4077-8072-e32398c77e20/Xlh3RA","type":"relation"}},"url":"collection://c765fef1-2167-470d-840e-ff4da67d83d4"}
</data-source-state>

Here is the SQLite table definition for this data source.
<sqlite-table>
CREATE TABLE IF NOT EXISTS "collection://c765fef1-2167-470d-840e-ff4da67d83d4" (
	url TEXT UNIQUE,
	createdTime TEXT, -- ISO-8601 datetime string, automatically set. This is the canonical time for when the page was created.
	"Document origin" TEXT, -- one of ["Team-written guide", "Link to existing source", "Draft document"]
	"Naming reason and source" TEXT,
	"Reading instructions" TEXT,
	"Document level" TEXT, -- one of ["1 — All agents", "2 — All Geo agents", "3 — Agent role", "4 — Individual agent", "Reference and setup"]
	"Source path" TEXT,
	"Skills" TEXT, -- JSON array of page URLs relating to {{collection://2b45943c-152a-47a7-bf9d-212b951221b1}} data source, you must "view" {{collection://2b45943c-152a-47a7-bf9d-212b951221b1}} to query this column
	"Document form" TEXT, -- one of ["Instruction file", "Skill entry file", "README", "Instruction section", "README section", "Project-specific guide", "Reference page"]
	"Summary" TEXT,
	"Key" TEXT,
	"Used by" TEXT, -- JSON array with zero or more of ["Every Geo agent", "Content agents", "Data and schema agents", "Project management agents", "Quality review agents", "Library maintainers"]
	"Why this file exists" TEXT,
	"Tags" TEXT, -- JSON array with zero or more of ["Context", "Retrieval", "Mirroring", "Publishing", "Semantics", "Quality", "Coordination", "Maintenance", "Project-specific"]
	"Maintained by" TEXT,
	"Files" TEXT, -- JSON array of zero or more file IDs, Notion Folder URLs, or <folder> tags copied from fetch output. Folders are stored as native Folder references.
	"What changes between agents?" TEXT, -- one of ["Same for everyone who uses it", "Fill in for each agent", "Fill in for each task", "Choose for the platform", "Not distributed to agents"]
	"Document type" TEXT, -- one of ["Core instruction", "Guide", "Reference", "Design"]
	"Document status" TEXT, -- one of ["Working guide", "Template to fill in", "Proposal to review", "Reference only", "Research report"]
	"Documents below" TEXT, -- JSON array of page URLs relating to {{collection://c765fef1-2167-470d-840e-ff4da67d83d4}} data source, you must "view" {{collection://c765fef1-2167-470d-840e-ff4da67d83d4}} to query this column
	"Filename" TEXT,
	"What this document is" TEXT,
	"Sources and review notes" TEXT,
	"Suggested file location" TEXT,
	"date:Reviewed on:start" TEXT, -- ISO-8601 date or datetime string. Use the expanded property (date:<column_name>:start) to set this value.
	"date:Reviewed on:end" TEXT, -- ISO-8601 date or datetime string, can be empty. Must be NULL if the date is a single date, and must be present if the date is a range. Use the expanded property (date:<column_name>:end) to set this value.
	"date:Reviewed on:is_datetime" INTEGER, -- 1 if the date is a datetime, 0 if it is a date, NULL defaults to 0. Use the expanded property (date:<column_name>:is_datetime) to set this value.
	"Workflows" TEXT, -- JSON array of page URLs relating to {{collection://4b92adf1-a21a-4077-8072-e32398c77e20}} data source, you must "view" {{collection://4b92adf1-a21a-4077-8072-e32398c77e20}} to query this column
	"What belongs in it" TEXT,
	"Source hash" TEXT,
	"Source link" TEXT,
	"Parent document" TEXT, -- JSON array of page URLs relating to {{collection://c765fef1-2167-470d-840e-ff4da67d83d4}} data source, you must "view" {{collection://c765fef1-2167-470d-840e-ff4da67d83d4}} to query this column
	"When to read" TEXT, -- one of ["At startup", "When resuming work", "For a matching task", "During setup", "When looking up background"]
	"Filename basis" TEXT, -- one of ["Platform-recognized filename", "Reference page", "Established README convention", "Section of an established document", "Project-specific filename"]
	"Name" TEXT
)
</sqlite-table>
</data-source>
</data-sources>
Here are the Database's Views:
You can use the "fetch" tool on the URL of any View to see its full configuration.
<views>
<view url="{{view://c4259182-8c9f-4148-a07c-dde0eec17d5d}}">
{"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","Filename","Document form","Used by","What changes between agents?"],"groupBy":{"hideEmptyGroups":true,"property":"Document level","propertyType":"select","sort":{"type":"manual"}},"name":"1. Document hierarchy","sorts":[{"direction":"ascending","property":"Document level"},{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-813c-b503-000ccaa872cb}}">
{"advancedFilter":{"filters":[{"operator":"enum_contains","property":"Used by","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Every Geo agent"}}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","Parent document","Used by","What changes between agents?","Document status"],"groupBy":{"hideEmptyGroups":true,"property":"Document level","propertyType":"select","sort":{"type":"manual"}},"name":"2. Every agent — common documents","sorts":[{"direction":"ascending","property":"Document level"},{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-811a-b50f-000cf0214766}}">
{"advancedFilter":{"filters":[{"operator":"enum_is","property":"What changes between agents?","propertyType":"select","type":"property","value":{"type":"exact","value":"Choose for the platform"}}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","Parent document","Used by","What changes between agents?","Document status"],"groupBy":{"hideEmptyGroups":true,"property":"Document level","propertyType":"select","sort":{"type":"manual"}},"name":"Platform setup","sorts":[{"direction":"ascending","property":"Document level"},{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-8138-8920-000cf3439c43}}">
{"advancedFilter":{"filters":[{"filters":[{"filters":[{"operator":"enum_contains","property":"Used by","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Every Geo agent"}}],"operator":"and","type":"group"},{"filters":[{"operator":"enum_contains","property":"Used by","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Content agents"}}],"operator":"and","type":"group"}],"operator":"or","type":"group"},{"filters":[{"operator":"enum_is_not","property":"Document level","propertyType":"select","type":"property","value":{"type":"exact","value":"Reference and setup"}}],"operator":"and","type":"group"}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","Used by","What changes between agents?","Document status","Reading instructions"],"groupBy":{"hideEmptyGroups":true,"property":"Document level","propertyType":"select","sort":{"type":"manual"}},"name":"3. Content agents","sorts":[{"direction":"ascending","property":"Document level"},{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-8104-9bcd-000cfe588459}}">
{"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","Document level","Used by","What changes between agents?","Document status","Document origin","When to read","Reading instructions","Parent document","Documents below","Suggested file location","Maintained by","Reviewed on","Sources and review notes","Source link","Source path","Files","Skills","Workflows","Key"],"groupBy":{"hideEmptyGroups":true,"property":"Document level","propertyType":"select","sort":{"type":"manual"}},"name":"Library maintenance","sorts":[{"direction":"ascending","property":"Document level"},{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-81a6-960c-000c3b5f3607}}">
{"advancedFilter":{"filters":[{"filters":[{"filters":[{"operator":"enum_contains","property":"Used by","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Every Geo agent"}}],"operator":"and","type":"group"},{"filters":[{"operator":"enum_contains","property":"Used by","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Data and schema agents"}}],"operator":"and","type":"group"}],"operator":"or","type":"group"},{"filters":[{"operator":"enum_is_not","property":"Document level","propertyType":"select","type":"property","value":{"type":"exact","value":"Reference and setup"}}],"operator":"and","type":"group"}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","Used by","What changes between agents?","Document status","Reading instructions"],"groupBy":{"hideEmptyGroups":true,"property":"Document level","propertyType":"select","sort":{"type":"manual"}},"name":"4. Data and schema agents","sorts":[{"direction":"ascending","property":"Document level"},{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-81dc-954b-000c045448b1}}">
{"advancedFilter":{"filters":[{"filters":[{"filters":[{"operator":"enum_contains","property":"Used by","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Every Geo agent"}}],"operator":"and","type":"group"},{"filters":[{"operator":"enum_contains","property":"Used by","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Project management agents"}}],"operator":"and","type":"group"}],"operator":"or","type":"group"},{"filters":[{"operator":"enum_is_not","property":"Document level","propertyType":"select","type":"property","value":{"type":"exact","value":"Reference and setup"}}],"operator":"and","type":"group"}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","Used by","What changes between agents?","Document status","Reading instructions"],"groupBy":{"hideEmptyGroups":true,"property":"Document level","propertyType":"select","sort":{"type":"manual"}},"name":"5. Project management agents","sorts":[{"direction":"ascending","property":"Document level"},{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-810f-9108-000c3c6cabdc}}">
{"advancedFilter":{"filters":[{"filters":[{"filters":[{"operator":"enum_contains","property":"Used by","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Every Geo agent"}}],"operator":"and","type":"group"},{"filters":[{"operator":"enum_contains","property":"Used by","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Quality review agents"}}],"operator":"and","type":"group"}],"operator":"or","type":"group"},{"filters":[{"operator":"enum_is_not","property":"Document level","propertyType":"select","type":"property","value":{"type":"exact","value":"Reference and setup"}}],"operator":"and","type":"group"}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","Used by","What changes between agents?","Document status","Reading instructions"],"groupBy":{"hideEmptyGroups":true,"property":"Document level","propertyType":"select","sort":{"type":"manual"}},"name":"6. Quality review agents","sorts":[{"direction":"ascending","property":"Document level"},{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-81aa-8722-000c98d8798d}}">
{"advancedFilter":{"filters":[{"operator":"enum_is","property":"What changes between agents?","propertyType":"select","type":"property","value":{"type":"exact","value":"Fill in for each agent"}}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","Used by","What changes between agents?","Document status","Reading instructions"],"groupBy":{"hideEmptyGroups":true,"property":"Document level","propertyType":"select","sort":{"type":"manual"}},"name":"Customize for each agent","sorts":[{"direction":"ascending","property":"Document level"},{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-81cc-9649-000c66acb668}}">
{"advancedFilter":{"filters":[{"operator":"enum_is","property":"What changes between agents?","propertyType":"select","type":"property","value":{"type":"exact","value":"Same for everyone who uses it"}}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","Used by","What changes between agents?","Document status","Reading instructions"],"groupBy":{"hideEmptyGroups":true,"property":"Document level","propertyType":"select","sort":{"type":"manual"}},"name":"Shared without changes","sorts":[{"direction":"ascending","property":"Document level"},{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-819a-84b3-000cbf2f0e6d}}">
{"advancedFilter":{"filters":[{"operator":"enum_is","property":"Document level","propertyType":"select","type":"property","value":{"type":"exact","value":"Reference and setup"}}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","Used by","What changes between agents?","Document status","Reading instructions"],"groupBy":{"hideEmptyGroups":true,"property":"Document level","propertyType":"select","sort":{"type":"manual"}},"name":"References and setup","sorts":[{"direction":"ascending","property":"Document level"},{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-81bf-8d89-000c9d5b598a}}">
{"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","What this document is","What belongs in it","Used by","What changes between agents?"],"groupBy":{"hideEmptyGroups":true,"property":"Document level","propertyType":"select","sort":{"type":"manual"}},"name":"What each file contains","sorts":[{"direction":"ascending","property":"Document level"},{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-81bd-88fc-000c46f79cc9}}">
{"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","Filename","Filename basis","Naming reason and source","Suggested file location"],"groupBy":{"hideEmptyGroups":true,"property":"Document form","propertyType":"select","sort":{"type":"manual"}},"name":"Filenames and naming evidence","sorts":[{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-81dd-a224-000c5df5c4fe}}">
{"advancedFilter":{"filters":[{"operator":"enum_contains","property":"Tags","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Project-specific"}}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://c765fef1-2167-470d-840e-ff4da67d83d4}}","displayProperties":["Name","Filename","Why this file exists","Naming reason and source","Used by"],"groupBy":{"hideEmptyGroups":true,"property":"Document level","propertyType":"select","sort":{"type":"manual"}},"name":"Project-specific documents","sorts":[{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
</views>
</database>

## [Linked database] Skills

Note: the fetch returned the database schema and views only (no row content).

<database url="{{https://app.notion.com/p/149cd4c4e37f4ca690fe2f1cd38c40ed}}" inline="true">
The title of this Database is: Skills
<ancestor-path>
<parent-page url="https://app.notion.com/p/3dc273e214eb814088b8de2e3184f988" title="Agent Composition"/>
<ancestor-2-page url="https://app.notion.com/p/3da273e214eb80599115cdca4c631888" title="Agents flow center"/>
</ancestor-path>
Here are the Database's Data Sources:
You can use the "fetch" tool on the URL of any Data Source to see its full schema configuration.
<data-sources>
<data-source url="{{collection://2b45943c-152a-47a7-bf9d-212b951221b1}}">
The title of this Data Source is: Skills

Here is the database's configurable state:
Properties with `readOnly: true` are synced or system-managed. Do not try to update their values with page update tools.
<data-source-state>
{"name":"Skills","schema":{"Availability":{"description":"","name":"Availability","options":[{"color":"green","description":"","name":"Installed","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/YU1EOw/ODE5ZmU5ZjctMmJlNS00NWIwLThhOTMtOTRhMTFiYzQ4MzY1"},{"color":"yellow","description":"","name":"Proposed","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/YU1EOw/ZjgzY2Y5NjEtM2I0Yi00OTg1LTg3MWMtZmZhMzc3MTM5ODc3"}],"type":"select"},"Connectors":{"dataSourceUrl":"collection://8ba28b16-0d70-41a0-ad88-2a7add5250c8","description":"","name":"Connectors","propertyUrl":"collectionProperty://8ba28b16-0d70-41a0-ad88-2a7add5250c8/O2tJRQ","type":"relation"},"Documents":{"dataSourceUrl":"collection://c765fef1-2167-470d-840e-ff4da67d83d4","description":"","name":"Documents","propertyUrl":"collectionProperty://c765fef1-2167-470d-840e-ff4da67d83d4/SUp-Qw","type":"relation"},"Files":{"description":"","name":"Files","type":"file"},"Key":{"description":"","name":"Key","type":"text"},"Limitations":{"description":"","name":"Limitations","type":"text"},"Name":{"description":"","name":"Name","type":"title"},"Output":{"description":"","name":"Output","type":"text"},"Reviewed on":{"description":"","name":"Reviewed on","querySqlColumns":{"columns":[{"name":"date:Reviewed on:start","sqlType":"TEXT"},{"name":"date:Reviewed on:end","sqlType":"TEXT"},{"name":"date:Reviewed on:is_datetime","sqlType":"INTEGER"}],"usage":"For connections.notion.querySql. Main schema name not queryable."},"type":"date"},"Source hash":{"description":"","name":"Source hash","type":"text"},"Source path":{"description":"","name":"Source path","type":"text"},"Summary":{"description":"","name":"Summary","type":"text"},"Tags":{"description":"","name":"Tags","options":[{"color":"blue","description":"","name":"Context","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/WkF9Wg/MGI4YjY2NGUtMzliYS00Nzg3LTkzMjktNzZlY2MwNWQ0Y2I0"},{"color":"purple","description":"","name":"Retrieval","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/WkF9Wg/OTJhYzJlMTQtMmJlMy00Mjg2LWIzMzItNDhhZWFmM2ZhY2M2"},{"color":"green","description":"","name":"Mirroring","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/WkF9Wg/ZmFmMWJjODktZTUwOC00NzNhLWEwMzAtZmFjNDI4ZGU2ZTE3"},{"color":"orange","description":"","name":"Publishing","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/WkF9Wg/ZmEzNWI2MDAtNzMzOC00N2I1LWI3NWMtODdlYmM5ZWE5ZGE3"},{"color":"pink","description":"","name":"Semantics","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/WkF9Wg/NTFlMjFmOTUtYTg3NS00MTg1LWJlNTQtZDUyM2ExNDY5ZmRm"},{"color":"red","description":"","name":"Quality","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/WkF9Wg/YTIwM2M1NGUtMWY2MC00ZTg1LThkNmYtNjBjMzA5MzgyZDYw"},{"color":"yellow","description":"","name":"Coordination","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/WkF9Wg/NzVkODE4YjgtZmRiNC00ZTg0LWJkMjItZTE3ZWJiODc2MmRj"},{"color":"brown","description":"","name":"Maintenance","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/WkF9Wg/MTU3ZmVmYjMtZjZlNi00ZTI2LTkzYWMtYmVkMzk1MjY5OGYy"}],"type":"multi_select"},"Trigger":{"description":"","name":"Trigger","type":"text"},"Used by":{"description":"","name":"Used by","options":[{"color":"default","description":"","name":"Every Geo agent","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/Y2RFdA/NjNlZjhhMzUtZmE2NS00ZWExLTllYmQtODVlMmFjNTQ5MTBm"},{"color":"default","description":"","name":"Content agents","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/Y2RFdA/OTA4NzllNWEtM2IzYi00ODFkLTg0MjItNjVjZDZhYjQ2YTA2"},{"color":"default","description":"","name":"Data and schema agents","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/Y2RFdA/MzRjN2VhYzktYTBiOC00OGRjLTk0OWYtNDkxMGYwNTY0Mzdi"},{"color":"default","description":"","name":"Project management agents","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/Y2RFdA/YzQ4Y2NlY2YtOWYzNS00MzAxLTgyNzYtZjUzOTVjZWQ2NDg2"},{"color":"default","description":"","name":"Quality review agents","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/Y2RFdA/YTZiNjA0NjUtNDhkMy00NDRmLWE0MWUtNGM4ZjU0MzM4MmJk"},{"color":"default","description":"","name":"Library maintainers","url":"collectionPropertyOption://2b45943c-152a-47a7-bf9d-212b951221b1/Y2RFdA/ZmNhMWY0YzYtNWY2NS00M2ExLThlZjgtM2M0M2M4ZDBjNDdm"}],"type":"multi_select"},"When to assign":{"description":"","name":"When to assign","type":"text"},"Workflows":{"dataSourceUrl":"collection://4b92adf1-a21a-4077-8072-e32398c77e20","description":"","name":"Workflows","propertyUrl":"collectionProperty://4b92adf1-a21a-4077-8072-e32398c77e20/bFxcdQ","type":"relation"}},"url":"collection://2b45943c-152a-47a7-bf9d-212b951221b1"}
</data-source-state>

Here is the SQLite table definition for this data source.
<sqlite-table>
CREATE TABLE IF NOT EXISTS "collection://2b45943c-152a-47a7-bf9d-212b951221b1" (
	url TEXT UNIQUE,
	createdTime TEXT, -- ISO-8601 datetime string, automatically set. This is the canonical time for when the page was created.
	"Summary" TEXT,
	"Key" TEXT,
	"Files" TEXT, -- JSON array of zero or more file IDs, Notion Folder URLs, or <folder> tags copied from fetch output. Folders are stored as native Folder references.
	"Limitations" TEXT,
	"Tags" TEXT, -- JSON array with zero or more of ["Context", "Retrieval", "Mirroring", "Publishing", "Semantics", "Quality", "Coordination", "Maintenance"]
	"Workflows" TEXT, -- JSON array of page URLs relating to {{collection://4b92adf1-a21a-4077-8072-e32398c77e20}} data source, you must "view" {{collection://4b92adf1-a21a-4077-8072-e32398c77e20}} to query this column
	"Output" TEXT,
	"When to assign" TEXT,
	"Availability" TEXT, -- one of ["Installed", "Proposed"]
	"Used by" TEXT, -- JSON array with zero or more of ["Every Geo agent", "Content agents", "Data and schema agents", "Project management agents", "Quality review agents", "Library maintainers"]
	"Source path" TEXT,
	"Source hash" TEXT,
	"Documents" TEXT, -- JSON array of page URLs relating to {{collection://c765fef1-2167-470d-840e-ff4da67d83d4}} data source, you must "view" {{collection://c765fef1-2167-470d-840e-ff4da67d83d4}} to query this column
	"date:Reviewed on:start" TEXT, -- ISO-8601 date or datetime string. Use the expanded property (date:<column_name>:start) to set this value.
	"date:Reviewed on:end" TEXT, -- ISO-8601 date or datetime string, can be empty. Must be NULL if the date is a single date, and must be present if the date is a range. Use the expanded property (date:<column_name>:end) to set this value.
	"date:Reviewed on:is_datetime" INTEGER, -- 1 if the date is a datetime, 0 if it is a date, NULL defaults to 0. Use the expanded property (date:<column_name>:is_datetime) to set this value.
	"Trigger" TEXT,
	"Connectors" TEXT, -- JSON array of page URLs relating to {{collection://8ba28b16-0d70-41a0-ad88-2a7add5250c8}} data source, you must "view" {{collection://8ba28b16-0d70-41a0-ad88-2a7add5250c8}} to query this column
	"Name" TEXT
)
</sqlite-table>
</data-source>
</data-sources>
Here are the Database's Views:
You can use the "fetch" tool on the URL of any View to see its full configuration.
<views>
<view url="{{view://9b0b389e-64a9-49fa-9343-6c5cafe91352}}">
{"dataSourceUrl":"{{collection://2b45943c-152a-47a7-bf9d-212b951221b1}}","displayProperties":["Name","Used by","Availability","When to assign","Limitations"],"groupBy":{"hideEmptyGroups":true,"property":"Used by","propertyType":"multi_select","sort":{"type":"manual"}},"name":"Skills by role","sorts":[{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-818c-bc4e-000c2b76a2f6}}">
{"advancedFilter":{"filters":[{"filters":[{"operator":"enum_contains","property":"Used by","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Content agents"}}],"operator":"and","type":"group"},{"filters":[{"operator":"enum_is","property":"Availability","propertyType":"select","type":"property","value":{"type":"exact","value":"Installed"}}],"operator":"and","type":"group"}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://2b45943c-152a-47a7-bf9d-212b951221b1}}","displayProperties":["Name","Availability","When to assign","Limitations"],"name":"Content agents — skill candidates","sorts":[{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-8161-aba2-000c0324fd0e}}">
{"advancedFilter":{"filters":[{"filters":[{"operator":"enum_contains","property":"Used by","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Data and schema agents"}}],"operator":"and","type":"group"},{"filters":[{"operator":"enum_is","property":"Availability","propertyType":"select","type":"property","value":{"type":"exact","value":"Installed"}}],"operator":"and","type":"group"}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://2b45943c-152a-47a7-bf9d-212b951221b1}}","displayProperties":["Name","Availability","When to assign","Limitations"],"name":"Data and schema agents — skill candidates","sorts":[{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-8128-a52f-000c957a9a9a}}">
{"advancedFilter":{"filters":[{"filters":[{"operator":"enum_contains","property":"Used by","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Project management agents"}}],"operator":"and","type":"group"},{"filters":[{"operator":"enum_is","property":"Availability","propertyType":"select","type":"property","value":{"type":"exact","value":"Installed"}}],"operator":"and","type":"group"}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://2b45943c-152a-47a7-bf9d-212b951221b1}}","displayProperties":["Name","Availability","When to assign","Limitations"],"name":"Project management agents — skill candidates","sorts":[{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-81a4-8e24-000c42222af4}}">
{"advancedFilter":{"filters":[{"filters":[{"operator":"enum_contains","property":"Used by","propertyType":"multi_select","type":"property","value":{"type":"exact","value":"Quality review agents"}}],"operator":"and","type":"group"},{"filters":[{"operator":"enum_is","property":"Availability","propertyType":"select","type":"property","value":{"type":"exact","value":"Installed"}}],"operator":"and","type":"group"}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://2b45943c-152a-47a7-bf9d-212b951221b1}}","displayProperties":["Name","Availability","When to assign","Limitations"],"name":"Quality review agents — skill candidates","sorts":[{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-8181-b420-000c6acda071}}">
{"advancedFilter":{"filters":[{"operator":"enum_is","property":"Availability","propertyType":"select","type":"property","value":{"type":"exact","value":"Proposed"}}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://2b45943c-152a-47a7-bf9d-212b951221b1}}","displayProperties":["Name","Used by","When to assign","Limitations"],"name":"Proposed — not installed","type":"table"}
</view>
</views>
</database>

## [Linked database] AI workflows

Note: the fetch returned the database schema and views only (no row content).

<database url="{{https://app.notion.com/p/8ff88dbfc9464b67b9fa9508a442cf49}}" inline="true">
The title of this Database is: AI workflows
<ancestor-path>
<parent-page url="https://app.notion.com/p/3dc273e214eb814088b8de2e3184f988" title="Agent Composition"/>
<ancestor-2-page url="https://app.notion.com/p/3da273e214eb80599115cdca4c631888" title="Agents flow center"/>
</ancestor-path>
Here are the Database's Data Sources:
You can use the "fetch" tool on the URL of any Data Source to see its full schema configuration.
<data-sources>
<data-source url="{{collection://4b92adf1-a21a-4077-8072-e32398c77e20}}">
The title of this Data Source is: AI workflows

Here is the database's configurable state:
Properties with `readOnly: true` are synced or system-managed. Do not try to update their values with page update tools.
<data-source-state>
{"name":"AI workflows","schema":{"Children":{"dataSourceUrl":"collection://4b92adf1-a21a-4077-8072-e32398c77e20","description":"","name":"Children","type":"relation"},"Connectors":{"dataSourceUrl":"collection://8ba28b16-0d70-41a0-ad88-2a7add5250c8","description":"","name":"Connectors","propertyUrl":"collectionProperty://8ba28b16-0d70-41a0-ad88-2a7add5250c8/Xz9tYQ","type":"relation"},"Depends on":{"dataSourceUrl":"collection://4b92adf1-a21a-4077-8072-e32398c77e20","description":"","name":"Depends on","type":"relation"},"Documents":{"dataSourceUrl":"collection://c765fef1-2167-470d-840e-ff4da67d83d4","description":"","name":"Documents","propertyUrl":"collectionProperty://c765fef1-2167-470d-840e-ff4da67d83d4/dGdLPQ","type":"relation"},"Done when":{"description":"","name":"Done when","type":"text"},"Failure response":{"description":"","name":"Failure response","type":"text"},"Inputs":{"description":"","name":"Inputs","type":"text"},"Key":{"description":"","name":"Key","type":"text"},"Level":{"description":"","name":"Level","options":[{"color":"blue","description":"","name":"Workflow","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/RER5Xw/MTU3ZjAxODUtMWQ2My00NjQ2LWI2MDQtNWI1Y2E5NDVhZGM3"},{"color":"gray","description":"","name":"Step","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/RER5Xw/YWY4ZGE5YzAtMzI0Ni00YTdmLTgyMzgtZDEyZWRiNjk5YTRk"}],"type":"select"},"Name":{"description":"","name":"Name","type":"title"},"Order":{"description":"","name":"Order","type":"number"},"Outputs":{"description":"","name":"Outputs","type":"text"},"Parent":{"dataSourceUrl":"collection://4b92adf1-a21a-4077-8072-e32398c77e20","description":"","name":"Parent","propertyUrl":"collectionProperty://4b92adf1-a21a-4077-8072-e32398c77e20/WltLQw","type":"relation"},"Readiness":{"description":"","name":"Readiness","options":[{"color":"blue","description":"","name":"Documented procedure","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/TUBeWg/YjdjNGY1N2UtZTJhOC00MzEwLWI1ZjEtOGVmMjkwYmQ0Yzg0"},{"color":"orange","description":"","name":"Controlled use","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/TUBeWg/MGQ1N2JhNjYtZjE0ZS00OGQyLWE1N2QtNjM0ZDM4NjZjNmYz"},{"color":"yellow","description":"","name":"Proposed","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/TUBeWg/MmU1OTkyNWYtOWI5Zi00MTJiLWEyNDYtNWZjMjI3NzgyOTQ1"}],"type":"select"},"Reviewed on":{"description":"","name":"Reviewed on","querySqlColumns":{"columns":[{"name":"date:Reviewed on:start","sqlType":"TEXT"},{"name":"date:Reviewed on:end","sqlType":"TEXT"},{"name":"date:Reviewed on:is_datetime","sqlType":"INTEGER"}],"usage":"For connections.notion.querySql. Main schema name not queryable."},"type":"date"},"Skills":{"dataSourceUrl":"collection://2b45943c-152a-47a7-bf9d-212b951221b1","description":"","name":"Skills","propertyUrl":"collectionProperty://2b45943c-152a-47a7-bf9d-212b951221b1/WkptSQ","type":"relation"},"Source link":{"description":"","name":"Source link","type":"url"},"Stage":{"description":"","name":"Stage","options":[{"color":"gray","description":"","name":"Prepare","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/SWVDWg/YmFjN2FhOTYtNTc3My00MmUyLTgwNjQtNjYzODcxZGZkYmVj"},{"color":"blue","description":"","name":"Read","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/SWVDWg/ODE1Y2NjZWItZDE2OS00NmU4LTgwOTMtOGM5NmRjZmFjZTg1"},{"color":"purple","description":"","name":"Understand","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/SWVDWg/Yzk5MDBmMDAtNjMzYy00OGU1LWIwZGYtNjBmMTk4MDRlYzJh"},{"color":"pink","description":"","name":"Draft","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/SWVDWg/MjQ0NjJjMzEtMDdiOS00OTJlLTgxNjMtYzkwYzMxNTE5ZWQw"},{"color":"yellow","description":"","name":"Review","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/SWVDWg/ZjhjNjJkNWUtY2U3My00NDQwLWJhYTUtMWNkOGU5M2JlYjg5"},{"color":"orange","description":"","name":"Write","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/SWVDWg/NzA3MDcxNTktYzYzMi00ODg1LWJkOTMtMTE4ZDUwNjg4N2Nh"},{"color":"green","description":"","name":"Verify","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/SWVDWg/NTBkYWY4NzItZTYwMi00OGFiLWExZjktNDUzYWFjN2QwYTM0"},{"color":"brown","description":"","name":"Maintain","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/SWVDWg/ZDVkYjEyNzYtOGNjNi00ZmNiLWEwNzgtNDQ3OGJlZmU5Zjc0"}],"type":"select"},"Summary":{"description":"","name":"Summary","type":"text"},"Tags":{"description":"","name":"Tags","options":[{"color":"blue","description":"","name":"Context","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/aFJLeA/ZjYyMWMwOTAtMTkyNC00ODMyLWI3NDItYjQ4MTQzNDViOWM1"},{"color":"purple","description":"","name":"Retrieval","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/aFJLeA/ZjBiNWJjMmEtYmQ5Ni00MmJkLTkxODctNTJlM2U0MjBiZTk4"},{"color":"green","description":"","name":"Mirroring","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/aFJLeA/Mjk1ODM1ODYtYWQ1Yy00OWVmLTliNjItODk3YTMyM2FhNDNj"},{"color":"orange","description":"","name":"Publishing","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/aFJLeA/MTRiMTE1MjQtN2U0OS00NDg4LTg0ZjgtZjczZGQzOGRiNzk3"},{"color":"pink","description":"","name":"Semantics","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/aFJLeA/MzYzMDJhMDQtN2VkYi00YzM5LTg1ZDUtNjkxZWZiOGMyNjIx"},{"color":"red","description":"","name":"Quality","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/aFJLeA/ZGRlMDZiM2ItZjM0Zi00OWFiLWFlZGEtNmU1ZjBjNWNiY2M5"},{"color":"yellow","description":"","name":"Coordination","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/aFJLeA/OGU2N2NhNDYtZGY4OC00ZGRlLWEzZjAtYmQ3YjAzNGIwNmQx"},{"color":"brown","description":"","name":"Maintenance","url":"collectionPropertyOption://4b92adf1-a21a-4077-8072-e32398c77e20/aFJLeA/MTBiMTNmNmUtYWQwZi00ZmEzLTgyYzMtMTU3ZjUzZmEyZDRm"}],"type":"multi_select"}},"url":"collection://4b92adf1-a21a-4077-8072-e32398c77e20"}
</data-source-state>

Here is the SQLite table definition for this data source.
<sqlite-table>
CREATE TABLE IF NOT EXISTS "collection://4b92adf1-a21a-4077-8072-e32398c77e20" (
	url TEXT UNIQUE,
	createdTime TEXT, -- ISO-8601 datetime string, automatically set. This is the canonical time for when the page was created.
	"Inputs" TEXT,
	"Level" TEXT, -- one of ["Workflow", "Step"]
	"Stage" TEXT, -- one of ["Prepare", "Read", "Understand", "Draft", "Review", "Write", "Verify", "Maintain"]
	"Readiness" TEXT, -- one of ["Documented procedure", "Controlled use", "Proposed"]
	"Failure response" TEXT,
	"Depends on" TEXT, -- JSON array of page URLs relating to {{collection://4b92adf1-a21a-4077-8072-e32398c77e20}} data source, you must "view" {{collection://4b92adf1-a21a-4077-8072-e32398c77e20}} to query this column
	"Source link" TEXT,
	"date:Reviewed on:start" TEXT, -- ISO-8601 date or datetime string. Use the expanded property (date:<column_name>:start) to set this value.
	"date:Reviewed on:end" TEXT, -- ISO-8601 date or datetime string, can be empty. Must be NULL if the date is a single date, and must be present if the date is a range. Use the expanded property (date:<column_name>:end) to set this value.
	"date:Reviewed on:is_datetime" INTEGER, -- 1 if the date is a datetime, 0 if it is a date, NULL defaults to 0. Use the expanded property (date:<column_name>:is_datetime) to set this value.
	"Parent" TEXT, -- JSON array of page URLs relating to {{collection://4b92adf1-a21a-4077-8072-e32398c77e20}} data source, you must "view" {{collection://4b92adf1-a21a-4077-8072-e32398c77e20}} to query this column
	"Documents" TEXT, -- JSON array of page URLs relating to {{collection://c765fef1-2167-470d-840e-ff4da67d83d4}} data source, you must "view" {{collection://c765fef1-2167-470d-840e-ff4da67d83d4}} to query this column
	"Order" FLOAT,
	"Children" TEXT, -- JSON array of page URLs relating to {{collection://4b92adf1-a21a-4077-8072-e32398c77e20}} data source, you must "view" {{collection://4b92adf1-a21a-4077-8072-e32398c77e20}} to query this column
	"Tags" TEXT, -- JSON array with zero or more of ["Context", "Retrieval", "Mirroring", "Publishing", "Semantics", "Quality", "Coordination", "Maintenance"]
	"Connectors" TEXT, -- JSON array of page URLs relating to {{collection://8ba28b16-0d70-41a0-ad88-2a7add5250c8}} data source, you must "view" {{collection://8ba28b16-0d70-41a0-ad88-2a7add5250c8}} to query this column
	"Key" TEXT,
	"Skills" TEXT, -- JSON array of page URLs relating to {{collection://2b45943c-152a-47a7-bf9d-212b951221b1}} data source, you must "view" {{collection://2b45943c-152a-47a7-bf9d-212b951221b1}} to query this column
	"Done when" TEXT,
	"Summary" TEXT,
	"Outputs" TEXT,
	"Name" TEXT
)
</sqlite-table>
</data-source>
</data-sources>
Here are the Database's Views:
You can use the "fetch" tool on the URL of any View to see its full configuration.
<views>
<view url="{{view://d36d54ed-6870-4238-a74c-24850cde3f5a}}">
{"advancedFilter":{"filters":[{"operator":"enum_is","property":"Level","propertyType":"select","type":"property","value":{"type":"exact","value":"Workflow"}}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://4b92adf1-a21a-4077-8072-e32398c77e20}}","displayProperties":["Name","Readiness","Summary","Children","Skills"],"name":"Workflow overview","sorts":[{"direction":"ascending","property":"Order"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-81e1-8f90-000cd238eb97}}">
{"advancedFilter":{"filters":[{"operator":"enum_is","property":"Level","propertyType":"select","type":"property","value":{"type":"exact","value":"Step"}}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://4b92adf1-a21a-4077-8072-e32398c77e20}}","displayProperties":["Name","Parent","Order","Stage","Inputs","Outputs","Done when","Depends on"],"groupBy":{"hideEmptyGroups":true,"property":"Parent","propertyType":"relation","sort":{"type":"ascending"}},"name":"All steps","sorts":[{"direction":"ascending","property":"Order"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-812f-a615-000c3bf657c3}}">
{"dataSourceUrl":"{{collection://4b92adf1-a21a-4077-8072-e32398c77e20}}","displayProperties":["Name","Key","Level","Parent","Children","Readiness"],"name":"All records","sorts":[{"direction":"ascending","property":"Key"}],"type":"table"}
</view>
<view url="{{view://3dd273e2-14eb-812f-8667-000c39ac13a5}}">
{"advancedFilter":{"filters":[{"filters":[{"operator":"enum_is","property":"Readiness","propertyType":"select","type":"property","value":{"type":"exact","value":"Proposed"}}],"operator":"and","type":"group"},{"filters":[{"operator":"enum_is","property":"Level","propertyType":"select","type":"property","value":{"type":"exact","value":"Workflow"}}],"operator":"and","type":"group"}],"operator":"and","type":"group"},"dataSourceUrl":"{{collection://4b92adf1-a21a-4077-8072-e32398c77e20}}","displayProperties":["Name","Summary","Skills"],"name":"Proposed procedures","type":"table"}
</view>
</views>
</database>

## [Linked database] Connectors & runtime

Note: the fetch returned the database schema and views only (no row content).

<database url="{{https://app.notion.com/p/1e9b3838d87a40f385d20415a032263a}}" inline="true">
The title of this Database is: Connectors & runtime
<ancestor-path>
<parent-page url="https://app.notion.com/p/3dc273e214eb814088b8de2e3184f988" title="Agent Composition"/>
<ancestor-2-page url="https://app.notion.com/p/3da273e214eb80599115cdca4c631888" title="Agents flow center"/>
</ancestor-path>
Here are the Database's Data Sources:
You can use the "fetch" tool on the URL of any Data Source to see its full schema configuration.
<data-sources>
<data-source url="{{collection://8ba28b16-0d70-41a0-ad88-2a7add5250c8}}">
The title of this Data Source is: Connectors & runtime

Here is the database's configurable state:
Properties with `readOnly: true` are synced or system-managed. Do not try to update their values with page update tools.
<data-source-state>
{"name":"Connectors & runtime","schema":{"Access needed":{"description":"","name":"Access needed","type":"text"},"Availability":{"description":"","name":"Availability","options":[{"color":"green","description":"","name":"Available here","url":"collectionPropertyOption://8ba28b16-0d70-41a0-ad88-2a7add5250c8/YFJwaA/ZGU1ZGVjMjItYzRlNi00OTk2LTk5ZmItNTdhNGRmN2Y1MGJl"},{"color":"orange","description":"","name":"Requires setup","url":"collectionPropertyOption://8ba28b16-0d70-41a0-ad88-2a7add5250c8/YFJwaA/MWIwNGEzMzktOGQzNy00MjY0LTljZmMtNWM4MzE5ZWYwOWI3"},{"color":"gray","description":"","name":"Optional","url":"collectionPropertyOption://8ba28b16-0d70-41a0-ad88-2a7add5250c8/YFJwaA/OTNhNmJhY2QtYzMzYS00ZWVlLWJlZWYtZjIyNjhhMGI5NDZh"}],"type":"select"},"Key":{"description":"","name":"Key","type":"text"},"Name":{"description":"","name":"Name","type":"title"},"Reviewed on":{"description":"","name":"Reviewed on","querySqlColumns":{"columns":[{"name":"date:Reviewed on:start","sqlType":"TEXT"},{"name":"date:Reviewed on:end","sqlType":"TEXT"},{"name":"date:Reviewed on:is_datetime","sqlType":"INTEGER"}],"usage":"For connections.notion.querySql. Main schema name not queryable."},"type":"date"},"Skills":{"dataSourceUrl":"collection://2b45943c-152a-47a7-bf9d-212b951221b1","description":"","name":"Skills","propertyUrl":"collectionProperty://2b45943c-152a-47a7-bf9d-212b951221b1/eU9Ybw","type":"relation"},"Summary":{"description":"","name":"Summary","type":"text"},"Tags":{"description":"","name":"Tags","options":[{"color":"blue","description":"","name":"Context","url":"collectionPropertyOption://8ba28b16-0d70-41a0-ad88-2a7add5250c8/bF1ZRw/ZDE4ZGZjOWEtNzNkYy00OGNiLWJjMzYtZjY2NTlhMDc4ZDE5"},{"color":"purple","description":"","name":"Retrieval","url":"collectionPropertyOption://8ba28b16-0d70-41a0-ad88-2a7add5250c8/bF1ZRw/MWQ2ZjJkY2MtNDY2NS00ZWE2LThhNzYtNzZiODU1NmNlYjAy"},{"color":"green","description":"","name":"Mirroring","url":"collectionPropertyOption://8ba28b16-0d70-41a0-ad88-2a7add5250c8/bF1ZRw/MzFkOTliZTMtNzFlZC00MGVmLTk1ZGMtOWZhMWQzNGJhNGJk"},{"color":"orange","description":"","name":"Publishing","url":"collectionPropertyOption://8ba28b16-0d70-41a0-ad88-2a7add5250c8/bF1ZRw/Y2MxMmU0M2UtZGIzYi00MzFiLWJmMDgtYTc1NmMzNmNkZTU1"},{"color":"pink","description":"","name":"Semantics","url":"collectionPropertyOption://8ba28b16-0d70-41a0-ad88-2a7add5250c8/bF1ZRw/ZjRkY2ZiMDYtMjhkYi00YWIyLTlkOGEtN2EzNTdlY2I0ZTU0"},{"color":"red","description":"","name":"Quality","url":"collectionPropertyOption://8ba28b16-0d70-41a0-ad88-2a7add5250c8/bF1ZRw/M2U1YTlmMjYtZDI0OC00OTQ0LTg0MzEtNzY1ZmFlMmFjM2Ji"},{"color":"yellow","description":"","name":"Coordination","url":"collectionPropertyOption://8ba28b16-0d70-41a0-ad88-2a7add5250c8/bF1ZRw/MzJkNjRmNDgtMzI2Ny00ZTkxLWEwNzYtZGUwMjMyMTYyMWI0"},{"color":"brown","description":"","name":"Maintenance","url":"collectionPropertyOption://8ba28b16-0d70-41a0-ad88-2a7add5250c8/bF1ZRw/YzU1MzgwZmEtMDRkZC00MzczLTlhN2QtYzc0Mjc0OThhMTM5"}],"type":"multi_select"},"Used for":{"description":"","name":"Used for","type":"text"},"Workflows":{"dataSourceUrl":"collection://4b92adf1-a21a-4077-8072-e32398c77e20","description":"","name":"Workflows","propertyUrl":"collectionProperty://4b92adf1-a21a-4077-8072-e32398c77e20/aUdzbQ","type":"relation"}},"url":"collection://8ba28b16-0d70-41a0-ad88-2a7add5250c8"}
</data-source-state>

Here is the SQLite table definition for this data source.
<sqlite-table>
CREATE TABLE IF NOT EXISTS "collection://8ba28b16-0d70-41a0-ad88-2a7add5250c8" (
	url TEXT UNIQUE,
	createdTime TEXT, -- ISO-8601 datetime string, automatically set. This is the canonical time for when the page was created.
	"Skills" TEXT, -- JSON array of page URLs relating to {{collection://2b45943c-152a-47a7-bf9d-212b951221b1}} data source, you must "view" {{collection://2b45943c-152a-47a7-bf9d-212b951221b1}} to query this column
	"Used for" TEXT,
	"Key" TEXT,
	"date:Reviewed on:start" TEXT, -- ISO-8601 date or datetime string. Use the expanded property (date:<column_name>:start) to set this value.
	"date:Reviewed on:end" TEXT, -- ISO-8601 date or datetime string, can be empty. Must be NULL if the date is a single date, and must be present if the date is a range. Use the expanded property (date:<column_name>:end) to set this value.
	"date:Reviewed on:is_datetime" INTEGER, -- 1 if the date is a datetime, 0 if it is a date, NULL defaults to 0. Use the expanded property (date:<column_name>:is_datetime) to set this value.
	"Summary" TEXT,
	"Workflows" TEXT, -- JSON array of page URLs relating to {{collection://4b92adf1-a21a-4077-8072-e32398c77e20}} data source, you must "view" {{collection://4b92adf1-a21a-4077-8072-e32398c77e20}} to query this column
	"Availability" TEXT, -- one of ["Available here", "Requires setup", "Optional"]
	"Tags" TEXT, -- JSON array with zero or more of ["Context", "Retrieval", "Mirroring", "Publishing", "Semantics", "Quality", "Coordination", "Maintenance"]
	"Access needed" TEXT,
	"Name" TEXT
)
</sqlite-table>
</data-source>
</data-sources>
Here are the Database's Views:
You can use the "fetch" tool on the URL of any View to see its full configuration.
<views>
<view url="{{view://43619b00-8163-4c55-82a5-370c89d25275}}">
{"dataSourceUrl":"{{collection://8ba28b16-0d70-41a0-ad88-2a7add5250c8}}","displayProperties":["Name","Availability","Used for","Access needed"],"name":"Connections","sorts":[{"direction":"ascending","property":"Name"}],"type":"table"}
</view>
</views>
</database>
