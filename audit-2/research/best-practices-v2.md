# Best practices v2: repository split and the source-support QA agent

Researched 2026-10-11. This replaces `special-agent/audit/best-practices.md` (v1) as the evidence base for the team-meeting document. It supports decisions D1 to D10 in `02-decisions.md`.

How to read it: each row is one practice we adopt, why it fits our situation, and the source. Every URL below was opened successfully on 2026-10-11. Source kinds: [P] peer-reviewed, [R] preprint (not peer-reviewed), [V] vendor or engineering documentation. "Inference" means our own reading, not the source's claim.

Team facts that override the literature where they conflict:
- Geo claims are LLM-written paraphrases of their sources, so the wording almost never matches. Support has to be judged by meaning. Verbatim-quote or substring gates are out (D7).
- Tagging is increment 2 and is not in scope here (D1). Increment 1 gives one verdict per claim: Supported, Partially supported, Not supported or Cannot check, plus a 0 to 1 confidence and a short note (D7).
- The default runtime is local Claude Code on the subscription, with subagents for the judge step (D9).

## A. Moving a live codebase without blocking work (supports D3, D4, D6, D10)

| Practice we adopt | Why it applies here | Source |
|---|---|---|
| Build the agents repo beside the current one and move one agent at a time. The old location keeps working until each move is verified. | Editors use the skills every day, so a big-bang cutover would stop publishing. Moving in small steps lowers the risk. | [V] Martin Fowler, "Strangler Fig" (2024): https://martinfowler.com/bliki/StranglerFigApplication.html ; [V] Microsoft, "Strangler Fig pattern": https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig |
| Move each path, script or skill in three steps: add the new location, move every user over, then delete the old one. | Agents and docs point at current skill paths. The final delete is the step teams skip, which leaves two copies. | [V] Danilo Sato, "Parallel Change" (martinfowler.com): https://martinfowler.com/bliki/ParallelChange.html |
| Put one stable seam (a pinned skills manifest) between agents and the skills, then change what sits behind it. | Agents can switch from in-repo skills to vendored skills without being edited, and the code stays releasable throughout. | [V] Martin Fowler, "Branch by Abstraction": https://martinfowler.com/bliki/BranchByAbstraction.html |
| Before anything moves, protect `main` in both repos with required status checks (including the integrity check) and required reviews. | This is D6's "fence first". Nothing reaches `main` without a passing check, so the move cannot quietly break safeguards. | [V] GitHub Docs, "About protected branches": https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches |
| No feature freeze and no long-lived migration branch. Merge small migration steps into `main` often and keep `main` green. | Content work keeps going during the split. A long branch would end in one large, risky merge. | [V] Martin Fowler, "Patterns for Managing Source Code Branches": https://martinfowler.com/articles/branching-patterns.html |
| If a half-moved agent must ship, hide it behind a switch and remove the switch soon after. | Unfinished work can be merged without being used, but every switch left in place adds testing burden. | [V] Pete Hodgson, "Feature Toggles" (martinfowler.com): https://martinfowler.com/articles/feature-toggles.html |

## B. Repository layout and pinning dependencies (supports D3, D4, D5, D6)

| Practice we adopt | Why it applies here | Source |
|---|---|---|
| Keep all agents in one agents repo for visibility, one-step changes across agents, and shared dependencies (D4). | At Google, engineers reported codebase visibility and central dependency management as the monorepo's main benefits. One shared CI fits a small team. | [P] Potvin and Levenberg, "Why Google Stores Billions of Lines of Code in a Single Repository" (CACM 2016): https://research.google/pubs/why-google-stores-billions-of-lines-of-code-in-a-single-repository/ ; [P] Jaspan et al. (ICSE SEIP 2018): https://research.google/pubs/advantages-and-disadvantages-of-a-monolithic-codebase/ |
| Keep the safeguard skills in their own repo. Split an agent out only when it needs a separate owner or release cadence. | The same study credits separate repos with access control, stability and toolchain freedom. Safeguard skills change rarely and need strict review. | [P] Jaspan et al., "Advantages and Disadvantages of a Monolithic Codebase" (ICSE SEIP 2018): https://research.google/pubs/advantages-and-disadvantages-of-a-monolithic-codebase/ |
| Bring skills into the agents repo as a vendored copy of a tagged release. Record which release it came from. Do not use git submodules. | Vendored files are ordinary files, so a non-engineer updates them in a normal PR. Submodules arrive empty unless initialised, and work done inside them can be lost (detached HEAD). | [V] Pro Git, "Git Tools - Submodules": https://git-scm.com/book/en/v2/Git-Tools-Submodules ; [V] GitHub Docs, "About Git subtree merges": https://docs.github.com/en/get-started/using-git/about-git-subtree-merges ; [V] Go Modules Reference, "Vendoring": https://go.dev/ref/mod#vendoring |
| Treat a skills bump as a planned, reviewed event. Do not let the pinned copy float silently. | Pinning trades freshness for stability, and dependency changes break users in ways nobody predicted. Bumps should be deliberate and tested. | [V] Titus Winters, "Dependency Management", Software Engineering at Google, ch. 21: https://abseil.io/resources/swe-book/html/ch21.html |
| Pin to a full commit hash (a tag can be moved), and check that the commit comes from the official repo, not a fork. | Today the self-heal step downloads the moving `main` archive. A tag or branch pin can change under us. | [V] GitHub Docs, "Secure use reference" (Actions hardening): https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions |
| At start, check the skill files against a committed hash manifest and refuse to run on a mismatch. Treat skills as installed software. | Consumers should confirm they got what they expected, from the expected source. A tampered or stale SKILL.md can steer tools. | [V] SLSA, "About SLSA": https://slsa.dev/spec/v1.0/about ; [V] SLSA, "Verifying artifacts": https://slsa.dev/spec/v1.0/verifying-artifacts ; [V] Anthropic, "Agent Skills" overview, security section: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview |
| Consider shipping skills as a Claude Code plugin marketplace, pinned by tag plus commit hash and registered in the agents repo's project settings. | Plugin sources accept a ref and a 40-character commit. Users only receive changes when the version changes, so a release is an explicit step. | [V] Claude Code Docs, "Marketplace reference": https://code.claude.com/docs/en/plugins/marketplace-reference ; [V] "Host and maintain a marketplace": https://code.claude.com/docs/en/plugins/host-marketplace |

