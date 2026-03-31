"use client";

import { useState } from "react";
import TrendBrief from "@/components/TrendBrief";
import PostCard from "@/components/PostCard";
import ShaderBG from "@/components/ShaderBG";
import { Button } from "@/components/ui/neon-button";
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import LoadingAnimation from "@/components/LoadingAnimation";
import ErrorDisplay from "@/components/ErrorDisplay";
import PostModal from "@/components/PostModal";
import type { LintResult } from "@/lib/linter";

interface TrendBriefItem {
  trend: string;
  why_it_matters: string;
  post_angle: string;
  source_url: string;
}

interface Post {
  post_number: number;
  hook_type: string;
  trend_used: string;
  body: string;
  why_this_works: string;
  lint: LintResult;
}

interface ApiResponse {
  trendBrief: TrendBriefItem[];
  posts: Post[];
  error?: string;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [trendBrief, setTrendBrief] = useState<TrendBriefItem[] | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    // Don't clear posts/trendBrief here — keeps old data visible during regeneration (STATE 2)

    try {
      const res = await fetch("/api/generate", { method: "POST" });
      const data: ApiResponse = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      setTrendBrief(data.trendBrief);
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative overflow-x-hidden">
      <ShaderBG />

      <main className="relative z-10 w-full max-w-[95vw] mx-auto px-3 sm:px-6">

        {!posts && !loading && !error ? (
          // ── STATE 1: Hero landing ─────────────────────────────────────────
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <AnimatedText
              text="LinkedIn Post Generator"
              textClassName="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4"
              underlineClassName="text-blue-500"
              underlineDuration={1.8}
            />
            <p className="text-gray-500 text-base sm:text-lg mt-6 text-center max-w-md">
              Generate high-performing LinkedIn posts powered by live AI engineering trends.
            </p>
            <Button
              size="lg"
              onClick={generate}
              disabled={loading}
              className="mt-8 w-full sm:w-auto px-12 py-4 text-lg sm:text-xl font-bold tracking-wide"
            >
              Generate Posts
            </Button>
          </div>

        ) : loading ? (
          // ── STATE 2: Loading animation ────────────────────────────────────
          <LoadingAnimation />

        ) : error ? (
          // ── STATE 3: Error display ────────────────────────────────────────
          <ErrorDisplay message={error} onRetry={() => { setError(null); generate(); }} />

        ) : (
          // ── STATE 4: Results view ─────────────────────────────────────────
          <div className="w-full space-y-6 pb-16">
            {/* Compact top bar */}
            <div className="flex items-center w-full pt-6 pb-8">
              <AnimatedText
                text="LinkedIn Post Generator"
                textClassName="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white"
                underlineClassName="text-blue-500"
                underlineDuration={1.8}
                className="items-start"
              />
              <div className="flex-1" />
              <Button size="lg" onClick={generate} disabled={loading} className="ml-auto shrink-0 px-8 py-3 text-base font-bold">
                {loading ? "Generating..." : "Regenerate"}
              </Button>
            </div>

            {/* Trend brief */}
            {trendBrief && <TrendBrief items={trendBrief} />}

            {/* PostCard grid: row of 3 + row of 2 centered */}
            {posts && (
              <div className="flex flex-col gap-4 sm:gap-6">
                {/* Row 1: first 3 cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {posts.slice(0, 3).map((post, i) => (
                    <div key={i} onClick={() => setSelectedPost(i)} className="cursor-pointer">
                      <PostCard post={post} lint={post.lint} />
                    </div>
                  ))}
                </div>
                {/* Row 2: last 2 cards, centered */}
                <div className="grid grid-cols-1 md:grid-cols-2 md:max-w-[66%] md:mx-auto gap-4 sm:gap-6 w-full">
                  {posts.slice(3, 5).map((post, i) => (
                    <div key={i} onClick={() => setSelectedPost(i + 3)} className="cursor-pointer">
                      <PostCard post={post} lint={post.lint} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Post modal */}
      {selectedPost !== null && posts && (
        <PostModal
          isOpen={selectedPost !== null}
          onClose={() => setSelectedPost(null)}
          post={posts[selectedPost]}
          lint={posts[selectedPost].lint}
        />
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800 mt-8 px-6 py-6">
        <p className="text-center text-xs text-zinc-600">
          Built by Vatsalya — ProNexus SWE Intern Interview
        </p>
      </footer>
    </div>
  );
}
