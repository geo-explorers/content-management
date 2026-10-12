# External best practices for the claim-tagging agent

Researched 2026-10-09. Each item: **practice** -> *why (evidence)* -> source -> **Here** (how it applies). Source kinds: [P] peer-reviewed, [V] vendor docs or engineering blog, [R] arXiv preprint, not yet peer-reviewed. Where a finding rests on a search summary I could not open in full, it says so. Items marked "inference" are my reading, not a source's claim.

## 1. LLM-as-judge and multi-label reliability

**1.1 Judge each tag as its own binary question, with a written rubric.**
*Why:* LLMs do not select a label set holistically. They emit labels one at a time and suppress all but one per step, so the first-step distribution is a poor guide to the final set [P]. Splitting into one yes/no query per label, with prefix caching, is reported to cut cost without accuracy loss (abstract only; short texts; no head-to-head table seen) [R]. Anthropic: "grade each dimension with an isolated LLM-as-judge" [V].
Src: https://aclanthology.org/2025.emnlp-main.126/ ; https://arxiv.org/abs/2511.03830 ; https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
**Here:** 13 small calls per claim over a shared prefix (claim + fetched source first, tag rubric last) so cache reads apply. Run both designs on the gold set before committing.

**1.2 Give the judge an explicit exit: a third verdict "cannot tell".**
*Why:* Anthropic's guidance is to give explicit permission to say "I don't know", and to give graders an "Unknown" option; both reduce fabricated judgments [V]. A TACL 2025 survey frames abstention around the query, the model and human values [P].
Src: https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations ; https://aclanthology.org/2025.tacl-1.26
**Here:** per-tag verdict in {yes, no, cannot_tell}, separate from the 0-1 confidence. `cannot_tell` always routes to the editor queue.

**1.3 Treat verbalized confidence as a rank, recalibrate it, and add sampling agreement for borderline tags.**
*Why:* Black-box verbalized confidence is overconfident. Human-inspired prompts, multi-sample consistency and better aggregation reduce this, but no single method wins and all struggle on knowledge-heavy tasks; white-box methods are only slightly better [P]. For RLHF chat models, verbalized confidence often beat token probabilities, with roughly 50% relative ECE reduction, on factual-recall QA only [P]. Self-consistency (majority vote over samples) lifts accuracy [P]. Post-hoc Platt or isotonic maps on a labeled calibration set are standard; papers I found were single-label, not multi-label (search summary).
Src: https://arxiv.org/abs/2306.13063 ; https://arxiv.org/abs/2305.14975 ; https://arxiv.org/abs/2203.11171
**Here:** emit confidence, but sample k=3-5 only for tags whose first answer is mid-range. Fit one pooled calibrator per tag family on the gold set first; per-tag only where positives are plentiful (inference). Report ECE, Brier and AUROC together; ECE alone can look good while resolution collapses (search summary).

**1.4 Randomize option and criteria order; do not trust raw agreement.**
*Why:* Rubric scoring behaves like multiple choice and shows position bias in score-option order; direction varies by model; scoring several criteria in one prompt adds a criteria-order effect; a few random permutations are enough to reduce it [R, EMNLP Findings 2026 per arXiv page]. Judges show position, verbosity and self-enhancement bias, yet reach >80% agreement with humans [P]. Percent agreement hides disagreement; use chance-corrected metrics [P].
Src: https://arxiv.org/abs/2602.02219 ; https://arxiv.org/abs/2306.05685 ; https://arxiv.org/html/2406.12624
**Here:** per-tag prompts remove criteria-order effects. For the yes/no/cannot_tell options, randomize order across the k samples.

**1.5 Constrain output shape, not reasoning.**
*Why:* Format restrictions can degrade reasoning, more so the stricter they are [P]. Anthropic structured outputs guarantee valid JSON but do not support numeric min/max in schemas, may truncate at max_tokens, and may refuse when a field asks for step-by-step reasoning ("ask for a short explanation instead") [V]. Citations cannot be combined with structured outputs (HTTP 400) [V].
Src: https://arxiv.org/html/2408.02442v1 ; https://platform.claude.com/docs/en/build-with-claude/structured-outputs ; https://platform.claude.com/docs/en/build-with-claude/citations
**Here:** two steps: free-text quote extraction and short reasoning, then a schema-constrained verdict. Validate confidence in [0,1] and stop_reason in code.

## 2. Fact-checking and claim-verification pipelines