## C. Checking whether sources support a claim, with an LLM judge (supports D7)

| Practice we adopt | Why it applies here | Source |
|---|---|---|
| Use four verdicts: Supported, Partially supported, Not supported, Cannot check. These follow the standard Supported / Refuted / Not-enough-info labels. | FEVER uses three labels. AVeriTeC adds a fourth, "conflicting evidence / cherry-picking", for misleading claims. Prior attribution work grades full, partial or no support. | [P] Thorne et al., "FEVER" (NAACL 2018): https://aclanthology.org/N18-1074/ ; [P] Schlichtkrull et al., "AVeriTeC" (NeurIPS 2023 D&B): https://arxiv.org/abs/2305.13117 |
| Say "the sources do not support this claim", never "this claim is false". Judge only from the attached sources, not from model memory. | AVeriTeC tells annotators to use "not enough evidence" when support is missing, not "refuted". AttrScore keeps "lacks information" separate from "contradicts". | [P] AVeriTeC guidelines (appendix): https://arxiv.org/abs/2305.13117 ; [P] Yue et al., "Automatic Evaluation of Attribution by LLMs" (EMNLP Findings 2023): https://arxiv.org/abs/2305.06311 ; [V] Anthropic, "Reduce hallucinations": https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations |
| Frame the check as entailment: the source text is the premise and the claim is the hypothesis. For long sources, judge passage by passage, then combine. | Our task is inference over meaning, not string matching. NLI-style checkers performed strongly on consistency benchmarks, once the source is split to a usable granularity. | [P] Honovich et al., "TRUE" (NAACL 2022): https://arxiv.org/abs/2204.04991 ; [P] Laban et al., "SummaC" (TACL 2022): https://aclanthology.org/2022.tacl-1.10/ |
| Test on cases where shared words mislead: close paraphrases that are unsupported, and reworded claims that are supported. | Models over-trust word overlap. GPT-4 marked a near-match salary figure as supported. Dropping verbatim gates makes this blind spot matter more. | [P] McCoy et al., "Right for the Wrong Reasons" (ACL 2019): https://aclanthology.org/P19-1334/ ; [P] Yue et al. (qualitative errors): https://arxiv.org/abs/2305.06311 |
| Give the judge a written rubric with an example for each verdict, check it against human labels, and read its reasoning notes. | Vague rubrics produce inconsistent judgments. Strong judges reach about 80% agreement with humans, but only after calibration against expert labels. | [V] Anthropic, "Demystifying evals for AI agents": https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents ; [P] Zheng et al., "Judging LLM-as-a-Judge" (NeurIPS 2023 D&B): https://arxiv.org/abs/2306.05685 |
| Make "Cannot check" an explicit, legitimate answer, for unreadable, paywalled or missing sources and for too little information. Always route it to an editor. | Explicit permission to say "I don't know" reduces made-up verdicts. A failed fetch must never become "Not supported". | [V] Anthropic, "Reduce hallucinations": https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations ; [P] Wen et al., "Know Your Limits" (TACL 2025): https://aclanthology.org/2025.tacl-1.26/ ; [V] Pew, "When Online Content Disappears": https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/ |
| Use the stated confidence to rank claims, not as a probability. Recalibrate it on the gold set, and re-sample borderline claims to check consistency. | Stated confidence is overconfident, and no single fix wins. For RLHF models it still beats token probabilities. Agreement across samples is a cheap extra signal. | [P] Xiong et al. (ICLR 2024): https://arxiv.org/abs/2306.13063 ; [P] Tian et al. (EMNLP 2023): https://arxiv.org/abs/2305.14975 |
| Let the judge reason freely, then emit the verdict in a strict schema. Check range and stop reason in code. | Strict formats can degrade reasoning. Structured outputs guarantee shape, not correctness, and cannot enforce numeric min/max. | [R] "Let Me Speak Freely?" (arXiv 2024): https://arxiv.org/abs/2408.02442 ; [V] Anthropic, "Structured outputs": https://platform.claude.com/docs/en/build-with-claude/structured-outputs |
| Shuffle the order of multiple sources and of verdict options across samples. Watch whether long sources or long notes skew verdicts. | LLM judges show position, verbosity and length biases. Averaging over orderings reduces position effects. | [P] Zheng et al.: https://arxiv.org/abs/2306.05685 ; [R] "Large Language Models are not Fair Evaluators" (arXiv 2023): https://arxiv.org/abs/2305.17926 ; [P] "Length-Controlled AlpacaEval" (COLM 2024): https://arxiv.org/abs/2404.04475 |

