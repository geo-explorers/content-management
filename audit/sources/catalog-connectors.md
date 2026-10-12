# Connectors & runtime catalog

Source: Notion data source `collection://8ba28b16-0d70-41a0-ad88-2a7add5250c8` (Connectors & runtime), read with `mcp__notion__notion-query-data-sources`, SQL mode: `SELECT * FROM "collection://8ba28b16-0d70-41a0-ad88-2a7add5250c8"`.
Rows retrieved: 8 (expected 8). has_more: false.
Availability counts: Available here 4, Requires setup 2, Optional 2.

| Name | Key | Availability | Used for | Access needed | Summary | Tags | Reviewed on | Skills (names) | Workflows (count) |
|---|---|---|---|---|---|---|---|---|---|
| Web research | web | Available here | Descriptions, fact verification and press review. | Access to the source material; some sources may require separate permission. | Read primary sources and compare external coverage. | Retrieval, Quality | 2026-09-16 | geo-describe; geo-discovery; geo-press-review | 30 |
| Shared repository or versioned folder | repository | Requires setup | Reproducible installations and reviewed updates. Destination remains a team decision. | A selected team destination with appropriate member permissions. | Distribute code, scripts, references and approved file revisions. | Maintenance | 2026-09-16 | Agent document revision sync | 10 |
| Geo GraphQL read client | graphql | Available here | Queries, completeness checks, fresh before-values and indexed verification. | Network access to the configured graph endpoint. | Retrieve space-scoped entities, values, relations and schema. | Retrieval | 2026-09-16 | geo-clean; geo-describe; geo-orchestrate; geo-query; geo-discovery; geo-press-review; ontology-advisor; geo-claim-grouping; geo-mirror; geo-publish; Conflict-aware Notion → Geo publisher; geo-mirror-and-group; geo-claim-grouping-notion | 95 |
| Image tools | images | Optional | Optional image-banner-recompose workflow. | Source image rights/access and an available generation or image-editing tool. | Generate or recompose banner images and verify their output. | Maintenance | 2026-09-16 | image-banner-recompose | 6 |
| Agent wakeup and coordination transport | scheduler | Optional | Optional transport for coordination. No schedule installed by this task. | Explicit schedule authorization and tested host-specific delivery. | Resume a designated agent to check actionable assigned work. | Coordination | 2026-09-16 | — | 0 |
| Notion connection | notion | Available here | Mirrors, shared catalog, editorial proposals and work records. | Own authenticated identity, workspace membership and page access. | Read and write permitted Agent flows pages and databases. | Mirroring, Coordination | 2026-09-16 | geo-mirror; daily-report; Agent coordination and handoff; Agent document revision sync; Conflict-aware Notion → Geo publisher; geo-mirror-and-group; notion-operations; geo-claim-grouping-notion | 81 |
| Local execution runtime | runtime | Available here | Read clients, validators, dry runs, snapshots and receipts. | Project filesystem and required Node/Python dependencies. | Run toolkit scripts and maintain local execution evidence. | Maintenance | 2026-09-16 | geo-clean; geo-describe; geo-orchestrate; geo-query; geo-discovery; geo-press-review; ontology-advisor; image-banner-recompose; geo-claim-grouping; geo-mirror; daily-report; geo-publish; Agent document revision sync; Conflict-aware Notion → Geo publisher; geo-mirror-and-group; notion-operations; geo-claim-grouping-notion | 94 |
| Geo SDK and signing wallet | wallet | Requires setup | Geo publication and destructive cleanup. No signing readiness test in this catalog task. | Compatible SDK, explicitly selected destination and securely configured signer. | Submit authorized operations and inspect governance state. | Publishing | 2026-09-16 | geo-clean; geo-orchestrate; geo-discovery; geo-claim-grouping; geo-publish; Conflict-aware Notion → Geo publisher | 42 |

## Workflows per connector (names)

### Web research — workflows (30)

- Understand claims and map debates
- Write original sourced descriptions
- Review press coverage against Geo
- Discover and diagnose content gaps
- Read content and neighborhood
- Ingest and classify sources
- Define topic and date scope
- Harvest scoped content stream
- Extract proposition commitments
- Extract factual statements
- Retrieve Geo coverage
- Extract entities and themes
- Assign relevant topics
- Verify accuracy
- Search external sources
- Diagnose gap type
- Assess support and contradiction
- Compose original description
- Verify each source story
- Score and route findings
- Map positions and participants
- Check originality and rules
- Match stories semantically
- Analyze emerging themes
- Draft new claims or wording
- Emit review package
- Rank recommendations
- Review and prepare publication
- Review borderline judgments
- Save proposals for controlled publication

### Shared repository or versioned folder — workflows (10)

