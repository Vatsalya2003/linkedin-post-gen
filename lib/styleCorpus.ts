// ─────────────────────────────────────────────────────────────────────────────
// lib/styleCorpus.ts
//
// Curated LinkedIn post style corpus for the AI Engineering niche.
// The EXTRACTED_STYLE_GUIDE is injected verbatim into Claude prompts at runtime.
// Claude never sees the raw post snippets — only the extracted guide.
// ─────────────────────────────────────────────────────────────────────────────

export type HookType =
  | "pain-point"
  | "contrarian"
  | "curiosity-gap"
  | "data-drop"
  | "confession"
  | "hot-take"
  | "mini-story";

export type Device =
  | "single-line-breaks"
  | "numbered-list"
  | "bullet-list"
  | "specific-numbers"
  | "mini-narrative"
  | "question-close"
  | "takeaway-close"
  | "no-hashtags"
  | "minimal-emoji"
  | "pas-arc"
  | "before-after"
  | "credibility-anchor"
  | "link-in-comments";

export interface PostExample {
  id: string;
  snippet: string;       // Paraphrased excerpt — not a full reproduction
  hookType: HookType;
  whyItWorks: string;
  approxLength: number;  // Character count
  devices: Device[];
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE CORPUS
// 7 paraphrased examples from high-performing AI Engineering LinkedIn posts.
// Weighted toward pain-point hooks (65% of top performers per analysis).
// ─────────────────────────────────────────────────────────────────────────────
export const STYLE_CORPUS: PostExample[] = [
  {
    id: "pe-001",
    snippet: `I burned 3 weeks building a RAG pipeline that didn't work.\n\nNot because the code was wrong.\nBecause I was asking the wrong questions.\n\nHere's what I'd do differently:\n\nWeek 1: I indexed everything. 200k docs, clean embeddings, fast retrieval.\nProblem: My eval set had 40 questions. The model answered 38 confidently. 30 were wrong.\n\nWeek 2: I chased chunk size. 256 tokens, 512, 128. No improvement.\nProblem: I was optimizing retrieval when the failure was in generation.\n\nWeek 3: I rebuilt the eval set from real user queries.\nRetrievability jumped 22%. Hallucinations dropped 60%.\n\nThe lesson: your RAG system is only as good as your eval set.\nMost people skip this. Don't.\n\n#RAG #AIEngineering #LLM`,
    hookType: "pain-point",
    whyItWorks: "Specific numbers + time-boxed narrative make the failure feel real. The 3-act structure (weeks) creates rhythm. Ends with a punchy actionable takeaway.",
    approxLength: 780,
    devices: ["single-line-breaks", "mini-narrative", "specific-numbers", "takeaway-close", "numbered-list"],
  },
  {
    id: "pe-002",
    snippet: `Hot take: context windows didn't kill RAG.\nBad product thinking did.\n\nI keep seeing teams throw 200k tokens at GPT-4o and call it an architecture.\nThen wonder why latency is 45 seconds and costs are $2/query.\n\nRAG isn't about fitting more text. It's about fetching the RIGHT text.\n\nThe teams winning with AI right now are the ones who ask:\n"What's the minimum context needed to answer this accurately?"\n\nNot: "How much can we fit?"\n\nCost-per-query drops 80% when you get retrieval precision right.\nLatency drops from 45s to 4s.\nAccuracy goes up, not down.\n\nContext windows are a tool. RAG is a discipline.\n\nWhere do you land on this?`,
    hookType: "hot-take",
    whyItWorks: "Opens with a contrarian position on a hot topic. Uses specific cost/latency numbers to back the take. Question close drives comments.",
    approxLength: 720,
    devices: ["single-line-breaks", "specific-numbers", "credibility-anchor", "question-close", "no-hashtags"],
  },
  {
    id: "pe-003",
    snippet: `Nobody talks about the real cost of fine-tuning.\n\nEveryone quotes compute. Nobody quotes the hidden costs:\n\n→ 3 weeks of an ML engineer's time curating data\n→ 2 rounds of RLHF because your first reward model was off\n→ Regression testing every capability you didn't mean to change\n→ Deployment infrastructure that's now model-version-specific\n\nI ran the numbers on a recent project.\nCompute: $8k. Total cost including eng time: $140k.\n\nSometimes the right answer is a 200-line prompt.\n\nFine-tune when:\n- Style/format is hard to enforce via prompt\n- Latency requirements demand a smaller model\n- You have 10k+ clean labeled examples\n\nOtherwise: prompt first. Measure. Then decide.\n\n#MLEngineering #LLM #AIProductDev`,
    hookType: "data-drop",
    whyItWorks: "The $8k vs $140k contrast is visceral and memorable. Bullet list of hidden costs feels like insider knowledge. Decision framework at the end gives real utility.",
    approxLength: 810,
    devices: ["bullet-list", "specific-numbers", "before-after", "takeaway-close", "credibility-anchor"],
  },
  {
    id: "pe-004",
    snippet: `I told my team we didn't need evals. I was wrong.\n\n6 months into building our AI assistant, users started complaining.\nResponses were getting worse, not better. We had no idea why.\n\nTurns out: we'd been prompt-tuning by vibes for 6 months.\nEvery change felt like an improvement in the moment.\nNone of it was measured.\n\nWe built a 150-question eval set. Took 2 weeks.\nSuddenly we could see exactly what broke and when.\n\nFirst prompt change after evals: +18% on our core tasks.\nPrevious 6 months of prompt changes: net 0%.\n\nIf you're shipping AI features without evals, you're flying blind.\nI was. Most teams are.`,
    hookType: "confession",
    whyItWorks: "Confession hook disarms defensiveness. The '6 months of nothing' vs '2 weeks of work = +18%' creates a stark before-after. Ends with inclusive 'most teams are' — not preachy.",
    approxLength: 760,
    devices: ["single-line-breaks", "mini-narrative", "before-after", "specific-numbers", "takeaway-close", "no-hashtags"],
  },
  {
    id: "pe-005",
    snippet: `What if I told you the best AI engineers I know barely write prompts?\n\nThey spend their time on:\n1. Data pipelines that keep context fresh\n2. Eval frameworks that catch regressions before users do\n3. Fallback logic when the model fails gracefully\n4. Observability — knowing WHAT failed, not just THAT it failed\n\nThe prompt is 10% of the work.\nThe system around the prompt is 90%.\n\nMost tutorials teach the 10%.\nMost production failures happen in the 90%.\n\nBuild the system, not just the prompt.`,
    hookType: "curiosity-gap",
    whyItWorks: "Opens with a counter-intuitive question that makes readers stop. Numbered list gives concrete structure. The 10%/90% reframe is quotable and shareable.",
    approxLength: 620,
    devices: ["single-line-breaks", "numbered-list", "specific-numbers", "takeaway-close", "no-hashtags"],
  },
  {
    id: "pe-006",
    snippet: `The model isn't the bottleneck. Your data is.\n\nI've benchmarked GPT-4o, Claude 3.5, Gemini 1.5 Pro on the same task.\nDifference in accuracy: 3–7%.\n\nI've seen the same model go from 42% to 91% accuracy when I:\n- Cleaned the training examples\n- Removed contradictory labels\n- Added 200 edge-case examples\n\nThe delta between models: 7%.\nThe delta from better data: 49%.\n\nStop arguing about which model to use.\nStart auditing your data.\n\nThat's where the real leverage is.`,
    hookType: "contrarian",
    whyItWorks: "Single bold contrarian statement that challenges the model-centric discourse. The 7% vs 49% comparison is the kind of data point that gets screenshotted.",
    approxLength: 580,
    devices: ["single-line-breaks", "specific-numbers", "bullet-list", "before-after", "takeaway-close", "no-hashtags"],
  },
  {
    id: "pe-007",
    snippet: `Last year I joined a team that had 'AI' in the product name.\n\nDay 1: The AI was a regex.\nDay 30: We had GPT-4 but no evals.\nDay 60: We had evals but no monitoring.\nDay 90: We had monitoring but no feedback loop.\nDay 180: We had it all. And users finally trusted it.\n\nBuilding real AI products is a layering process.\nNot a single launch.\n\nIf you skipped a layer, the next layer will fail.\nIf you rushed a layer, users will find the gaps.\n\nThere are no shortcuts. Just the work.\n\n#AIProduct #SoftwareEngineering`,
    hookType: "mini-story",
    whyItWorks: "Day-by-day structure creates suspense and rhythm. The progression from 'regex' to 'trusted product' mirrors the reader's own journey. Closing line lands as a genuine insight.",
    approxLength: 650,
    devices: ["single-line-breaks", "mini-narrative", "numbered-list", "takeaway-close"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTED STYLE GUIDE
//
// Synthesized from analysis of 500+ top-performing AI Engineering LinkedIn posts
// (via NotebookLM corpus analysis + manual review of Swipe File data).
// Injected verbatim into Claude's post-generation prompt.
// ─────────────────────────────────────────────────────────────────────────────
export const EXTRACTED_STYLE_GUIDE = `
=== LINKEDIN STYLE GUIDE: AI ENGINEERING NICHE ===
Synthesized from 500+ top-performing posts. Follow this precisely.

──────────────────────────────────────────
1. HOOK TYPES (ranked by performance frequency)
──────────────────────────────────────────
Use EXACTLY ONE of these hook archetypes per post. Do not mix.

1. Pain-point (65% of top performers)
   Formula: State a painful/costly mistake or frustration in 1 line.
   Example shape: "I [did X]. It cost me [Y]. Here's what I learned."
   Why it works: Readers see themselves in the failure. Disarms self-promotion.

2. Contrarian (15%)
   Formula: State the opposite of conventional wisdom. One sentence, no hedge.
   Example shape: "Everyone is focused on [X]. The real problem is [Y]."
   Why it works: Triggers the "wait, what?" reflex. Earns the scroll-stop.

3. Curiosity-gap (8%)
   Formula: Ask a question or make a promise that creates an information gap.
   Example shape: "What if I told you [surprising claim]?"
   Why it works: The human brain hates open loops. Readers must continue.

4. Data-drop (6%)
   Formula: Lead with a specific, surprising number. No context yet.
   Example shape: "[Concrete number] — here's what that actually means."
   Why it works: Specificity signals credibility. Generic claims get ignored.

5. Confession (3%)
   Formula: Admit you were wrong about something important.
   Example shape: "I told [team/client] [confident claim]. I was wrong."
   Why it works: Vulnerability breaks the "LinkedIn brag" pattern. Earns trust.

6. Hot-take (2%)
   Formula: State a strong opinion that will make some people disagree.
   Example shape: "Hot take: [Unpopular but defensible claim]."
   Why it works: Controversy drives comments. Comments drive reach. High risk/reward.

7. Mini-story (1%)
   Formula: Open mid-scene with a specific moment.
   Example shape: "Last [Tuesday/quarter/year], I [specific moment]."
   Why it works: Narrative draws readers in. Stories are remembered, facts are forgotten.

──────────────────────────────────────────
2. SIX-BEAT POST STRUCTURE
──────────────────────────────────────────
All top-performing posts (regardless of hook type) follow this framework:

Beat 1 — HOOK (1–2 lines)
  The single most important line. Written last. Rewritten 3x minimum.
  Must work as a standalone tweet. Must not require context to land.

Beat 2 — BACKSTORY (2–4 lines)
  Ground the hook in a specific real situation.
  Who, what, when. No vague "I've been thinking about this."

Beat 3 — PROBLEM (2–4 lines)
  What went wrong, what was missing, what was the cost?
  Specifics only. "3 weeks wasted" > "a lot of time."

Beat 4 — SOLUTION (3–6 lines)
  What you actually did. Numbered steps or short paragraphs.
  Be concrete. Name the tools, the decisions, the tradeoffs.

Beat 5 — PROOF (2–4 lines)
  Numbers. Before/after. Specific outcome.
  "Accuracy went from 42% to 91%" > "results improved."

Beat 6 — CLOSE (1–2 lines)
  Either a question OR a takeaway. Never both.
  - Question close: drives comments ("Where do you land on this?")
  - Takeaway close: drives saves ("Build the system, not just the prompt.")

──────────────────────────────────────────
3. LENGTH + FORMATTING
──────────────────────────────────────────
- Optimal length: 1,000–1,500 characters (~150–250 words)
- Under 500 chars: too thin to provide value
- Over 2,000 chars: reader drop-off spikes
- White space increases readability by 68% — use single-line breaks between paragraphs
- Max 1–2 sentences per paragraph
- Lists (numbered or bulleted) can appear once per post; not in the hook
- No bold/italic (not supported in native LinkedIn text)
- No emoji bullets (e.g., → is fine, 🔹 is not)
- No in-body hyperlinks — external links decrease reach by ~30%. Say "link in comments" if needed.
- Arrows (→) are acceptable sparingly (max 5 per post)

──────────────────────────────────────────
4. VOICE + TONE
──────────────────────────────────────────
- First-person "I" voice: 65% of top performers. Use it.
- Contractions always: "I've" not "I have", "don't" not "do not"
- Conversational register: write like you're explaining to a sharp colleague at lunch
- Never corporate "we": posts using "we/our" with <2 "I" mentions appear in 45% of bottom performers
- Never passive voice: "The pipeline failed" > "Failures were observed in the pipeline"
- Never hedge: "might", "could potentially", "perhaps" signal low confidence
- Technical specificity is credibility: name the model, name the tool, give the number
- Vulnerability > bragging: failure posts consistently outperform "look what I built" posts

──────────────────────────────────────────
5. CREDIBILITY MOVES
──────────────────────────────────────────
Use at least 2 of these per post:

→ Specific numbers: "$8k compute vs $140k total cost", "accuracy jumped from 42% to 91%"
→ Named tools/models: "GPT-4o", "Claude 3.5 Sonnet", "Pinecone", "LangChain" (but not gratuitously)
→ Time anchors: "3 weeks", "6 months", "Day 60"
→ Before/after contrast: "Before: [bad state]. After: [good state]."
→ Mini-narrative: a scene with a beginning, middle, end (even if 3 sentences)
→ Counterintuitive insight: something that surprises even experts in the space

──────────────────────────────────────────
6. CLOSING RULES
──────────────────────────────────────────
- Pick ONE close type: question OR takeaway. Never both.
- Question close: "Where do you land on this?" / "What's your take?" / "Am I off here?"
  → These drive comments. Comments are 15x more valuable than likes for reach.
- Takeaway close: A single actionable or quotable sentence.
  → These drive saves and shares.
- Webinar/event CTAs have 0% success rate. Never use them.
- "Like and share if you agree" has negative effect. Never use it.

──────────────────────────────────────────
7. HASHTAGS
──────────────────────────────────────────
- 0 hashtags: highest reach (algorithm no longer boosts hashtag reach)
- 1–3 hashtags: acceptable, placed at the very end after a blank line
- 4+ hashtags: penalizes reach
- Never put hashtags in the body of the post
- If using hashtags, pick specific ones: #RAG #LLMOps #AIEngineering (not #Tech #AI)

──────────────────────────────────────────
8. ANTI-PATTERNS (never use these)
──────────────────────────────────────────
The following phrases and patterns appear in bottom-performing posts:

FORBIDDEN PHRASES (automatic quality fail):
- "game-changer", "excited to share", "let that sink in", "the future is here"
- "in today's rapidly evolving", "as we stand on the cusp"
- "I'm thrilled to announce", "proud to share", "humbled and honored"
- "thought leader", "synergy", "paradigm shift", "move the needle"
- "deep dive", "unpack this", "here's the thing", "the reality is"
- "at the end of the day", "without further ado", "stay tuned"
- "this is huge", "mind-blowing", "revolutionary", "disruptive"
- "cutting-edge", "state-of-the-art", "best-in-class", "next level"
- "leverage" (as a verb), "unlock", "empower", "supercharge"
- "like and share", "share if you agree", "drop a comment below"

FORBIDDEN STRUCTURES:
- Starting with "I'm excited/thrilled/proud to..."
- Starting with "In today's world..." or "As we navigate..."
- The corpo-motivational close: "Together we can [vague aspiration]."
- Emoji spam: more than 2 emoji in a post
- Bullet points as the hook (lists need setup first)
- Asking multiple questions in the close

──────────────────────────────────────────
9. DATA POINTS TO INTERNALIZE
──────────────────────────────────────────
- White space: +68% readability
- External links in body: -30% reach
- Comments vs likes: comments are 15x more valuable for algorithmic reach
- Corporate "we" voice: present in 45% of bottom performers
- Failure/vulnerability posts: consistently outperform "wins" by 2–3x engagement
- Pain-point hooks: 65% of top performers use them
- Optimal post length: 1,000–1,500 chars (sweet spot from distribution analysis)

=== END STYLE GUIDE ===
`;

// ─────────────────────────────────────────────────────────────────────────────
// getSampleExamples
// Returns n random PostExample objects from STYLE_CORPUS.
// Used to inject few-shot examples into the generation prompt.
// ─────────────────────────────────────────────────────────────────────────────
export function getSampleExamples(n = 3): PostExample[] {
  const shuffled = [...STYLE_CORPUS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}
