# Research Agent for Dataset Building — Model Selection Report & Pilot Test

**Date:** 2026-07-24
**Goal:** a self-deployed research agent for Geo dataset building — per entity/row it does efficient web search to (a) verify facts, (b) write descriptions, (c) find socials. Editors then publish the results via the Claude skills (geo-publish table contract).
**Priorities:** cost first, speed second, quality must stay above "safe to publish".
**Constraint:** self-deployed only — no API models. Runs locally or on a rented instance.

---

## 1. Model candidates (self-hostable, research-tuned)

| Model | Size | Research quality | Hosting need | Verdict |
|---|---|---|---|---|
| **Jan-v1-4B** (janhq, Apache 2.0) | 4B | SimpleQA **91.1%** — beats Perplexity Pro (70B); purpose-built web-search/research agent, tool calling | ~2.5 GB at Q4 → 8 GB VRAM, Apple Silicon laptop, or ~$0.17–0.27/hr GPU | ✅ **Selected — start here** |
| Qwen3-4B / 8B-Instruct-2507 | 4–8B | Strong general tool-calling; better structured output | same | Fallback if Jan-v1 output is messy |
| Tongyi DeepResearch (Alibaba, Apache 2.0) | 30B-A3B | SOTA open research agent (HLE 32.9 — beats o3; BrowseComp 43.4) | ~24 GB VRAM quantized → 3–5× cost | Upgrade path if 4B quality disappoints |
| MiroThinker-1.7-mini | 30B | Newest SOTA (Mar 2026, BrowseComp 74) | 30B **and** designed around paid tools (Serper, E2B) | Overkill; violates cost-first |
| WebSailor 3/7/32B | 3–32B | Research-tuned, older generation | varies | Superseded by Jan-v1 at small sizes |

**Why a 4B is enough:** dataset building is *shallow* research per row (2–5 searches, read a page, extract facts/socials, write 1–2 sentences) — not hour-long multi-hop deep research. The 30B-class agents solve a harder problem than this one.

Jan-v1-4B details: based on Qwen3-4B-Thinking; GGUF quants (4/5/6/8-bit) for llama.cpp/Ollama/LM Studio; one-line vLLM serve with tool-calling (`--enable-auto-tool-choice --tool-call-parser hermes`).

## 2. Hosting

