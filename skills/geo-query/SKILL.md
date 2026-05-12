---
name: geo-query
description: Read the Geo knowledge graph — find entities, inspect properties and relations, traverse the graph, discover schemas before publishing. Triggers on "find", "search", "list", "what entities", "show me", "query Geo", "in space", "discover schema", "who points at", "backlinks".
metadata:
  author: geobrowser
  version: 0.1.0
---

# Geo Knowledge Graph — Querying

Read entities, types, properties, and relations from the Geo knowledge graph. The read-only counterpart to `geo-publish`. Use this any time the editor asks a question about Geo, and **always before** publishing a new entity of a type you haven't worked with — schemas drift and IDs must be discovered, not guessed.

## When to apply

Use this skill when the user wants to:

- Find entities by name, type, or property value.
- Inspect a single entity's properties, types, and outgoing relations.
- Traverse the graph from one entity to its neighbours (incoming or outgoing).
- Discover what types and properties exist in a space.
- Discover an existing entity's schema **before** publishing a new one of the same type — the publish skill depends on this.
- Detect duplicates, orphans, or schema drift.

It does NOT publish or change anything. Hand off to `geo-publish` when the user wants to write.

## Two backends, one skill

There are two ways to read Geo. Prefer MCP when available, fall back to GraphQL for things MCP can't do.

### Backend 1 — `hypergraph-mcp` (preferred)

If the user's Codex / Claude Code is configured with the `hypergraph-mcp` server (added via `codex mcp add hypergraph-mcp --url https://hypergraph-mcp.up.railway.app/mcp` or the equivalent Claude Code config), the following tools are available:

| Tool | Purpose |
|---|---|
| `list_spaces` | Enumerate all spaces. |
| `get_entity_types` | List types and their property schemas. Omit `space` to scan **all** spaces at once. |
| `search_entities` | Name search across spaces. Supports `filters` (property-based), `related_to` (graph traversal), `compact`, `limit`/`offset`. |
| `list_entities` | List entities of a given type. Same options as search. |
| `get_entity` | Full details for one entity by ID. |
| `get_related_entities` | Graph traversal — `direction: incoming | outgoing | both`, optional `relation_type`. |

**Don't restrict to a space unless the user explicitly asks.** The same type / name often exists in multiple spaces; passing `space` will silently miss results. Run `list_spaces` once for context, then run searches without `space`.

### Backend 2 — GraphQL (fallback)

Endpoint: `https://testnet-api.geobrowser.io/graphql`. No auth needed for reads.

Use GraphQL when:
- MCP isn't installed.
- You need a query MCP doesn't support (deep nested selections, schema introspection, edge IDs for relation deletion).
- You're discovering schemas before publishing — `geo-publish` calls into this exact pattern.

Minimal request:

```js
const res = await fetch("https://testnet-api.geobrowser.io/graphql", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: `...`, variables: { ... } }),
});
const { data, errors } = await res.json();
```

Retry on 5xx / 429 / GraphQL "Unexpected error" with exponential backoff. Reference implementation: `content-management/src/functions.ts` `gql()`.

## The four query patterns

### Pattern A — Find entities by name

MCP:
```
search_entities({ query: "Bitcoin", compact: true, limit: 10 })
```

GraphQL:
```graphql
{ entities(first: 10, filter: { name: { contains: "Bitcoin" } }) { nodes { id name } } }
```

### Pattern B — List entities of a type

MCP:
```
list_entities({ type: "Person", compact: true, limit: 50 })
```

GraphQL — get the type ID first via `get_entity_types`, then:
```graphql
{ entities(typeId: "TYPE_ID", first: 50) { nodes { id name } } }
```

### Pattern C — Inspect one entity (the schema-discovery query)

MCP:
```
get_entity({ id: "<entity-id>" })
```

GraphQL — this is the canonical schema-discovery query the publish skill depends on:
```graphql
{ entity(id: "<entity-id>") {
    id name
    types { nodes { type { id name } } }
    values(first: 50) {
      nodes { property { id name } text date boolean decimal }
    }
    relations(first: 50) {
      nodes { id type { id name } toEntity { id name } toSpace { id } }
    }
  }
}
```

The `relations.nodes.id` field is the **edge id** — required by `Graph.deleteRelation`. Don't confuse with `toEntity.id`.

### Pattern D — Traverse the graph

MCP:
```
get_related_entities({ entity_id: "<id>", direction: "incoming", relation_type: "Topics" })
```

`incoming` finds "what points at this" (backlinks). `outgoing` finds "what does this point at" (relations).

GraphQL (incoming / backlinks):
```graphql
{ relations(filter: { toEntity: { id: { is: "<id>" } } }, first: 50) {
    nodes { id type { name } fromEntity { id name } }
  }
}
```

## Common editor jobs

- **"What entity types exist?"** → `get_entity_types({})` (no space). Returns the schema map across all spaces.
- **"Show me all Claims with no Topic relation."** → `list_entities({ type: "Claim", limit: 200 })` then check each entity's relations, OR write a GraphQL query with a relations-empty filter.
- **"Find the canonical version of this entity."** → search by name, then for each candidate `get_related_entities({ direction: "incoming" })` and count. Most backlinks = usual Main.
- **"Discover schema for type X before I publish a new one of type X."** → fetch one existing entity of type X with Pattern C. Read property IDs and relation type IDs from the result. Pass them to `geo-publish` so it doesn't re-discover. **Never hardcode IDs you haven't verified.**
- **"Are there duplicates of type X?"** → `list_entities({ type: "X", compact: true, limit: 200 })`, group by lowercased name, hand the dup groups to `geo-publish` (or `content-management/03_merge_duplicates.ts`) for merging.

## Output guidance

- Default to `compact: true` for searches with > ~20 results — the table fits in context.
- Drill in with `get_entity` only after the editor picks a specific result.
- For graph traversal, start with `direction: both` (the default) to learn the relation types, then re-query with `direction` and `relation_type` set.
- For "the full picture of an entity", do: `get_entity` + `get_related_entities` (both directions) — three calls, then summarise.

## Critical gotchas — quick reference

- **Don't pass `space` unless asked.** Same name often exists in many spaces; you will silently miss results.
- **Same type name in multiple spaces is normal.** "Bounty", "Person", "Project" exist in many spaces. Treat them as families, not singletons.
- **Edge id ≠ entity id.** When deleting a relation, you need the relation's `id` (the edge), not `toEntity.id`. Pull it from a Pattern C query.
- **Schemas drift.** Always discover via Pattern C before authoring a publish op.
- **Result limit is 50 by default.** Paginate with `offset` for large sets.
- **GraphQL is read-only.** Writes go through the SDK + smart-account wallet — see `geo-publish`.

## Hand-off to `geo-publish`

When the user's intent shifts from "tell me about X" to "change X", stop the query flow and hand to the publish skill. Pass:

- The **space ID** (or "personal" if writing to the user's personal space).
- The **entity ID(s)** involved.
- The **schema** discovered via Pattern C — paste it as `KNOWN IDs` so `geo-publish` doesn't re-discover.

The orchestrator skill (`geo-orchestrate`) handles this hand-off automatically when invoked from a higher-level intent.

## More

- `reference.md` — full GraphQL schema, MCP tool details, retry logic, pagination patterns.
- `examples/find-by-property.md` — filter by `Bounty Budget > 1000` end-to-end.
- `examples/discover-schema.md` — the full schema-discovery query annotated.
- `examples/find-duplicates.md` — sort by backlinks, group by name, output dup groups for `geo-publish`.
