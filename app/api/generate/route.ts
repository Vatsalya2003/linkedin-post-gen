import { NextResponse } from "next/server";
import { fetchTrends } from "@/lib/trends";
import { callClaude, parseJSON } from "@/lib/claude";
import {
  SYSTEM_PROMPT,
  buildTrendBriefPrompt,
  buildPostGenerationPrompt,
} from "@/lib/prompts";
import { lintPost } from "@/lib/linter";
import type { LintResult } from "@/lib/linter";

interface TrendBriefItem {
  trend: string;
  why_it_matters: string;
  post_angle: string;
  source_url: string;
}

interface GeneratedPost {
  post_number: number;
  hook_type: string;
  trend_used: string;
  body: string;
  why_this_works: string;
}

export async function POST() {
  try {
    // ── STEP 1: Fetch live trends ─────────────────────────────────────────
    console.log("[generate] Step 1: Fetching trends...");
    const trends = await fetchTrends();
    console.log(`[generate] Fetched ${trends.length} trend items`);

    // ── STEP 2: Trend brief via Claude ────────────────────────────────────
    console.log("[generate] Step 2: Building trend brief...");
    const trendPrompt = buildTrendBriefPrompt(trends);
    const trendRaw = await callClaude(SYSTEM_PROMPT, trendPrompt);
    const trendBrief = parseJSON<TrendBriefItem[]>(trendRaw);
    console.log(`[generate] Trend brief: ${trendBrief.length} items`);

    // ── STEP 3: Post generation via Claude ────────────────────────────────
    console.log("[generate] Step 3: Generating posts...");
    const postPrompt = buildPostGenerationPrompt(trendBrief);
    const postsRaw = await callClaude(SYSTEM_PROMPT, postPrompt);
    const posts = parseJSON<GeneratedPost[]>(postsRaw);
    console.log(`[generate] Generated ${posts.length} posts`);

    // ── STEP 4: Lint each post ────────────────────────────────────────────
    console.log("[generate] Step 4: Linting posts...");
    const linted = posts.map((p) => ({
      ...p,
      lint: lintPost(p.body) as LintResult,
    }));

    const scores = linted.map((p) => p.lint.score);
    console.log(`[generate] Lint scores: ${scores.join(", ")}`);

    // ── STEP 5: Return results ────────────────────────────────────────────
    return NextResponse.json({ trendBrief, posts: linted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