**Key finding: Railway and Vercel have no GPUs.** Neither can host the model itself (Railway's own guidance: CPU-only, viable for ≤1B/demos). The architecture splits:

```
Railway (~$5–10/mo)                    GPU host (runs only while researching)
┌──────────────────────────┐          ┌────────────────────────────┐
│ agent orchestrator/queue │ ──API──▶ │ Jan-v1-4B on vLLM          │
│ SearXNG (FREE search) ◀──┼──tools── │ RunPod serverless          │
└──────────────────────────┘          │ ~$0.27/hr, scales to zero  │
                                      └────────────────────────────┘
```

- **RunPod serverless** = cost-first winner for bursty editor usage: per-second billing, scale-to-zero; RTX A5000 $0.27/hr (community). Estimated **$30–60/mo GPU** at ~10k rows/mo.
- **SearXNG self-hosted (Railway) = $0/query.** The search API is the real cost driver (Tavily/Serper at 3–6 searches × thousands of rows costs more than the tokens). Cost-first → self-host search.
- **Zero-infra option:** any Apple Silicon Mac runs Jan-v1-4B locally (Ollama / Jan app) for $0 — good enough for overnight batches (see pilot below).

**Path:** ① pilot locally for $0 → ② if quality passes, vLLM + Jan-v1 on RunPod serverless + SearXNG on Railway → ③ if quality fails, swap weights to Qwen3-8B, then Tongyi DeepResearch-30B — the serving stack stays identical, only the GPU size changes.

## 3. Pilot test (2026-07-24)

**Setup:** MacBook (Apple M2, 16 GB RAM), Ollama (native arm64), `janhq/Jan-v1-4B-GGUF:Q4_K_M` (2.5 GB).

> ⚠️ Setup gotcha worth recording: an Ollama installed through Intel/Rosetta Homebrew (`/usr/local`) ran the model emulated at **1.2 tok/s**. Reinstalling the native arm64 build gave **~25–29 tok/s** — a 25× difference. On Apple Silicon, make sure the binary is arm64.

**Test task — one real dataset row ("Richard Socher"):** the model received fetched page content (Wikipedia summary + socher.org homepage) as simulated search results, and had to return JSON with: a fact-check verdict, socials found, and a publishable description.

| Task | Result | Grade |
|---|---|---|
| **Fact check** — "founded You.com and was Chief Scientist at Salesforce" | `"supported"` with correct reasoning, citing which source confirms which half | ✅ |
| **Find socials** | Extracted exactly the 2 URLs actually present (`twitter.com/RichardSocher`, Google Scholar) — and **did not invent a LinkedIn** even though the prompt suggested that key | ✅ the critical one |
| **Description** | "Richard Socher is a German-born computer scientist and co-founder of You.com… Chief Scientist at Salesforce." Neutral, period-terminated, publishable | ✅ minor nit: wrote "founder of AIX Ventures" where sources say "co-founder" |

**Speed:** ~25 tok/s generation; **~31 s per row** end-to-end (949 prompt tokens, 719 output tokens incl. reasoning). ≈ 1,000 rows in an overnight 8h batch, on a laptop, at $0.

**Critical negative result:** asked the same founder question *without* sources in context, the model confidently invented three nonexistent You.com founders. Grounded with sources, it was faithful.

## 4. Conclusions

1. **Model: Jan-v1-4B** — quality passes for dataset building at 4B; grounded extraction is accurate and it resists inventing socials (the biggest dataset-poisoning risk).
2. **Non-negotiable design rule:** the agent **never answers from memory** — every claim must come from fetched content, and a row with no source stays blank. (This rule must also go into the eventual editor skill.)
3. **Cost:** pilot = $0 (local). Production estimate ≈ $35–70/mo total (RunPod serverless GPU + Railway orchestrator + $0 search via SearXNG).
4. **Output contract:** agent emits CSV/JSON in the repo's table contract (`publish-from-tables-requirements.md`) → feeds straight into the geo-publish skill; the editors' Claude-skill step stays unchanged.

## 5. Combo pilot — real web search wired in (2026-07-24)

`scripts/research-agent.mjs` — the full loop, tested end-to-end on a MacBook (M2): **DuckDuckGo search (free, keyless) → fetch + clean top 4 pages (harvesting social hrefs from the HTML) → grounded prompt → JSON row.**

Test row "Richard Socher": search found his LinkedIn/socher.org/you.com bio; output had a correct description, real Twitter + LinkedIn + Scholar URLs (GitHub correctly `null` — not invented), 4 true key facts (MetaMind→Salesforce 2016, Stanford PhD), cited source URLs, self-rated confidence. **~112 s/row** on the laptop (≈650 rows overnight; ~10 s/row expected on a hosted GPU).

Implementation notes (recorded in the script):
- DDG bot-blocks Node's `fetch` (202 challenge) but accepts curl → the search call shells out to curl. Production swaps `ddgSearch()` for a SearXNG endpoint — one function.
- Don't use Ollama's `format:'json'` grammar constraint with a thinking model — it fights the `<think>` phase and returns empty. The instruction-level "answer ONLY with JSON" works reliably.
- Grounded-only enforced structurally: no fetchable sources → the script exits with a blank row, never asks the model.

**Open items:** replace DDG with SearXNG for production volume; add a verbatim-titles guard (copy "co-founder" etc. exactly from source); score a 20-row eval sheet before committing to hosted deployment.

---

*Sources: [Jan-v1 announcement](https://x.com/jandotai/status/1955176280535732415) · [Jan-v1-4B on HF](https://huggingface.co/janhq/Jan-v1-4B) · [Jan v1 research setup](https://www.jan.ai/post/jan-v1-for-research) · [Tongyi DeepResearch](https://tongyi-agent.github.io/blog/introducing-tongyi-deep-research/) · [MiroThinker](https://github.com/MiroMindAI/MiroThinker) · [Railway GPU status](https://station.railway.com/feedback/gpu-support-56d19c42) · [RunPod pricing](https://www.runpod.io/pricing) · [Self-hosting economics](https://gigagpu.com/is-self-hosting-llms-cheaper-than-apis/)*
