# LinkedIn Post Generator: Architecture, Prompting & Reflection

## System Workflow

The whole thing is a Next.js 14 app on Vercel. You click one button and it runs through four steps behind the scenes.

**1. Grabbing trends**

First it hits two APIs at the same time: Hacker News (through their Algolia search API, with queries like "AI+coding+tools" and "LLM+developer") and Reddit (the public JSON endpoints for r/MachineLearning, r/LocalLLaMA, and r/artificial). Neither needs API keys which kept things simple to set up. I merge everything together, deduplicate by title, and sort by engagement score so the most talked-about stuff floats to the top. Usually ends up with around 15 items.

**2. Making a trend brief**

Those 15 raw trends go into a Gemini 2.5 Flash call. I ask it to pick the 5-8 best ones for writing LinkedIn posts about and suggest a specific angle for each, like "contrarian take on why X is overrated" or "confession about making this mistake."

The whole point of this step is filtering. Most trending topics are either too niche (obscure library internals nobody cares about) or too generic (AI is changing everything) to write a good post about. So this call acts like an editor deciding what's actually worth covering. The output is a JSON array with `trend`, `why_it_matters`, `post_angle`, and `source_url` per item, and it gets shown to the user in the collapsible Trend Brief panel so they can see exactly what editorial choices were made.

**3. Writing the posts**

A second Gemini call gets the filtered trend brief plus two extra things: a style guide I built from actually researching real LinkedIn posts, and 3 example post snippets picked randomly from a small corpus I curated. It writes 5 posts as JSON, each one forced to use a different hook type so you don't get five posts that all start the same way. The hook types are: pain-point, contrarian, curiosity-gap, data-drop, confession, hot-take, and mini-story.

**4. Checking quality**

Every post goes through a linter I wrote before it ever reaches the UI. It runs 9 checks, catching overused phrases like "game-changer" and "excited to share", making sure the post isn't too short or too long, flagging emoji spam, checking if there are links in the body (LinkedIn penalizes that ~30%), detecting corporate "we" voice instead of personal "I" voice, and flagging markdown formatting that LinkedIn doesn't render (so asterisks show up literally). Each post gets a score from 0 to 100. Anything above 70 passes.

**Quick note on the model:** I'm using Gemini 2.5 Flash right now because the free tier let me test and iterate without worrying about costs. But I actually built and validated all the prompts on Claude Sonnet first. It followed the style guide better and avoided cliche phrases more consistently. The code already has the Claude integration wired up in `lib/claude.ts` with a clean fallback system, so switching is literally one environment variable.

---

## Architecture

```
Browser
  |
  └── POST /api/generate
              |
    ┌─────────▼──────────────────────────────────────────────────┐
    │  STEP 1: Trend Discovery (parallel fetch, no API keys)     │
    │                                                            │
    │   HN Algolia API          Reddit JSON API                  │
    │   /search?query=          /r/{sub}/hot.json                │
    │   AI+coding+tools         r/MachineLearning                │
    │   LLM+developer           r/LocalLLaMA                     │
    │   (10 results each)       r/artificial                     │
    │                           (10 results each)                │
    │                                                            │
    │   merge -> deduplicate -> sort by score -> top 15          │
    └─────────────────────────┬──────────────────────────────────┘
                              |
    ┌─────────────────────────▼──────────────────────────────────┐
    │  STEP 2: Trend Brief (LLM Call #1 - Gemini 2.5 Flash)     │
    │                                                            │
    │  Input:  15 raw trends (title, score, comment count, url)  │
    │  Prompt: SYSTEM_PROMPT + buildTrendBriefPrompt()           │
    │  Task:   Filter to 5-8 post-worthy trends                  │
    │          Add why_it_matters + post_angle per item          │
    │          Skip too-niche / too-generic / pure news           │
    │  Output: JSON array [ { trend, why_it_matters,             │
    │                         post_angle, source_url } ]         │
    └─────────────────────────┬──────────────────────────────────┘
                              |
    ┌─────────────────────────▼──────────────────────────────────┐
    │  STEP 3: Post Generation (LLM Call #2 - Gemini 2.5 Flash) │
    │                                                            │
    │  Input:  Trend brief from Step 2                           │
    │  Prompt: SYSTEM_PROMPT + buildPostGenerationPrompt()       │
    │    ├── <style_guide>       EXTRACTED_STYLE_GUIDE           │
    │    ├── <few_shot_examples> 3 random corpus examples        │
    │    ├── <trend_brief>       filtered editorial angles       │
    │    └── <instructions>      hook variety, length, format,   │
    │                            voice, forbidden phrases        │
    │  Output: JSON array of 5 posts                             │
    │          [ { post_number, hook_type, trend_used,           │
    │              body, why_this_works } ]                      │
    └─────────────────────────┬──────────────────────────────────┘
                              |
    ┌─────────────────────────▼──────────────────────────────────┐
    │  STEP 4: Quality Linter (rule-based, no LLM)              │
    │                                                            │
    │  9 checks -> score 0-100 -> pass if >= 70                  │
    │  Slop phrases · length · emoji · hashtags · weak hook      │
    │  links in body · all-caps · corporate voice · markdown     │
    └─────────────────────────┬──────────────────────────────────┘
                              |
              { trendBrief[], posts[] with lint scores }
```

---

## Prompting Decisions

