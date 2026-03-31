# Reflection & Scaling Plan

## What I Built

A two-step LLM pipeline that fetches live trends from Hacker News and Reddit, distills them into editorial angles via a first LLM call, then generates 5 LinkedIn posts per run via a second LLM call — guided by a corpus-derived style guide, 3 few-shot examples, and a post-generation quality linter (9 checks, 0–100 score). The system is deployed on Vercel, runs end-to-end in ~20–30 seconds, and produces posts with no markdown artifacts, no slop phrases, and proper LinkedIn formatting.

---

## What I'd Expand With More Time

### 1. More trend sources
The current two sources (HN + Reddit) are strong but limited. I'd add:
- **Dev.to API** (`/articles?tag=ai`) — practitioner blog posts, different signal than upvotes
- **GitHub Trending** — surfaces actively-used tools, not just discussion
- **ArXiv recent papers** (via RSS) — for technically-minded angles on model research
- **Changelog aggregators** (e.g., tracked releases from Anthropic, OpenAI, Mistral) — product releases are highly post-worthy

Each source requires explaining *why* it was chosen in the trend brief prompt, so Claude can weigh them appropriately.

### 2. A/B hook variants
The spec mentions this as a bonus. Each post would generate 2 different hook versions for the same trend angle — one pain-point, one contrarian — and the user picks or the system auto-picks based on a scoring heuristic. Implementation: add a second `hook_variant` field to the JSON schema and a "pick best" rule in the linter.

### 3. Engagement feedback loop
Currently the system has no memory. A real production version would:
- Store generated posts + their LinkedIn engagement metrics (impressions, comments, shares) in a database
- Run a weekly summarization call: "Here are the 10 posts from last week ranked by engagement. Extract patterns: which hook types, topics, and structures performed best?"
- Inject this performance summary into the next generation cycle as a `<performance_brief>` block
- Over time, the style guide self-refines based on actual data rather than static corpus analysis

This turns a static system into a compounding one — the more it runs, the better it gets.

### 4. Multi-industry support
The industry is currently hard-coded to AI Engineering. Unlocking multi-industry means:
- A per-industry style corpus (different hooks perform differently in e.g. Finance vs. Dev Tools)
- Per-industry trend sources (different subreddits, different HN tag filters)
- A simple dropdown in the UI to switch industry context
- One shared pipeline architecture, industry-specific prompt overlays

### 5. Comment reply packs
The spec mentions this as a bonus. When a post gets traction, the first comment from the author drives significant reach. The system would auto-generate 3–5 comment reply options per post ("What would you add as the first comment?"), optimized for triggering algorithmic amplification.

### 6. Similarity checker
A cosine similarity check against the style corpus to ensure generated posts aren't too close to any example. Simple to implement with embedding APIs — flag posts above a 0.85 cosine threshold as potential copies.

---

## How to Scale: Dozens → Hundreds of Posts/Week

### Current bottleneck
The system generates 5 posts per run in ~20–30 seconds. Scaling to 100 posts/week means either:
- Running the pipeline ~20× per week (fine for manual use), or
- Moving to a batch generation model

### Architecture changes for scale

**1. Async batch pipeline**

Move from synchronous HTTP request to an async queue:

```
User click → enqueue job → return job_id
Background worker: fetchTrends → brief → generate → lint → store
Frontend polls /api/job/{id} → shows results when ready
```

Tools: Vercel Queue, Inngest, or a simple Postgres job table. This removes the 60-second Vercel function timeout constraint and enables generating 50+ posts per batch.

**2. Trend cache layer**

Trends don't change minute-to-minute. Cache the raw fetch results for 2–4 hours:
```
Redis / Vercel KV: trend_cache_{timestamp_hour} → TrendItem[]
```
Reduces HN + Reddit API calls from N×/day to ~6×/day regardless of generation volume. Also means multiple users generating at the same time share the same trend data — fair and consistent.