**2.1 Keep the stages separate and logged: claim detection -> evidence retrieval -> verification (verdict + justification).**
*Why:* The standard NLP decomposition; retrieval and verification are often fused, which hides which stage failed [P].
Src: https://aclanthology.org/2022.tacl-1.11/
**Here:** store per-claim stage status (source resolved, fetched, quotes found, tags judged). An error is attributable to one stage.

**2.2 Use a real "not enough information" outcome, and never infer it from a failed fetch.**
*Why:* FEVER labels Supported / Refuted / NotEnoughInfo; three-way human agreement was only Fleiss kappa 0.68, and no evidence is recorded for NEI [P]. Web sources vanish: 38% of 2013 pages and 8% of 2023 pages were gone by Oct 2023; 54% of Wikipedia pages carry at least one dead reference link [V, Pew].
Src: https://aclanthology.org/N18-1074/ ; https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/
**Here:** `fetch_failed` / `paywalled` / `unreadable` are statuses, not tags. "Unsourced" and "Improperly sourced" require a successfully read source (or a truly empty source field). Offer an archive-lookup retry before escalating.

**2.3 Require verbatim evidence quotes and verify them mechanically.**
*Why:* The AIS framework asks whether a statement is attributable to an identified source, judged by humans with released guidelines [P]. Anthropic: extract word-for-word quotes first, and retract any claim with no supporting quote; the Citations feature returns exact passages and does not bill `cited_text` as output [V]. Quote-matching is not enough: up to 57% of RAG citations were unfaithful (post-rationalization), under an adversarial test setup [R].
Src: https://arxiv.org/abs/2112.12870 ; https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations ; https://arxiv.org/abs/2412.18004
**Here:** every issue-tag proposal carries URL + quote; code rejects it unless the quote is a substring of the fetched text. Spot-check faithfulness by editors on a sample.

**2.4 Reuse the literature's definitions for your classification tags.**
*Why:* Atomic-fact decomposition (SAFE: split, search each fact, rate) [P]; Claimify extracts claims only when the interpretation is confidently resolvable, and ships 6,490 sentences labeled for "contains a verifiable factual claim" [P]; decontextualization is the task of rewriting a sentence so it stands alone [P].
Src: https://nips.cc/virtual/2024/poster/96675 ; https://arxiv.org/abs/2502.10855 ; https://arxiv.org/abs/2102.05169
**Here:** these map to Single-vs-Multiple statements, Factual-vs-Opinion and Self-contained-vs-Context-dependent. Cite them in the rubric; use the Claimify set as an external sanity check.

**2.5 Separate "the source supports the claim" from "the claim is true".**
*Why:* Retrieval-augmented fact-checking is weak when evidence conflicts by source credibility; adding publisher background helps [P]. Small grounded checkers (MiniCheck, 770M) match GPT-4 accuracy on grounding at about 400x lower cost [P].
Src: https://arxiv.org/abs/2505.17762 ; https://arxiv.org/abs/2404.10774
**Here:** "Improperly sourced" is judged against the attached source. "Factually challenged" needs independent contradicting evidence, not memory. A claim can be well sourced and still challenged. Consider a cheap grounding checker as pre-screen.

## 3. Evaluation

**3.1 Build the gold set from real cases and keep it alive.**
*Why:* Start with 20-50 tasks drawn from real failures; calibrate model graders against humans; read transcripts; "owning and iterating on evaluations should be as routine as maintaining unit tests" [V].
Src: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
**Here:** 300-500 claims, stratified so each tag has enough positives, double-labeled by editors; every editor correction later becomes a gold or regression case.

**3.2 Size each tag's sample for its own precision and recall, with Wilson intervals.**
*Why:* Wilson beats Wald and Clopper-Pearson on coverage, with no overshoot [R]. Recall's n is the number of true positives; precision's n is the number of predicted positives; oversampling model-predicted positives narrows precision intervals [P]. My computation (95% Wilson half-width): p=0.8 needs n=60 / 125 / 245 for +-0.10 / 0.07 / 0.05; p=0.9 needs 34 / 72 / 141. A random 300 at 10% prevalence yields ~30 positives, so 24/30 recall gives [0.63, 0.91].
Src: https://arxiv.org/abs/2309.14621 ; https://proceedings.mlr.press/v206/shang23a.html
**Here:** size by the rarest tag. For rare tags, add targeted samples (predicted positives) rather than more random claims. Report intervals; do not call two prompt versions different if intervals overlap.

