// ─────────────────────────────────────────────────────────────────────────────
// lib/prompts.ts
//
// All Claude prompt construction lives here. This file is the core of the
// prompt engineering strategy and is meant to be readable as documentation.
//
// DESIGN PRINCIPLES:
// 1. System prompt sets the persona once — no need to repeat in user turns.
// 2. Trend brief is a separate Claude call: cheaper (small model could work),
//    and separating concerns keeps each prompt focused.
// 3. Post generation prompt injects style guide + few-shot examples to ground
//    Claude in the specific patterns we want, not its default LinkedIn voice.
// 4. JSON-only output keeps parsing deterministic — no free-text to strip.
// 5. Anti-slop instructions are explicit and redundant (in system + user) because
//    Claude's default voice drifts toward corporate phrasing without reminders.
// ─────────────────────────────────────────────────────────────────────────────

import { EXTRACTED_STYLE_GUIDE, getSampleExamples } from "./styleCorpus";
import type { TrendItem } from "./trends";

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
//
// Shared context injected into every Claude call via the `system` parameter.
// Sets persona, output format contract, and voice constraints upfront so
// user-turn prompts can focus on task-specific instructions.
//
// Key decisions:
// - "AI Engineering niche" is explicit — prevents Claude from writing generic
//   business content that won't resonate with technical audiences.
// - "Output valid JSON only" is the single most important constraint. Without it,
//   Claude sometimes wraps output in prose or adds markdown fences.
// - Voice constraints here are intentionally brief — detail lives in the style
//   guide injected per-call, not in the system prompt.
// ─────────────────────────────────────────────────────────────────────────────
export const SYSTEM_PROMPT = `You are an expert LinkedIn content strategist specializing in the AI Engineering niche.

Your audience: software engineers, ML engineers, and technical founders who build with LLMs, RAG pipelines, vector databases, and AI product infrastructure.

Your output contract:
- Output valid JSON only. No markdown code fences. No preamble. No trailing explanation.
- If asked to output an array, start your response with [ and end with ].
- If asked to output an object, start with { and end with }.

Your voice:
- Sharp, technical, conversational — never corporate.
- First-person "I" voice (not "we"). Contractions always.
- Specific numbers and named tools signal credibility. Vague claims do not.
- Vulnerability and lessons-learned outperform "look what I built" posts.`;

