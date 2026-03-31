# Workflow Design — LinkedIn Post Generator

## Industry & Topic Focus

**Industry:** AI Engineering  
**Topic focus:** LLM tooling, RAG pipelines, local inference, evals, and the practitioner experience of building with AI

**Why AI Engineering?** It is the highest-signal niche on LinkedIn right now. Engineers building with LLMs are actively searching for concrete, specific takes — not thought-leadership fluff. The audience skews technical, so credibility requires named tools, real numbers, and vulnerability. This niche rewards the exact style the system is optimized for.

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 14)                          │
│                                                                        │
│   Hero Landing  ──▶  Loading Animation  ──▶  Results View             │
│   (Generate btn)     (pipeline steps)        (Trend Brief + 5 Cards)  │
└────────────────────────────┬───────────────────────────────────────────┘
                             │  POST /api/generate
                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND PIPELINE                                │
│                                                                        │
│  STEP 1: Trend Discovery                                               │
│  ┌─────────────────────┐    ┌──────────────────────────────┐          │
│  │  Hacker News        │    │  Reddit JSON API             │          │
│  │  (Algolia API)      │    │  r/MachineLearning           │          │
│  │  queries:           │    │  r/LocalLLaMA                │          │
│  │  "AI+coding+tools"  │    │  r/artificial                │          │
│  │  "LLM+developer"    │    │  top 10 hot posts each       │          │
│  │  top 10 per query   │    └──────────────┬───────────────┘          │
│  └──────────┬──────────┘                   │                          │
│             └────────────────┬─────────────┘                          │
│                              ▼                                         │
│                Deduplicate → sort by score → top 15                   │
│                              │                                         │
│  STEP 2: Trend Brief (LLM Call #1)                                    │
│                              ▼                                         │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │  SYSTEM_PROMPT (persona + JSON contract + voice)              │    │
│  │  + buildTrendBriefPrompt(trends)                              │    │
│  │                                                               │    │
│  │  → Select 5–8 most post-worthy trends                        │    │
│  │  → Add: why_it_matters, post_angle, source_url               │    │
│  │  → Filter: skip too-niche, too-generic, pure news             │    │
│  │  → Prioritize: opinion potential, contrarian angle            │    │
│  └───────────────────────────┬───────────────────────────────────┘    │
│                              ▼                                         │
│                    trend brief [ 5–8 items ]                          │
│                              │                                         │
│  STEP 3: Post Generation (LLM Call #2)                                │
│                              ▼                                         │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │  SYSTEM_PROMPT                                                │    │
│  │  + buildPostGenerationPrompt(trendBrief)                      │    │
│  │    ├── <style_guide> EXTRACTED_STYLE_GUIDE                    │    │
│  │    ├── <few_shot_examples> 3 random corpus examples           │    │
│  │    ├── <trend_brief> editorial angles to write about          │    │
│  │    └── <instructions> hook variety, length, format, voice     │    │
│  │                                                               │    │
│  │  → 5 posts, each a different hook type                        │    │
│  │  → JSON: post_number, hook_type, trend_used, body, why_this_works │
│  └───────────────────────────┬───────────────────────────────────┘    │
│                              ▼                                         │
│  STEP 4: Quality Linter (lintPost per post)                           │
│                              ▼                                         │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │  9 checks: slop phrases · post length · emoji overuse         │    │
│  │  hashtag count/position · weak hook · link-in-body            │    │
│  │  all-caps words · corporate "we" voice · markdown artifacts   │    │
│  │                                                               │    │
│  │  → score 0–100, issue list, pass/fail (≥70 = pass)           │    │
│  └───────────────────────────┬───────────────────────────────────┘    │
│                              ▼                                         │
│            JSON response: { trendBrief, posts[] with lint }           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Data Sources & Ingestion Cadence

### Sources

| Source | API | Why chosen |
|:-------|:----|:-----------|
| **Hacker News** (Algolia) | `hn.algolia.com/api/v1/search?query=AI+coding+tools&tags=story&numericFilters=points>50` | Highest signal-to-noise for AI/dev content. Algolia's free API returns structured data with score + comment count. The `points>50` filter eliminates low-engagement noise. |
| **Reddit** (JSON API) | `reddit.com/r/{sub}/hot.json` | Community-driven engagement surfaces what practitioners actually care about. `r/LocalLLaMA`, `r/MachineLearning`, `r/artificial` together cover local inference, research, and general AI tooling respectively. No API key required. |

**Why not Twitter/X?** Requires a paid API ($100+/month). The HN + Reddit combination covers the same technical community at zero cost.

**Why not company blogs/changelogs?** Scraping individual sites is brittle and fragile. HN reliably surfaces major product announcements (e.g., a new model release hits HN within hours) — acting as a free aggregation layer.

### Ingestion Cadence

Trends are fetched **on-demand per generation** (not cached). This means:
- Every click of "Generate" pulls fresh data from HN + Reddit
- `revalidate: 0` is set on all fetch calls — no Next.js cache
- Typical freshness: content published within the last 24–48 hours surfaces automatically

**Tradeoff:** On-demand fetching adds ~1–2 seconds of latency vs. a pre-cached batch job. Acceptable for a weekly post-generation workflow where freshness matters more than speed.

---

## Prompt Engineering Strategy

### Two-Call Pipeline Design

The system uses two separate LLM calls instead of one:

```
Raw trends (15 items)
       │
  LLM Call #1: Trend Brief
  ↓ Filters 15 → 5–8 editorial angles
       │
  LLM Call #2: Post Generation
  ↓ Writes 5 posts from editorial angles
```

**Why two calls?**

1. **Separation of concerns.** The trend brief call is an editorial filter — it answers "what should we write about and why?" before any writing happens. If both tasks were combined, the model tends to default to the highest-scored trends rather than reasoning about post-worthiness.

2. **Intermediate validation.** The trend brief JSON is returned to the UI (the collapsible Trend Brief panel). This makes the pipeline auditable — you can see exactly what editorial angles were chosen before reading the generated posts.

3. **Cost optimization.** The trend brief call is small (15 items in → 5–8 items out). If switched to a smaller/cheaper model, only this call would need to change. The post generation call stays on the more capable model.

### Style Guide Injection (Phase A)

Rather than prompting "write a good LinkedIn post," the system injects `EXTRACTED_STYLE_GUIDE` — a research-backed document derived from analyzing 20+ high-performing AI engineering posts across 7 dimensions:

- Hook taxonomy (7 types: pain-point, contrarian, curiosity-gap, data-drop, confession, hot-take, mini-story)
- 6-beat post structure: Hook → Backstory → Problem → Solution → Proof → Close
- Line break and rhythm patterns (max 2 sentences per paragraph)
- Post length distribution: 1000–1500 characters optimal
- CTA styles: question close (drives comments) vs. takeaway close (drives saves)
- Credibility moves: specific numbers, named tools, vulnerability
- Anti-patterns: external links (-30% reach), hashtag spam, emoji overuse, corporate voice

**Key finding from analysis:** Pain-point hooks appear in 65% of top performers. First-person "I" voice in 65% of top vs 30% of bottom posts. White space increases readability by 68%. These data points are encoded directly into the style guide.

### Few-Shot Examples

3 examples are sampled randomly from a 7-example corpus on every call (`getSampleExamples(3)` uses `Math.random()` shuffle). This:
- Grounds Claude in the exact voice — not its generic "LinkedIn influencer" default
- Introduces variety between generations (35 different 3-example combinations from 7 examples)
- Uses paraphrased excerpts, not copied text, to avoid reproduction

### Anti-Slop Enforcement

The system has a three-layer defense against generic AI writing:

1. **Forbidden phrases list** in the post generation prompt (40+ phrases: "game-changer", "excited to share", "paradigm shift", etc.)
2. **Style guide anti-patterns** section (explains *why* each pattern fails, not just that it's forbidden)
3. **Post linter** (runtime check — catches any phrases that slipped through, with an 8-point penalty per match)

The redundancy is intentional. LLMs drift toward corporate phrasing under default conditions. Belt + suspenders.

### JSON Output Contract

All LLM calls use a strict JSON-only output contract defined in `SYSTEM_PROMPT`:
```
Output valid JSON only. No markdown code fences. No preamble. No trailing explanation.
```

A `parseJSON()` utility in `lib/claude.ts` strips any accidental markdown fences that slip through. This makes parsing deterministic and eliminates the need for fragile text extraction.

---

## Quality Linter (Bonus Feature)

Every generated post runs through `lintPost()` in `lib/linter.ts` before reaching the UI. This is a rule-based static analyzer — not a second LLM call:

| Check | Severity | Penalty |
|:------|:---------|:--------|
| Slop phrase detection (40+ phrases) | Error | -8 per match |
| Post too short (< 80 chars) | Error | -25 |
| Post too long (> 3000 chars) | Error | -20 |
| Post length warning (> 2000 chars) | Warning | -10 |
| Emoji overuse (> 2) | Warning | -3 per excess |
| Hashtag spam (> 3) | Warning | -5 |
| Hashtags in body (not at end) | Warning | -5 |
| Weak hook opener | Warning | -10 |
| External links in body | Warning | -10 |
| ALL CAPS words | Warning | -3 per excess |
| Corporate "we" voice | Warning | -8 |
| Markdown bold/italic/backtick | Warning | -8 per type |

Score = 100 − total penalties. Pass threshold: ≥ 70. Scores and issues are displayed per post card in the UI — making quality fully transparent and auditable.

**Why a rule-based linter instead of an LLM evaluator?** Speed (no extra API call), zero cost, deterministic results, and the specific rules are well-defined enough that an LLM is not needed. An LLM evaluator would add ~3 seconds and ~$0.01 per generation for rules that can be expressed as regex.

---

## Design Tradeoffs Summary

| Decision | Alternative | Why this choice |
|:---------|:------------|:----------------|
| Two LLM calls (brief + posts) | One combined prompt | Cleaner separation, auditable intermediate output, modular cost optimization |
| Style corpus → extracted guide | Raw post examples as few-shot | Extracted rules generalize better; prevents style from being too imitative |
| On-demand trend fetch | Scheduled cron job + cache | Simpler deployment (no worker), always fresh, fine for weekly cadence |
| Rule-based linter | LLM-as-judge evaluator | Deterministic, zero latency cost, sufficient for well-defined quality rules |
| Hard-coded industry (AI Engineering) | User-configurable | Tighter prompts, better style matching, better output quality at this scope |
| JSON-only output contract | Freeform + parse | Eliminates fragile text extraction, deterministic parsing every time |