Footnote, what "attributable" means: AIS (Attributable to Identified Sources) is a human-evaluation framework for whether a generated statement can be traced to, and is supported by, an identified source. We use AIS only for that definition, not as a quote-matching gate. Rashkin et al. [R]: https://arxiv.org/abs/2112.12870

## D. Human review in the Notion claims table (supports D7)

| Practice we adopt | Why it applies here | Source |
|---|---|---|
| The agent writes only to "AI verdict / AI confidence / AI note" columns. Editors own a separate "Verified verdict" column. Correcting takes one click. | Users should be shown how well the system performs and be able to correct it quickly. The AI must never overwrite a human decision. | [P] Amershi et al., Guidelines for Human-AI Interaction (CHI 2019), G2 and G9: https://www.microsoft.com/en-us/haxtoolkit/library/ ; https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/ |
| Keep notes short and evidential. Each week, run a blind audit sample where editors judge without seeing the AI verdict. | Explanations raise acceptance of AI advice whether or not it is right. Forcing independent judgment reduces over-reliance. | [P] Bansal et al. (CHI 2021): https://arxiv.org/abs/2006.14779 ; [R] Bucinca et al., "To Trust or to Think": https://arxiv.org/abs/2102.09692 |
| Before blaming the model, have two editors label the same claims and measure chance-corrected agreement (kappa or alpha), reporting raw agreement too. | If editors disagree on what "Partially supported" means, model scores are meaningless. When most items share one label, raw agreement inflates. | [P] Artstein and Poesio, "Inter-Coder Agreement for Computational Linguistics" (CL 2008): https://aclanthology.org/J08-4004/ ; [R] "Judging the Judges" (arXiv): https://arxiv.org/html/2406.12624 |
| Report gold-set accuracy per verdict with Wilson intervals. Do not call two prompt versions different when their intervals overlap. | Our gold set is small (tens to low hundreds of claims), and the simple Wald interval behaves erratically at those sizes. | [P] Brown, Cai and DasGupta, "Interval Estimation for a Binomial Proportion" (Statistical Science 2001): https://projecteuclid.org/journals/statistical-science/volume-16/issue-2/Interval-Estimation-for-a-Binomial-Proportion/10.1214/ss/1009213286.full |

## E. Agent architecture (carried over from v1, links re-checked)

| Practice we adopt | Why it applies here | Source |
|---|---|---|
| Run a fixed workflow (load claim, fetch sources, judge, write row), not a free-roaming agent. | The steps are known in advance. Anthropic advises the simplest solution and keeps agents for open-ended work. | [V] Anthropic, "Building effective agents": https://www.anthropic.com/engineering/building-effective-agents |
| Use one fresh subagent per claim for fetch-and-judge, and return only the structured verdict (D9). | Each source page stays in its own context. Multi-agent setups use about 15x the tokens, so use them only for isolation. | [V] Anthropic, "How we built our multi-agent research system": https://www.anthropic.com/engineering/multi-agent-research-system ; [V] Claude Code Docs, "Subagents": https://code.claude.com/docs/en/sub-agents |
| Make runs resumable: keep a progress ledger keyed by claim and source, skip claims already done, and handle one claim at a time. | Runs get interrupted. Notion asks clients to honour Retry-After, and to check whether a write was saved before retrying it. | [V] Anthropic, "Effective harnesses for long-running agents": https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents ; [V] Notion, "Request limits": https://developers.notion.com/reference/request-limits |
| Treat fetched source text as data. Label it as untrusted, validate the output in code, and flag pages that address the AI. | Sources are arbitrary web pages. Injection is "far from a solved problem", and fool-proof prevention may not exist. | [V] OWASP, "LLM01 Prompt Injection": https://genai.owasp.org/llmrisk/llm01-prompt-injection/ ; [V] Anthropic, "Mitigating the risk of prompt injections in browser use": https://www.anthropic.com/research/prompt-injection-defenses |
| Least privilege: the judge subagent gets read and fetch tools only, with no Notion writes. Only the runner writes, and only to AI columns. | Deny rules override allow rules, and subagent tool lists are allowlists. This contains damage if an injected page steers the judge. | [V] Claude Code Docs, "Configure permissions": https://code.claude.com/docs/en/permissions ; [V] "Subagents": https://code.claude.com/docs/en/sub-agents |