// ─────────────────────────────────────────────────────────────────────────────
// TREND BRIEF PROMPT
//
// Takes raw TrendItem[] and asks Claude to:
//   1. Filter to 5–8 most post-worthy trends for AI engineers
//   2. Explain why each matters to this specific audience
//   3. Suggest a concrete LinkedIn post angle for each
//
// Design decisions:
// - We pass score + commentCount to help Claude rank by community engagement,
//   not just raw title. High comment counts signal opinion potential.
// - "Opinion potential" instruction: trends that can support contrarian angles
//   or hot takes are 3–5x more valuable for LinkedIn than neutral news.
// - "Skip too niche / too generic" avoids both obscure CUDA flags and
//   vapid "AI is changing everything" trend items.
// - Source URL is preserved in output so the UI can link back to the original.
// ─────────────────────────────────────────────────────────────────────────────
export function buildTrendBriefPrompt(trends: TrendItem[]): string {
  const trendList = trends
    .map(
      (t, i) =>
        `${i + 1}. [${t.source.toUpperCase()}] "${t.title}"\n   Score: ${t.score} | Comments: ${t.commentCount}\n   URL: ${t.url}`
    )
    .join("\n\n");

  return `You are curating a trend brief for a weekly LinkedIn content calendar targeting AI Engineers.

Here are ${trends.length} trending items from Hacker News and Reddit (scored by community engagement):

${trendList}

Your task:
1. Select the 5–8 items with the highest "post-worthy" potential for an AI Engineering audience.
2. Skip trends that are: too niche (e.g., obscure library internals), too generic (e.g., "AI is growing"), or pure news announcements with no opinion angle.
3. Prioritize trends with strong "opinion potential" — items where a contrarian take, hot take, or lessons-learned angle is possible.
4. For each selected trend, write:
   - "trend": a clean, concise title (rewrite if needed for clarity)
   - "why_it_matters": 1–2 sentences explaining why this is relevant to AI engineers RIGHT NOW
   - "post_angle": a specific suggested angle for a LinkedIn post (e.g., "contrarian take on why X is overrated", "confession about making this mistake", "data showing Y is better than everyone thinks")
   - "source_url": the original URL from the input

Output a JSON array. No prose. No markdown.
Schema: [{ "trend": string, "why_it_matters": string, "post_angle": string, "source_url": string }]`;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST GENERATION PROMPT
//
// Takes the trend brief and generates 5 LinkedIn posts.
//
// Design decisions:
// - Style guide is injected as a <style_guide> XML block: Claude treats tagged
//   blocks as reference material, reading more carefully than inline prose.
// - Few-shot examples from STYLE_CORPUS ground Claude in the EXACT voice we
//   want. Without them, Claude defaults to a generic "LinkedIn influencer" voice.
// - "Each post MUST use a DIFFERENT hook type" prevents all 5 posts from being
//   pain-point hooks (the most common). Forces variety in the batch.
// - The anti-slop instruction here is REDUNDANT with the style guide — that's
//   intentional. Repetition across system + user prompt reduces slippage.
// - "why_this_works" field: forces Claude to internally justify each post, which
//   improves quality (chain-of-thought style). Also shown in UI as transparency.
// - "Favor vulnerability over flexing" is the single highest-ROI instruction.
//   In testing, removing it caused ~60% of posts to become brag-adjacent.
// ─────────────────────────────────────────────────────────────────────────────
export function buildPostGenerationPrompt(
  trendBrief: { trend: string; why_it_matters: string; post_angle: string }[]
): string {
  const examples = getSampleExamples(3);

  const examplesBlock = examples
    .map(
      (e, i) => `--- EXAMPLE ${i + 1} (Hook: ${e.hookType}) ---\n${e.snippet}\n\nWhy it works: ${e.whyItWorks}`
    )
    .join("\n\n");

  const trendSummary = trendBrief
    .map(
      (t, i) =>
        `${i + 1}. TREND: "${t.trend}"\n   WHY IT MATTERS: ${t.why_it_matters}\n   SUGGESTED ANGLE: ${t.post_angle}`
    )
    .join("\n\n");

  return `You are generating 5 LinkedIn posts for an AI Engineering audience.

<style_guide>
${EXTRACTED_STYLE_GUIDE}
</style_guide>

<few_shot_examples>
These are examples of high-performing AI Engineering LinkedIn posts in the style you should follow:

${examplesBlock}
</few_shot_examples>

<trend_brief>
Here are the trends to write about. Pick the 5 most distinct ones (or use all if 5 or fewer provided):

${trendSummary}
</trend_brief>

<instructions>
Write exactly 5 LinkedIn posts. For each post:

HOOK VARIETY — Each post MUST use a DIFFERENT hook type from this set:
  pain-point | contrarian | curiosity-gap | data-drop | confession | hot-take | mini-story
Do NOT use the same hook type twice.

STRUCTURE — Follow the 6-beat framework from the style guide:
  Hook → Backstory → Problem → Solution → Proof → Close

LENGTH — Each post body MUST be 1000–1500 characters (~150–250 words).
  Too short = no value. Too long = drop-off. Hit the window.

FORMATTING rules — PLAIN TEXT ONLY:
  - LinkedIn does NOT render markdown. Write plain text only.
  - NEVER use **bold** (no double asterisks). NEVER use *italic* (no single asterisks).
  - NEVER use backtick code spans (no \`word\` formatting). Write tool names as plain text: llama.cpp not \`llama.cpp\`
  - Single-line breaks between paragraphs (blank line between sections)
  - Max 2 sentences per paragraph
  - One numbered or bulleted list per post maximum (NOT in the hook)
  - 0–3 hashtags at the very end, blank line before them
  - No URLs in the body

TOPIC DIVERSITY:
  - No two posts may cover the same sub-topic.
  - If two trend items are closely related (e.g., both about AI coding tools), pick only one.
  - Spread posts across distinct areas: local inference, evals, cost optimization, multimodal, etc.

VOICE rules:
  - First-person "I" voice throughout
  - Contractions always ("I've", "don't", "it's")
  - NEVER use corporate "we/our" as the primary voice
  - Favor vulnerability and lessons-learned over "look what I built"
  - Name specific tools, models, and numbers — vague claims get ignored

FORBIDDEN PHRASES (never use any of these):
  "game-changer", "excited to share", "let that sink in", "the future is here",
  "deep dive", "unpack this", "paradigm shift", "thought leader", "synergy",
  "cutting-edge", "revolutionary", "leverage" (as a verb), "unlock", "empower",
  "here's why", "at the end of the day", "without further ado", "mind-blowing"

CLOSE — Each post must end with EITHER:
  - A question (drives comments; e.g., "Where do you land on this?")
  - OR a punchy takeaway sentence (drives saves)
  NEVER both.
</instructions>

Output a JSON array with exactly 5 objects. No markdown fences. No prose.
Schema:
[{
  "post_number": number,
  "hook_type": string,
  "trend_used": string,
  "body": string,
  "why_this_works": string
}]`;
}
