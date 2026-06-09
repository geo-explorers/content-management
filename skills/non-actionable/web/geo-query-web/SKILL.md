---
name: geo-query-web
description: Read the Geo knowledge graph from a browser-based assistant (claude.ai, Codex, ChatGPT) using only HTTP. No local infra, no SDK, no wallet. Use to find entities, inspect properties and relations, traverse the graph, discover a type's schema, OR review a data submission (multi-table page) for completeness and accuracy. Triggers on "find in geo", "search geo", "list geo entities", "what entities", "show me from geo", "in space", "discover schema", "backlinks", "review submission", "fact-check submission", "check this page", any geobrowser.io URL.
---

# Geo Knowledge Graph — Querying (web-only)

Read entities, types, properties, and relations from Geo using a single GraphQL endpoint. Designed for **browser-hosted assistants** (claude.ai, Codex, ChatGPT) where there is no filesystem, no SDK, no wallet. Read-only. Cannot publish.

## Endpoint

```
POST https://testnet-api.geobrowser.io/graphql
Content-Type: application/json
```

No auth, no API key. If the analysis / code-execution tool is available, run requests through it. Otherwise paste the query and ask the user to run it.

**Always introspect first if a sample query fails.** The schema drifts — field names and connection styles change. Use a GraphQL introspection query to confirm shapes before assuming the examples below are current. The examples were verified on 2026-05-12; treat them as a starting point, not gospel.

## Minimal request (Python — analysis tool)

```python
import json, urllib.request

def gql(query, variables=None):
    body = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        "https://testnet-api.geobrowser.io/graphql",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

data = gql("{ entities(first: 5, filter: {name: {includesInsensitive: \"Bitcoin\"}}) { id name } }")
print(data)
```

Retry on 5xx / 429 with exponential backoff (2s, 4s, 8s). Stop after 3 retries.

## The four query patterns

### Pattern A — Find entities by name (across all types and spaces)

```graphql
{
  entities(first: 20, filter: { name: { includesInsensitive: "Bitcoin" } }) {
    id
    name
    createdAt
    types { type { id name } }
  }
}
```

Use this as the **default duplicate-check** when the user is about to create a new entity. Do NOT filter by type — "Bitcoin" the Project is still a duplicate concern of "Bitcoin" the Token.

### Pattern B — List entities of a type

You need the type ID first. Get it from Pattern A on a known instance, or:

```graphql
{ types(first: 50) { id name } }
```

Then:

```graphql
{ entities(typeId: "TYPE_ID", first: 50) { id name } }
```

### Pattern C — Inspect one entity (the schema-discovery query)

```graphql
{
  entity(id: "<entity-id>") {
    id
    name
    createdAt
    types { type { id name } }
    values(first: 50) {
      property { id name }
      text date boolean decimal
    }
    relations(first: 50) {
      id
      type { id name }
      toEntity { id name }
      toSpace { id }
    }
  }
}
```

`relations.id` is the **edge id** (for delete operations). `relations.toEntity.id` is the target entity's id. They are different — do not confuse.

### Pattern D — Traverse the graph (backlinks / outgoing)

Incoming (what points AT this entity):

```graphql
{
  relations(filter: { toEntity: { id: { is: "<id>" } } }, first: 50) {
    id
    type { name }
    fromEntity { id name }
  }
}
```

Outgoing (what this entity points AT) — already covered by Pattern C's `relations` field.

### Pattern E — Review a submission (multi-table page)

Use this when the user gives a `geobrowser.io/space/<SPACE_ID>/<ENTITY_ID>` URL or asks to "review/fact-check this submission/page". A submission is a single entity whose page contains one or more **data blocks** — each block is a filtered query rendered as a table. Reviewing means: enumerate ALL blocks, paginate ALL rows in each block, and inspect entities for the issues the user asked about (missing entries, wrong descriptions, inaccurate properties).

**Step 1 — Parse the URL.**
`https://www.geobrowser.io/space/<SPACE_ID>/<ENTITY_ID>` → strip the prefix, the second hex segment is the entity id. Hand both IDs forward; the space ID matters only when the user asks "what's in this space".

**Step 2 — Fetch the submission entity and enumerate its blocks.**
Run Pattern C against `<ENTITY_ID>` first. Look in `relations` for entries whose `type.name` looks like `Blocks` / `Data block` / `Has block` / similar — the exact relation type varies. Each `toEntity.id` is a block entity.

If the relation type isn't obvious, fall back to introspection: read every relation, then Pattern C each `toEntity` until you find the ones whose own type is `Data block` (or similar). Don't guess — schemas drift; confirm by inspection.

**Step 3 — Decode each block's filter.**
For each block entity, run Pattern C. The block's `values` and `relations` describe what it queries — typical fields: a `Type` relation (what entity type the block displays), one or more property/relation filters, optionally a space scope. Read these directly off the block; don't infer them from the UI.

**Step 4 — Re-run each filter and paginate FULLY.**
Translate the block's filter into a GraphQL `entities` query. Then paginate until exhausted — **do not stop at the first page**. Offset is capped at 1,000; for larger blocks paginate by `createdAt` cursor:

