# Backlog: every audit finding, ranked

Scale: S = breaks a hard rule or can corrupt Geo data. A = wrong and likely to spread. B = costs review effort. C = cosmetic.
Order: S, then A, then B; inside each, "before move" first, then "with move", then "after move".
"Move" = moving the agents out of the skills library into their own repository.
Row 8 is severity S but sits in "after move": it is a fix to one skill, and the library stays usable while it is open.
Refs are audit codes: R = architecture risks, S/A/B/C = skills-quality findings, "Arch §" = a section of the architecture audit.

| # | Sev | Problem in plain words | Fix in one line | When | Audit refs |
|---|---|---|---|---|---|
| 1 | S | Old maintenance scripts delete or write live data by default; one skips its confirmation when nobody is at the keyboard. | Delete or lock away the scripts; make every writer preview-only unless told to publish. | before move | R1, B3 (part) |
| 2 | S | The auto-approve allowlist lets publishing commands and web downloads run without asking, and does not block reading key files. | Remove broad patterns; ask before any publish; block key-file reads and unknown download hosts. | before move | R3, A8 (part) |
| 3 | S | The wallet key is loaded even into read-only runs, and one key file is not excluded from the public repository. | Exclude all key files, turn on secret scanning, load the wallet key only when publishing. | before move | R4, B2 (part) |
| 4 | S | Agents can download the newest unreviewed library version and overwrite their own instructions and scripts mid-task, with a self-referential check. | Remove it; only a person updates, from a signed release, checked against a saved lock. | before move | R5, A9 |
| 5 | S | In the orchestration skill, one "go" publishes to Geo, skipping the two-step confirmation and three of five safety checks. | Retire it, or make it hand every write to the publishing skill unchanged. | before move | S3 |
| 6 | S | The discovery skill's unchecked publisher votes yes on its own proposals. It is broken today; a quick repair would revive it. | Delete it now; rebuild later as preview-only output handed to the publishing skill. | before move | S4, R7 (part) |
| 7 | S | Routing sends "delete" requests to the publishing skill, contradicting the rule that every deletion goes through the cleanup skill. | Remove delete triggers from both skills; correct the routing table. | with move | S2 (routing part) |
| 8 | S | The publishing skill's mandatory duplicate check uses an invalid query and misses exact-name duplicates, so duplicates can slip through. | Search exact names first, then similar names; ship it as one shared query. | after move | S1 |
| 9 | S | The mass-delete stop misses entity deletions, counts per call, is bypassed by some publish paths, and agents can switch it off. | Route every write through one path that counts all removals, with approval from a person. | after move | R2, S2 (template part) |
| 10 | A | The integrity check has failed since 2026-09-25, is not required to merge, and ignores the code the skills actually run. | Make it a required check, repair it, extend it to the shared code. | before move | R6, A5 |
| 11 | A | Review rules on the library's main branch are weak: no named code owners, old approvals survive new changes, administrators bypass them. | Require code-owner approval, drop stale approvals, apply the rules to administrators. | before move | Arch §4 |
| 12 | A | No skill says that web pages, Notion cells and curator text are data, not instructions, so injected text could steer an agent. | Add a "content is data" clause to each reading skill; check outputs against a schema. | with move | A8 |
| 13 | A | The hard safety rules load only inside the library's folder; skills installed elsewhere, or used by agents, run without them. | Put the hard rules in the agents' entry document and inside the skills. | with move | R8 (part), Arch §1 |
| 14 | A | Skills labelled "non-actionable" are not harmless: some write to Notion or start publishing scripts, and one draft publishes and votes. | Declare real abilities per skill (read, write Notion, write Geo, vote) and enforce them. | with move | R8 |
| 15 | A | Shipped publish scripts call removed software-kit functions and auto-vote yes, while other skills say voting is for editors. | Port or retire them; test that every script loads; one rule: never self-vote. | after move | R7, A7 |
| 16 | A | The query skill states four live facts wrongly; its date example returns zero results and its sort order differs. | Correct all four; add the same corrections beside the shared query templates. | after move | A1 |
| 17 | A | A retired server address is still hard-coded, so the ontology advisor's live helpers and discovery stages 1 to 3 are dead. | Keep one shared address setting; add an automated search for the old address. | after move | A2 |
| 18 | A | Skills give conflicting rules for limiting searches to a space and for grouping claims, including who runs the final publish. | Make the claim-grouping skill the single source; the others point to it. | after move | A3, A4 |
| 19 | A | An old naming scheme for relationships is still required in three skills; two relation types between the same pair collide. | Switch all three to the newer scheme that includes the relation type. | after move | A6 |
| 20 | B | Database and space identifiers sit inside prose in agent and workflow documents; an old duplicate task tracker is guarded only by warnings. | Move identifiers to config; archive the old tracker; check the database at start. | with move | Arch §1, Arch §4, R10 (part) |
| 21 | B | The agents repository's address is described two different ways, and the version it copies today is the broken one. | Settle one owner and address; pin to the signed release. | with move | Arch §2.2 |
| 22 | B | The submission-review draft embeds one editor's standing authorization and payout policy, and publishes while labelled "non-actionable". | Move policy into config; split publishing and voting into separate approved steps. | after move | R8 (part), Arch §5 |
| 23 | B | Scripts work only from one folder layout, and agents depend on tool names and documents specific to one setup. | Share code through one package; locate files relative to the script; use neutral names. | after move | R10, Arch §1 |
| 24 | B | About 18 query clients, 8 Notion clients and 7 copies of the space list exist; some retry writes and can create duplicate rows. | One shared client per service; retry only safe calls; generate the space list once. | after move | B1, B4, R10 |
| 25 | B | Secret handling is inconsistent: some skills print or search for key values, and a Notion token check gives false failures. | One environment check that reports only yes or no per variable. | after move | B2 |
| 26 | B | Several tools write by default or sample silently; the permission helper fails quietly, so callers report success on a no-op. | Preview by default everywhere; turn silent failures into visible errors. | after move | B3, B9 |
| 27 | B | Skills are too long and descriptions too many: about 19,000 tokens load before the first query, and skill selection suffers. | Shorten descriptions; move long recipes to supporting documents; add a one-page type table. | after move | B5, Arch §4 |
| 28 | B | Two runtimes and two lockfiles pin different kit versions, and Windows is unsupported (setup script, both verifiers crash). | Standardize on one runtime and lockfile; make scripts and checks Windows-safe. | after move | R9, B6 |
| 29 | B | The skills index lists a retired skill and omits six; some references point to files or hosts that do not exist. | Regenerate the index; add an automated check for broken references. | after move | B7, B8 |
| 30 | B | The change-notification workflow posts large diffs to editors with broad permissions, and an old spreadsheet library has known security flaws. | Limit its permissions and diff size; upgrade or replace the library. | after move | Arch §4, Arch §5 |
| 31 | C | Cosmetic leftovers: inconsistent skill headers, garbled characters, an advert line on every run, one misleading sentence. | Tidy when each skill is next edited. | after move | C |