**3. Prompt caching (Anthropic)**

Both LLM calls share the same `SYSTEM_PROMPT` + `EXTRACTED_STYLE_GUIDE`. Anthropic's prompt caching caches prompt prefixes for 5 minutes at ~90% cost reduction for cached tokens. At scale, the style guide (~2000 tokens) + system prompt (~200 tokens) would be cached across every call in a session.

Estimated savings at 100 posts/week: ~$0.40/week → ~$0.04/week just on the style guide tokens.

**4. Model routing**

Not every call needs the most capable model:
- Trend brief call (filter 15 → 8 items): can use a smaller/faster model (Gemini Flash, Claude Haiku)
- Post generation call: needs the full model for quality

This cuts latency by ~40% and cost by ~60% on the brief step.

**5. Parallel post generation**

Currently the system generates all 5 posts in a single LLM call. At scale, splitting into parallel calls (1 post each) enables:
- Retrying individual failed posts without regenerating the whole batch
- Different model choices per post (e.g., best model for the highest-priority post)
- True streaming to the UI (show posts as they complete)

---

## How to Keep Quality High at Scale

### Problem: quality degrades at volume
When generating 100+ posts/week, prompt drift, repetition, and slop accumulate — especially if the style guide doesn't evolve.

### Solutions

**Linter as quality gate (already built)**
Every post has a lint score. At scale, add a hard gate: if `score < 70`, automatically regenerate that post before serving. The linter catches ~80% of quality issues deterministically (slop phrases, formatting artifacts, weak hooks) at zero added cost.

**Diversity enforcement**
At 100 posts/week, topic repetition becomes a real problem. Add a `topics_used_this_week[]` context window that's injected into each generation call: "These topics have already been covered this week — do not repeat them." Simple but effective.

**Style guide versioning**
The `EXTRACTED_STYLE_GUIDE` in `lib/styleCorpus.ts` should be treated as a versioned artifact. Each weekly batch gets a style guide version stamped on it. When the feedback loop detects a drop in engagement scores, you can A/B test style guide versions rather than debugging blindly.

**Human review queue**
At scale, not every post can be manually reviewed. Add a confidence score derived from the lint score + a "surprise" heuristic (how different is this from the training distribution?). Posts below a confidence threshold go into a human review queue; high-confidence posts ship directly.

---

## Cost Analysis

At current usage (5 posts per generation):

| Step | Model | Approx tokens | Cost |
|:-----|:------|:-------------|:-----|
| Trend brief | Gemini 2.5 Flash | ~2,000 in / 500 out | ~$0.001 |
| Post generation | Gemini 2.5 Flash | ~5,000 in / 3,000 out | ~$0.006 |
| **Total per run** | | | **~$0.007** |

At 100 posts/week (20 runs × 5 posts):
- Without optimization: ~$0.14/week
- With prompt caching + model routing: ~$0.04/week

This is essentially free at this scale. The cost becomes meaningful only at enterprise scale (10,000+ posts/week), where the async batch architecture, caching, and model routing described above would reduce costs by ~10×.

---

## Safety Considerations

**Preventing plagiarism:** The system uses a paraphrased corpus (not raw copied posts) and generates original text. A similarity checker (cosine similarity against corpus) would add a formal safeguard. Posts above 0.85 similarity to any corpus example would be flagged or regenerated.

**Brand safety:** The linter's slop phrase list and markdown artifact detection prevent the most common quality failures. At scale, an LLM-as-judge evaluator could be added as a second pass on low-scoring posts.

**API key security:** Keys are stored in environment variables (`.env.local` locally, Vercel environment variables in production). The `.env.local` file is gitignored. No keys are embedded in code or committed to the repo.

**Rate limiting:** The `/api/generate` route has no rate limiting currently. At scale, add IP-based rate limiting (e.g., max 10 requests/hour) via Vercel middleware to prevent abuse and runaway API costs.