**3.3 Measure human-human agreement first, with chance-corrected metrics.**
*Why:* Percent agreement misleads; use kappa or Krippendorff's alpha [P]. Common convention: alpha >= 0.80 reliable, 0.667-0.80 tentative (secondary sources). Criteria drift: people refine criteria only by grading real outputs, so rubrics must be revised iteratively [P].
Src: https://arxiv.org/html/2406.12624 ; https://arxiv.org/abs/2404.12272 ; https://www.cl.cam.ac.uk/teaching/1516/R216/Artstein.pdf
**Here:** have two editors label a 100-claim overlap. A tag with weak human agreement needs a sharper definition before any model score is meaningful. Kappa falls under skewed prevalence; also report raw positive agreement (general caveat).

**3.4 Pin everything that can drift and re-run the frozen set on every change.**
*Why:* Model-based graders are non-deterministic and need ongoing calibration; saturated evals stop signalling [V]. Practitioner guidance (blogs, lower weight): pin model snapshot + prompt + rubric versions, run the golden set as a release gate, sample production for audit.
Src: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
**Here:** write model id, rubric version and skill hash into every proposal row so any score can be traced to a configuration.

**3.5 Use corrections as eval data first; treat auto-learning as optional.**
*Why:* Evidence is mixed. Confidence-gated routing reports large human-effort savings (45-96%, secondary summaries), but active learning sometimes gives no gain and can hurt (search summary; not independently verified).
**Here:** feed corrections into the gold/regression set and rubric/few-shot examples. No automatic retraining in the MVP.

## 4. Human-in-the-loop review in tables

**4.1 Separate proposed from verified columns; make correction one step.**
*Why:* Microsoft's 18 human-AI guidelines include "make clear how well the system can do what it can do" and "support efficient correction" [P, CHI 2019]. (I could not open the guideline text; the blog page only summarizes.)
Src: https://www.microsoft.com/en-us/research/blog/guidelines-for-human-ai-interaction/
**Here:** AI writes only to `AI proposed tags`, `AI confidence`, `AI notes`. Editors write `Verified tags`. The agent never touches the verified column.

**4.2 Show confidence, but expect limited gain.**
*Why:* Confidence scores calibrate trust, but calibration alone does not improve joint decisions [P].
Src: https://arxiv.org/abs/2001.02114
**Here:** show calibrated bands (High / Medium / Low / Cannot tell), not raw 0.87. Sort the review view by band.

**4.3 Explanations increase acceptance whether or not the AI is right.**
*Why:* In user studies, explanations raised acceptance of AI advice regardless of correctness [P]. Cognitive forcing functions reduced overreliance but cut satisfaction [P].
Src: https://arxiv.org/abs/2006.14779 ; https://arxiv.org/abs/2102.09692
**Here:** notes are evidence (quote + URL + one line), not persuasive prose. Add a blind audit slice where proposals are hidden, to measure automation bias (inference).

**4.4 Triage by confidence, but audit the high-confidence tail.**
*Why:* Confidence routing saves effort, but a model can be highly confident while near chance on a task, and routing can omit rare or ambiguous cases (search summaries).
**Here:** MVP proposals all need confirmation anyway. Review order: Cannot tell, Low, then Medium. Randomly sample High to check calibration.

## 5. Agent architecture

**5.1 Prefer a fixed workflow to an agent when the steps are known.**
*Why:* Anthropic: "the simplest solution possible", add complexity only when needed. Orchestrator-workers suits tasks whose subtasks "can't be predicted"; parallelization via sectioning or voting suits known independent parts [V].
Src: https://www.anthropic.com/engineering/building-effective-agents
**Here:** per-claim steps are known: resolve, fetch, extract, judge 13 tags. Use a deterministic script loop with LLM calls inside, not an LLM orchestrator.

**5.2 Use subagents for context isolation and breadth, not by default.**
*Why:* Multi-agent beat single-agent Opus by 90.2% on a breadth-first internal eval, but used ~15x chat tokens; token usage alone explained 80% of variance on BrowseComp; poor fit for shared-context or dependent work [V]. Subagents work with clean context and return condensed summaries (often 1-2k tokens) [V].
Src: https://www.anthropic.com/engineering/multi-agent-research-system ; https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
**Here:** a fresh-context worker per claim (or per source) for fetch + quote extraction is justified: it bounds page size and isolates untrusted text. Return only a structured result.