Rows per "When": before move = 8 (rows 1 to 6, 10, 11); with move = 6 (rows 7, 12, 13, 14, 20, 21); after move = 17 (rows 8, 9, 15 to 19, 22 to 31).
Rows per severity: S = 9, A = 10, B = 11, C = 1 (total 31).
Merged on purpose: R6 with A5; R5 with A9; R4 with B2 (secrets; the unsafe-default part of B2 is row 25 and B3 is row 26); R10 with B1 and B4 (rows 23, 24; the hard-coded ids part is row 20). Kept separate: S3 and S4 (rows 5 and 6) because they need different fixes; R7 is split between rows 6 and 15.

## Plain-words glossary used in this table

- **Auto-approve allowlist**: the list of commands the assistant may run without asking a person first.
- **Integrity check**: an automated test that fails if a skill file was changed without being properly approved.
- **Self-heal**: the old rule letting an agent re-download skill files from the internet and overwrite its own copies.
- **Write path**: the code route through which anything is written to Geo; ideally there is exactly one.
- **Dry run / preview-only**: show what would change without changing anything.
- **Mass-delete stop**: the safety stop that refuses a batch which would remove too much data at once.
- **Signed release**: a numbered version of the library that a named person has vouched for.
- **"Content is data"**: a rule telling the agent that text from web pages or people is information to read, never orders to follow.