## Carried over / dropped / reworded from v1

- **1.1** Per-tag binary judging: dropped from v2. It returns with tagging in increment 2 (D1).
- **1.2** Explicit "cannot tell": carried, reworded as the verdict "Cannot check" (C6).
- **1.3** Verbalized confidence: carried as C7. It is now one confidence per claim, not per tag.
- **1.4** Order randomization: carried and widened to source order and length bias (C9).
- **1.5** Shape vs reasoning: carried (C8). The v1 two-step "quote extraction, then verdict" becomes "free reasoning, then schema verdict", with no quote step.
- **2.1** Separate logged stages: carried in E3. Each claim's ledger row records fetch status apart from the verdict.
- **2.2** Real not-enough-info outcome, never inferred from a failed fetch: carried, merged into C6.
- **2.3** Verbatim quotes, verified mechanically, with AIS as a gate: **dropped**. Claims are paraphrases, so the judgment is semantic (D7). AIS survives only as the footnote under C.
- **2.4** Literature definitions for tags: dropped from v2 and deferred to increment 2 (D1).
- **2.5** Support vs truth: carried and strengthened as C2. MiniCheck (v1) stays an optional cheap pre-screen. It is semantic, not quote-based.
- **3.1** Gold set from real cases: carried in C5 and D3. The size is restated for one verdict per claim.
- **3.2** Wilson intervals: carried as D4, re-sourced to Brown, Cai and DasGupta (2001), which covers binomial proportions directly.
- **3.3** Human agreement first: carried as D3.
- **3.4** Pin and re-run the frozen set: carried in spirit, under B5 and B6. Record model, rubric version and skills manifest per row.
- **3.5** Corrections become eval data, no auto-learning: carried unchanged. It is not restated as a row.
- **4.1** Proposed vs verified columns: carried as D1, reworded for verdicts.
- **4.2** Show confidence bands: carried inside D1 and C7.
- **4.3** Explanations raise acceptance: carried as D2. Notes are reasoning plus a pointer to the relevant passage, not a verified verbatim quote.
- **4.4** Audit the high-confidence tail: carried inside D2 (blind sample).
- **5.1** Workflow over agent: carried as E1.
- **5.2** Subagents for isolation: carried as E2, tied to D9.
- **5.3** Idempotent and resumable: carried as E3. Message Batches figures apply only to the API-key mode note (D9).
- **5.4** Cost control through caching and batches: reworded. On the subscription default, cost is mainly usage limits, and caching and batch discounts apply only in API mode (D9).
- **5.5** Injection: carried as E4 and E5.
- **6.1** Monorepo vs separate repos is undecided: reworded. D4 decides one skills library plus one agents repo (B1, B2).
- **6.2** Pin to immutable refs: carried as B5.
- **6.3** Skills as supply chain: carried inside B6. The v1 preprint statistics are not re-cited.
- **6.4** Verify what you received: carried as B6.

## Caveats

- No study tests semantic source-support judging on LLM-paraphrased claims like Geo's. The verdict rubric, especially "Partially supported", must be tuned on our own double-labelled gold set. AVeriTeC's fourth label means "misleading", not "partial", so it is not a direct match.
- The monorepo vs polyrepo evidence comes from Google-scale engineering. For a small team, D4 is a judgment call that the sources inform but do not settle.
- Anthropic's hallucination guide still recommends extracting word-for-word quotes for long documents. We deliberately do not gate on quotes, because claim wording is paraphrased (team fact over vendor advice).
- Several sources are preprints ("LLMs are not Fair Evaluators", "Let Me Speak Freely?", "Judging the Judges", Bucinca et al. as listed on arXiv, Rashkin et al.). Weight them below the peer-reviewed rows.
- Vendoring vs a plugin marketplace is not settled by any source here. It depends on whether editors can run the Claude Code plugin commands comfortably. Pilot one agent before choosing.