**5.3 Make the batch idempotent and resumable.**
*Why:* Long-running agents persist state in a progress file plus git history, use a JSON feature list where agents only flip a status field, and do one item at a time [V]. Message Batches: 50% cheaper, up to 100,000 requests / 256 MB, most done within 1 hour, 24h expiry, results kept 29 days, matched by `custom_id`, expired requests not billed [V]. Notion API: ~3 req/s on most plans; honor `Retry-After`; on a 503 write check `committed_resource_id` before retrying [V].
Src: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents ; https://platform.claude.com/docs/en/build-with-claude/batch-processing ; https://developers.notion.com/reference/request-limits
**Here:** a local ledger keyed by (claim page id, claim-text hash, source-url hash, rubric version, model). Skip done keys; check-before-write on Notion; throttle writes.

**5.4 Control cost structurally.**
*Why:* Cache reads cost 0.05-0.1x base input depending on model; the batch discount stacks with the cache multipliers [V].
Src: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
**Here:** fetch each URL once and cache by URL hash; use a cheap model for fetch/summarize and escalate only borderline tags; use batches for the 2,000-claim bulk run.

**5.5 Assume injection cannot be fully prevented; limit blast radius.**
*Why:* OWASP: unclear that fool-proof prevention exists; mitigations are least privilege, deterministic output validation, labeling untrusted content, adversarial testing [V]. Anthropic: injection "is far from a solved problem", even at ~1% attack success after layered defenses [V]. Willison's "lethal trifecta": private data + untrusted content + external communication [V]. Design patterns (action-selector, plan-then-execute, map-reduce, dual LLM, code-then-execute, context-minimization): application-specific agents can be secured; general ones cannot yet [R].
Src: https://genai.owasp.org/llmrisk/llm01-prompt-injection/ ; https://www.anthropic.com/research/prompt-injection-defenses ; https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/ ; https://arxiv.org/abs/2506.08837
**Here:** the page-reading worker has no Notion write, shell or other outbound tools. Its output is an enum-and-quote schema checked by code. Only the script writes, and only to proposal columns. Flag pages that address the AI.

## 6. Repository structure and instruction supply chain

**6.1 Monorepo vs separate repos: no study decides this for a small team.**
*Why:* Monorepos give atomic changes and unified versioning but need tooling and discipline [P, Google]. Claude Code distributes plugins from a relative path, a whole repo, or a `git-subdir` of a monorepo, each pinnable by `ref` and `sha` [V].
Src: https://research.google/pubs/why-google-stores-billions-of-lines-of-code-in-a-single-repository/ ; https://code.claude.com/docs/en/plugins/marketplace-reference
**Here (inference):** the mechanics support either layout. Decide on change cadence: safeguard skills change rarely and need review; agents change often. Keep the agent in its own directory with an explicit pinned dependency on skills, so it can move to its own repo or a managed deployment later.

**6.2 Pin instruction libraries to immutable references.**
*Why:* GitHub: a full commit SHA is the only immutable reference; tags can be moved; verify the SHA is from the real repo, not a fork [V]. Claude Code plugin sources accept a 40-character `sha`, and `archive` sources a `sha256` that must match [V].
Src: https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions ; https://code.claude.com/docs/en/plugins/marketplace-reference
**Here:** this repo's self-heal fetches `main.tar.gz` and checks only frontmatter, which is a floating dependency. Prefer a recorded commit SHA plus a committed sha256 manifest of SKILL.md and scripts, updated through reviewed diffs.

**6.3 Treat skills and prompts as executable supply chain.**
*Why:* Of 31,132 analysed public skills, 26.1% had at least one vulnerability, and script-bundling skills were 2.12x more likely to; another study found 157 confirmed malicious skills out of 98,380 [R, USENIX Security 2026]. Anthropic: use only trusted skills; skills that fetch external URLs are risky because "dependencies change over time" [V]. OWASP lists supply chain as LLM03 [V].
Src: https://arxiv.org/abs/2601.10338 ; https://arxiv.org/abs/2602.06547 ; https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
**Here:** forbid runtime self-update from a URL inside the agent run; update only in a separate reviewed step; diff SKILL.md as well as code.

**6.4 Verify what you received against what you expected.**
*Why:* SLSA's purpose is that consumers "be sure that what you receive is what you expected", through tamper-evident provenance [V].
Src: https://slsa.dev/spec/v1.0/about
**Here:** at agent start, hash the skill files and compare to the manifest; refuse to run on mismatch. Record the manifest version in each output row.

## Caveats

- Several 2026 preprints are cited; none was peer-reviewed at fetch time.
- Items 3.4, 3.5 and 4.4 rest partly on practitioner blogs and search summaries; weight them lower.
- No source I found evaluates the whole design (13-tag, per-tag confidence, Notion review). Run the pilot, and let the gold-set numbers settle the open choices (per-tag vs joint prompts, calibrator form, k samples).
