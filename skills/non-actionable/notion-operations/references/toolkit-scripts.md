# The toolkit's Notion scripts — inventory and known defects

All six live in `C:\Users\Cyber\content-management`, authenticate as the **integration**
(`NOTION_TOKEN` in `.env`), and pin `Notion-Version: 2022-06-28`. Run them from the repo
root — imports resolve relative to it. Load env only through Node's flag
(`node --env-file=.env …`); never pass a token on the command line.

## Inventory

| Script | Direction | Writes Notion? |
|---|---|---|
| `scripts/notion-read.mjs` | read | no |
| `skills/actionable/geo-mirror/scripts/mirror-to-notion.mjs` | Geo → Notion | **yes** |
| `skills/actionable/geo-mirror/scripts/diff-notion-vs-geo.mjs` | Notion → plan | no |
| `skills/actionable/geo-mirror/scripts/bulk-set-property.mjs` | Notion → Notion | **yes** |
| `skills/non-actionable/geo-claim-grouping-notion/scripts/roster-from-notion.mjs` | read | no |
| `skills/non-actionable/geo-claim-grouping-notion/scripts/write-grouping-to-notion.mjs` | Notion → Notion | **yes** |

`notion-read.mjs` is the orientation tool: `whoami` confirms the token and prints the
integration and workspace, `inventory` lists everything the integration can see, `schema`
dumps a database's property schema, `props` a row's properties. **Start with `whoami` and
`inventory` when something 404s** — they answer "is this page even connected" directly.

`diff-notion-vs-geo.mjs` is geo-mirror Part 2 and is itself **read-only**: it writes a
change plan for review. Applying that plan to Geo is a separate, gated operation. In v1 it
diffs title, rich_text and url columns only — relations, dates, numbers and checkboxes are
**not** diffed, so a change to one of those is invisible to it.

## Known defects — carry these, they do not announce themselves

### `roster-from-notion.mjs` type-checks nothing

It is deliberately schema-agnostic: any database with a title column and a `Geo ID`
rich_text column is accepted. That means a **wrong-type mirror is silently accepted**. On
2026-09-16 it read a Topics database, accepted all 70 `Topic` ids as a claims roster, and
printed a clean success summary with a valid-looking `roster.json`. Only an independent
type check against Geo caught it.

**Always assert the entity type before grouping work.** Re-resolve every roster id in Geo
and confirm it is a `Claim`. Expect `N/N`; anything less means stop. This costs about a
second and is the only check that exists.

### `scope-candidates.mjs --top` silently samples

Default is 80. With more kept pairs than that it prints `CAPPED — n kept pairs wait for
the next batch` and everything downstream still looks complete. A 137-pair campaign
adjudicated at the default yields 80 adjudications and a report that reads as finished.
Pass `--top` above the pair count, or accept a partial pass knowingly and say so.

### `mirror-to-notion.mjs` creates one database per linked type

`--link` defaults to `"Notable claims,Sources"`. If the mirrored entities' links span
several target types, you get a database per type — an AI-space claims mirror produced
six. Pass `--link ""` for a single table, or name only the relation you want. Decide
before running: extra tables are children of the destination page and must be cleaned up
by hand.

### `extract-space.mjs` cannot scope to an id list

Every scope it offers (`--since`, `--related`, `--limit`) is applied **after** it has
swept the entire type, and `--limit N` returns an arbitrary N when the entities carry no
date property. On a 21,613-claim space that sweep is the memory-blow-up shape geo-mirror
itself warns about. There is no `--ids-file` or tab scope. Until one exists, scope large
spaces by resolving a curated tab to an id list and extracting those ids directly.

### `write-grouping-to-notion.mjs` owns its six columns exclusively

`Proposed related claims`, `Proposed exact duplicates`, `Proposed semantic duplicates`,
`Proposed supporting arguments`, `Proposed opposing arguments`, `Proposed grouping notes`.
Do not hand-edit them and do not reproduce its writes with REST calls — the skill's own
rule. Re-runs are additive; confirm the plan reports `mode: additive` and zero removals.

To change a verdict, edit `decisions.json` / `brackets.json` in the campaign directory and
re-run the dry-run. Nothing is transcribed into a script.

### Campaign directories are session-scoped

Discovery output lands in the session scratchpad by default only if `--out` says so;
otherwise it defaults to `scripts/<date>-claim-grouping-<slug>/` **inside the repo**,
which accumulates artifacts in a working clone. Always pass `--out` to the scratchpad —
and remember the scratchpad is cleared with the session, so publish or copy out anything
that took real time to compute.