- Maintain and distribute agent files
- Inventory relevant files
- Classify sharing scope
- Choose canonical source
- Create readable team document
- Attach dated source snapshot
- Link skills and workflow usage
- Compare revisions before update
- Install approved local revision
- Verify teammate access and refresh evidence

### Geo GraphQL read client — workflows (95)

- Query and inspect Geo
- Mirror Geo content to Notion
- Publish reviewed Notion changes to Geo
- Group related claims and assign brackets
- Understand claims and map debates
- Write original sourced descriptions
- Review press coverage against Geo
- Discover and diagnose content gaps
- Inspect and repair graph data
- Review results and maintain work evidence
- Resolve supplied identities
- Define mirror selection
- Select reviewed proposed fields
- Choose grouping scope
- Read content and neighborhood
- Ingest and classify sources
- Define topic and date scope
- Harvest scoped content stream
- Find exact-name duplicate candidates
- Check structural integrity
- Inspect live schema
- Retrieve complete source snapshot
- Resolve explicit write destinations
- Generate candidate pairs
- Extract proposition commitments
- Extract factual statements
- Retrieve Geo coverage
- Extract entities and themes
- Find semantic duplicate candidates
- Review semantic correctness
- Define time semantics
- Map graph fields to Notion
- Re-read current Geo values
- Read propositions and context
- Assign relevant topics
- Verify accuracy
- Search external sources
- Diagnose gap type
- Inspect missing types and blank values
- Triage reviewer findings
- Count scoped entities
- Read destination identity index
- Detect three-way conflicts
- Adjudicate every candidate
- Assess support and contradiction
- Compose original description
- Verify each source story
- Score and route findings
- Inspect stale and duplicate edges
- Apply authorized corrections
- Retrieve candidate identities
- Compare baseline and current values
- Check ontology and semantic duplicates
- Establish Related claim groups
- Map positions and participants
- Check originality and rules
- Match stories semantically
- Analyze emerging themes
- Inspect datatype mismatches
- Record outcome and remaining stages
- Paginate root results
- Create or resolve rows
- Validate types and relation identities
- Assign exact brackets
- Draft new claims or wording
- Emit review package
- Rank recommendations
- Review and prepare publication
- Select canonical identities
- Update reusable lessons
- Hydrate required values and edges
- Link relation endpoints
- Prepare concrete dry run
- Review graph effects
- Review borderline judgments
- Check protected and cross-space impact
- Reconstruct page ordering
- Configure editorial views
- Resolve applicable approval
- Dry-run and publish authorized relations
- Save proposals for controlled publication
- Prepare move or copy semantics
- Adjudicate semantic candidates
- Verify mirror fidelity
- Recheck freshness and ownership
- Prepare orphan or space deletion plan
- Save and report retrieval evidence
- Prove zero-change return path
- Submit permitted operations
- Dry-run guarded repairs
- Save baseline and refresh record
- Verify governance execution
- Publish and validate end state
- Verify indexed graph values
- Reconcile fulfilled mirror proposals

### Image tools — workflows (6)

- Recompose a Geo banner
- Inspect source image
- Choose recomposition strategy
- Generate banner composition
- Verify dimensions and visual quality
- Deliver usable image

### Agent wakeup and coordination transport — workflows (0)

_none_

### Notion connection — workflows (81)

- Start and resume a Geo task
- Mirror Geo content to Notion
- Publish reviewed Notion changes to Geo
- Understand claims and map debates
- Write original sourced descriptions
- Coordinate agents and dependent tasks
- Maintain and distribute agent files
- Review results and maintain work evidence
- Prepare an editor’s daily report
- Resolve objective and scope
- Define mirror selection
- Select reviewed proposed fields
- Read content and neighborhood
- Ingest and classify sources
- Identify overlapping work
- Inventory relevant files
- Check structural integrity
- Gather today’s work evidence
- Verify connection identity
- Retrieve complete source snapshot
- Resolve explicit write destinations
- Extract proposition commitments
- Extract factual statements
- Claim bounded writer ownership
- Classify sharing scope
- Review semantic correctness
- Distill progress statements
- Restore task context
- Map graph fields to Notion
- Re-read current Geo values
- Assign relevant topics
- Verify accuracy
- Share a source snapshot
- Choose canonical source
- Triage reviewer findings
- Collect activity outside captured sessions
- Select documents and skills
- Read destination identity index
- Detect three-way conflicts
- Assess support and contradiction
- Compose original description
- Check prerequisite completion
- Create readable team document
- Apply authorized corrections
- Confirm final report
- Establish write ownership
- Compare baseline and current values
- Check ontology and semantic duplicates
- Map positions and participants
- Check originality and rules
- Transfer a handoff package
- Attach dated source snapshot
- Record outcome and remaining stages
- File and verify the report
- Create execution manifest
- Create or resolve rows
- Validate types and relation identities
- Draft new claims or wording
- Emit review package
- Accept and revalidate handoff
- Link skills and workflow usage
- Update reusable lessons
- Link relation endpoints
- Prepare concrete dry run
- Review borderline judgments
- Recover interrupted ownership
- Compare revisions before update
- Configure editorial views
- Resolve applicable approval
- Save proposals for controlled publication
- Complete shared task record
- Install approved local revision
- Verify mirror fidelity
- Recheck freshness and ownership
- Verify teammate access and refresh evidence
- Prove zero-change return path
- Submit permitted operations
- Save baseline and refresh record
- Verify governance execution
- Verify indexed graph values
- Reconcile fulfilled mirror proposals