```graphql
{ entities(
    first: 50,
    filter: { ...block filter..., createdAt: { greaterThan: "<last_createdAt>" } }
  ) {
    id name createdAt
    values(first: 20) { property { id name } text date }
    relations(first: 20) { type { id name } toEntity { id name } }
} }
```

Order by `createdAt` ascending and feed the last row's `createdAt` back as `greaterThan` on the next call. Keep going until the page returns fewer rows than `first`.

**Step 5 — Inspect each entity per the review criteria.**
- **Missing entries**: cross-reference the rows against the user's expected list (if they provided one) or against domain knowledge of what *should* be there.
- **Wrong descriptions**: read `values[].text` for the Description property and check for accuracy, completeness, source attribution.
- **Inaccurate properties**: spot-check property values against the entity's web URL (Pattern A → `Website` / `Web URL` property) or other source.

**Step 6 — Report.**
For each block, output:
- Block name + id
- Total rows (after full pagination, not just page 1)
- Findings: `[OK]`, `[MISSING]`, `[WRONG DESCRIPTION]`, `[INACCURATE PROPERTY]` per row that has an issue
- A short summary line: e.g. "Block 'Hospitals — California': 247 rows, 12 issues (3 missing, 7 wrong descriptions, 2 inaccurate prices)."

Surface findings as a single structured report, not piecemeal. The reviewer needs the full picture before deciding to approve / send back / partial-approve the submission.

## Pagination

Result limit defaults to 50. The API caps `offset` at 1,000 — for larger sweeps, use **cursor-based pagination** (paginate by `createdAt` or by last seen `id`):

```graphql
entities(first: 50, offset: 50, ...) { id name }
```

Keep paginating until the page returns fewer rows than `first`.

## Common editor jobs

- **"Is X already in Geo?"** → Pattern A with `includesInsensitive`. List every hit with `name`, `id`, and `type`. Never restrict by type.
- **"Show me everything about X."** → Pattern A to find the id, then Pattern C for the full record, then Pattern D for incoming relations.
- **"What property/relation IDs does type T use?"** → Pattern A to find any entity of type T → Pattern C → read `values[].property.id` and `relations[].type.id`. These are the IDs a publish would need.
- **"Find duplicates of type T."** → Pattern B to list all entities of type T (paginate), group by lowercased `name`, surface groups with 2+ members.
- **"What was published / added on Geo on date D?"** → filter `entities` by `createdAt` between the start and end of the day (Unix timestamps as strings). Domain-specific `Publish date` properties are typically empty — `createdAt` is the reliable "landed on Geo at" field.
- **"Review / fact-check this submission" (or any `geobrowser.io/space/.../...` URL)** → Pattern E. Always enumerate ALL data blocks and paginate ALL rows in each. Do not summarize from the first page. Report findings per-block.

## Critical gotchas

1. **Don't restrict by space or type when doing a duplicate-check.** Same name often exists across many spaces and types. Filtering misses real duplicates.
2. **Edge id ≠ entity id.** `relations.id` (edge) is used to delete a relation. `relations.toEntity.id` is the target entity. Mixing them silently fails.
3. **Schemas drift — introspect first.** Field names and connection styles change. Recent example: `containsInsensitive` → `includesInsensitive`, and `entities` / `types` / `values` / `relations` now return lists directly (no `.nodes` wrapper). Always run Pattern C on a real instance before claiming a type has property X.
4. **`createdAt` is a Unix-timestamp string** (seconds since epoch). Convert in Python with `datetime.fromtimestamp(int(s), tz=timezone.utc)`. Domain-specific `Publish date` / `Date` properties on types like News story are often empty — use `createdAt` as the "on Geo since" proxy.
5. **Offset is capped at 1,000.** For larger sweeps, paginate by `createdAt` or last-seen `id` (cursor-style), not by ever-increasing `offset`.
6. **GraphQL is read-only.** No writes through this endpoint. Publishing requires the SDK + a wallet, which only works in a local environment (see the `geo-publish` skill in `content-management/skills/` for that path).
7. **Default page size is 50.** Always set `first` explicitly for clarity.
8. **Submission reviews must paginate every block to completion.** If a block shows 247 rows in the UI and you stop at 50, you are submitting an incomplete review. Use cursor pagination by `createdAt`, not offset, since offset caps at 1,000. State the exact row count in the report so the reviewer knows what was checked.
9. **Don't infer block filters from the UI** — read them off the block entity directly via Pattern C. Filters in the rendered table can be hidden, defaulted, or wrapped in computed views; the source of truth is the block entity's `values` and `relations`.

## Output guidance

- For lists > 10 results, return a markdown table with `name | id | type | space` columns.
- For a single entity, return its name + id, then a table of properties, then a list of relations.
- Always surface the entity `id` — it's what the user will need if they later open a publish flow elsewhere.

## What this skill does NOT do

- Publish, create, update, or delete anything.
- Sign transactions.
- Access wallets or private keys.
- Reach MCP servers, local filesystems, or Bun.

If the user asks to write data, tell them: *"This skill is read-only on the web. To publish, use the `geo-orchestrate` / `geo-publish` skills in Claude Code with the `content-management` repo locally."*
