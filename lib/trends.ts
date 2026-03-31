// ─────────────────────────────────────────────────────────────────────────────
// lib/trends.ts
//
// Fetches live trending topics from Hacker News (via Algolia API) and Reddit.
// No API keys required. Falls back gracefully if one source fails.
//
// Sources chosen because:
// - HN: highest signal-to-noise for AI/dev topics; Algolia API is stable + free
// - Reddit r/MachineLearning, r/LocalLLaMA, r/artificial: best community coverage
//   of LLM tooling, model releases, and practitioner pain points
// ─────────────────────────────────────────────────────────────────────────────

export interface TrendItem {
  title: string;
  url: string;
  source: "hackernews" | "reddit";
  score: number;
  commentCount: number;
}

// ── Hacker News via Algolia ───────────────────────────────────────────────────

interface HNHit {
  title?: string;
  story_title?: string;
  url?: string;
  points?: number;
  num_comments?: number;
  objectID: string;
}

async function fetchHN(): Promise<TrendItem[]> {
  const queries = [
    "AI+coding+tools",
    "LLM+developer",
  ];

  const results: TrendItem[] = [];

  await Promise.all(
    queries.map(async (q) => {
      const url = `https://hn.algolia.com/api/v1/search?query=${q}&tags=story&hitsPerPage=10&numericFilters=points>50`;
      const res = await fetch(url, { next: { revalidate: 0 } });
      if (!res.ok) return;

      const data = (await res.json()) as { hits: HNHit[] };
      for (const hit of data.hits ?? []) {
        const title = hit.title ?? hit.story_title;
        if (!title) continue;
        results.push({
          title,
          url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
          source: "hackernews",
          score: hit.points ?? 0,
          commentCount: hit.num_comments ?? 0,
        });
      }
    })
  );

  return results;
}

// ── Reddit JSON API ───────────────────────────────────────────────────────────

interface RedditChild {
  data: {
    title: string;
    permalink: string;
    score: number;
    num_comments: number;
  };
}

async function fetchReddit(): Promise<TrendItem[]> {
  const subs = ["MachineLearning", "LocalLLaMA", "artificial"];
  const results: TrendItem[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      const url = `https://www.reddit.com/r/${sub}/hot.json?limit=10`;
      const res = await fetch(url, {
        headers: { "User-Agent": "LinkedInPostGen/1.0" },
        next: { revalidate: 0 },
      });
      if (!res.ok) return;

      const data = (await res.json()) as { data?: { children?: RedditChild[] } };
      for (const child of data.data?.children ?? []) {
        const { title, permalink, score, num_comments } = child.data;
        results.push({
          title,
          url: `https://reddit.com${permalink}`,
          source: "reddit",
          score,
          commentCount: num_comments,
        });
      }
    })
  );

  return results;
}

// ── Public export ─────────────────────────────────────────────────────────────

export async function fetchTrends(): Promise<TrendItem[]> {
  let hn: TrendItem[] = [];
  let reddit: TrendItem[] = [];

  const [hnResult, redditResult] = await Promise.allSettled([
    fetchHN(),
    fetchReddit(),
  ]);

  if (hnResult.status === "fulfilled") hn = hnResult.value;
  if (redditResult.status === "fulfilled") reddit = redditResult.value;

  // Deduplicate by title (case-insensitive)
  const seen = new Set<string>();
  const combined: TrendItem[] = [];
  for (const item of [...hn, ...reddit]) {
    const key = item.title.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(item);
    }
  }

  // Sort by score descending, return top 15
  return combined.sort((a, b) => b.score - a.score).slice(0, 15);
}