### Local execution runtime — workflows (94)

- Start and resume a Geo task
- Query and inspect Geo
- Mirror Geo content to Notion
- Publish reviewed Notion changes to Geo
- Group related claims and assign brackets
- Review press coverage against Geo
- Discover and diagnose content gaps
- Inspect and repair graph data
- Maintain and distribute agent files
- Review results and maintain work evidence
- Prepare an editor’s daily report
- Recompose a Geo banner
- Resolve objective and scope
- Resolve supplied identities
- Define mirror selection
- Select reviewed proposed fields
- Choose grouping scope
- Define topic and date scope
- Harvest scoped content stream
- Find exact-name duplicate candidates
- Inventory relevant files
- Check structural integrity
- Gather today’s work evidence
- Inspect source image
- Verify connection identity
- Inspect live schema
- Retrieve complete source snapshot
- Resolve explicit write destinations
- Generate candidate pairs
- Retrieve Geo coverage
- Extract entities and themes
- Find semantic duplicate candidates
- Classify sharing scope
- Review semantic correctness
- Distill progress statements
- Choose recomposition strategy
- Restore task context
- Define time semantics
- Map graph fields to Notion
- Re-read current Geo values
- Read propositions and context
- Search external sources
- Diagnose gap type
- Inspect missing types and blank values
- Choose canonical source
- Triage reviewer findings
- Collect activity outside captured sessions
- Generate banner composition
- Select documents and skills
- Count scoped entities
- Read destination identity index
- Detect three-way conflicts
- Adjudicate every candidate
- Verify each source story
- Score and route findings
- Inspect stale and duplicate edges
- Create readable team document
- Apply authorized corrections
- Confirm final report
- Verify dimensions and visual quality
- Establish write ownership
- Retrieve candidate identities
- Compare baseline and current values
- Check ontology and semantic duplicates
- Establish Related claim groups
- Match stories semantically
- Analyze emerging themes
- Inspect datatype mismatches
- Attach dated source snapshot
- Record outcome and remaining stages
- File and verify the report
- Deliver usable image
- Create execution manifest
- Paginate root results
- Create or resolve rows
- Validate types and relation identities
- Assign exact brackets
- Rank recommendations
- Review and prepare publication
- Select canonical identities
- Link skills and workflow usage
- Update reusable lessons
- Hydrate required values and edges
- Link relation endpoints
- Prepare concrete dry run
- Review graph effects
- Review borderline judgments
- Check protected and cross-space impact
- Dry-run guarded repairs
- Save baseline and refresh record
- Verify governance execution
- Publish and validate end state
- Verify indexed graph values
- Reconcile fulfilled mirror proposals

### Geo SDK and signing wallet — workflows (42)

- Publish reviewed Notion changes to Geo
- Group related claims and assign brackets
- Discover and diagnose content gaps
- Inspect and repair graph data
- Select reviewed proposed fields
- Choose grouping scope
- Harvest scoped content stream
- Find exact-name duplicate candidates
- Resolve explicit write destinations
- Generate candidate pairs
- Extract entities and themes
- Find semantic duplicate candidates
- Re-read current Geo values
- Read propositions and context
- Diagnose gap type
- Inspect missing types and blank values
- Detect three-way conflicts
- Adjudicate every candidate
- Score and route findings
- Inspect stale and duplicate edges
- Check ontology and semantic duplicates
- Establish Related claim groups
- Analyze emerging themes
- Inspect datatype mismatches
- Validate types and relation identities
- Assign exact brackets
- Review and prepare publication
- Select canonical identities
- Prepare concrete dry run
- Review graph effects
- Check protected and cross-space impact
- Resolve applicable approval
- Dry-run and publish authorized relations
- Prepare move or copy semantics
- Recheck freshness and ownership
- Prepare orphan or space deletion plan
- Submit permitted operations
- Dry-run guarded repairs
- Verify governance execution
- Publish and validate end state
- Verify indexed graph values
- Reconcile fulfilled mirror proposals