**Two LLM calls instead of one.**
I tried doing everything in a single call early on, just give it the raw trends and ask for posts directly. The results were bad. The model would just pick the top-scored trends and write generic posts because it was trying to do two jobs at once. Splitting it into "pick good trends" and then "write good posts" made both steps way better. The brief call is basically cheap filtering; the generation call can focus entirely on writing quality.

**Building a style guide from real posts.**
I didn't want to just tell the model "write good LinkedIn posts" and hope for the best. So I collected about 20-30 posts that actually performed well in the AI/dev space, loaded them into NotebookLM, and analyzed them across seven categories: hook types, paragraph structure, tone, how they built credibility, how they ended, what triggered comments, and what to avoid.

Some things that came out of that analysis:
- 65% of top performers opened with a pain-point hook (only 20% of low performers did)
- 65% used first-person "I" voice (vs 30% of bottom posts)
- Posts with external links in the body got ~30% less reach
- Specific numbers and named tools showed up in almost every high-performing post

I turned all of that into a written `EXTRACTED_STYLE_GUIDE` that gets injected into the prompt at runtime. The model never sees the original posts, just the patterns I pulled out. That way it's not imitating anyone, it's following a set of rules grounded in what actually works.

**Few-shot examples.**
Even with the style guide, the model sometimes drifted into that generic LinkedIn voice. Adding 3 paraphrased examples fixed it pretty much immediately. It's like showing someone "write like this" instead of just describing what you want. I randomize which 3 examples get picked each time from a pool of 7, so the output doesn't get repetitive across generations.

**Saying "don't do this" twice.**
I have a banned phrase list in both the system prompt and the user prompt. Sounds redundant, but it actually matters. When I only had it in one place, cliche phrases leaked through around 15% of the time. With it in both places it dropped to under 3%. LLMs need reminding. The linter is a third layer that catches anything that still slips through.

**XML tags around the style guide and examples.**
I wrap the style guide in `<style_guide>` tags and examples in `<few_shot_examples>` tags. LLMs pay noticeably more attention to content inside labeled blocks than the same content written inline. After I added the tags, the model followed the structural rules (specifically the 6-beat post structure and the hook variety requirement) much more reliably.

**Making the model explain itself.**
Each post in the JSON output has a `why_this_works` field where the model has to explain which hook it used, why it chose that structure, and what makes the post engaging. This isn't just for the UI. Forcing the model to reason about its own output is basically chain-of-thought baked into the output schema. It consistently improves quality, especially for the structural decisions.

**JSON-only output contract.**
The system prompt has one hard rule: output valid JSON only, no code fences, no preamble, no explanation. I also have a `parseJSON()` utility that strips any accidental markdown fences just in case. This makes parsing deterministic and means I never have to do messy text extraction.

---

## Things I'd do with more time

**Better trend content.** Right now the system only sees article titles and scores. I'd want to actually fetch the first few paragraphs of each linked article before passing to the brief call. A title like "New quantization method" could be groundbreaking or completely irrelevant. You can't really tell without reading a bit of it.

**More sources.** HN and Reddit are both discussion-heavy. I'd add Dev.to for practitioner blog posts, GitHub Trending for tools people are actually shipping things with, and maybe ArXiv RSS for research angles. Different sources give you different kinds of post ideas.

**A/B hook variants.** Generate two versions of each post, a pain-point version and a contrarian version for the same trend, and either let the user pick or auto-select based on the linter score. The infrastructure already supports this; it's mostly a prompt schema change.

**Learning from results.** The biggest missing piece is memory. Right now the system has no idea what worked in previous runs. In a real version you'd track which posts got the most engagement, summarize the patterns weekly, and feed that back into the next generation cycle. The system would get better the more you use it, which is a much more interesting product.

**Comment reply packs.** The first comment from the author is really important for LinkedIn reach. I'd auto-generate 3-5 options for what to post as that first comment right after publishing. Small feature, probably high ROI.

**Image generation.** Posts with visuals consistently outperform text-only. A cheap version would just be rendering the hook line as styled text on a dark gradient using HTML Canvas, costs nothing, still beats no image.

---

## Scalling Ideas for further development

At 5 posts per click, the synchronous API call works fine. Scaling to 100+ posts per week needs a few changes:

**Queue-based generation.** Move from "click and wait" to "click, job goes into a queue, results show up when ready." This removes the 60-second Vercel timeout and lets you run bigger batches without the user staring at a loading screen. Simple to set up with Vercel Queue or even just a Postgres job table.

**Cache the trends.** HN and Reddit don't change every minute. Cache the fetched trends for 2-4 hours using Redis or Vercel KV. Multiple generation runs within that window share the same data instead of hitting the APIs every single time.

**Use cheaper models where it makes sense.** The trend brief call is just filtering, a smaller faster model handles it fine. Save the expensive model for actual post writing. That alone cuts costs by about 60% on one of the two calls.

**Prompt caching.** The style guide (~2000 tokens) and system prompt are identical across every single call. Anthropic supports prompt caching on identical prefixes at around 90% cost reduction for cached tokens. At 20 runs/week, this adds up quickly.

**Better model for generation.** Right now the system runs on Gemini 2.5 Flash which is great for speed and cost, but switching to Claude Sonnet or GPT-4o for the post generation step would noticeably improve output quality. During testing Claude Sonnet followed the style guide more precisely and produced fewer cliche phrases without needing as much prompting. At scale you could route the cheap filtering step to a smaller model and only use the better model for actual writing, which keeps costs reasonable while getting the quality improvement where it matters.

