"use client";

import { FC, useState } from "react";
import { Card } from "@/components/ui/card";
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react";
import type { LintResult } from "@/lib/linter";

interface PostCardProps {
  post: {
    post_number: number;
    hook_type: string;
    trend_used: string;
    body: string;
    why_this_works: string;
  };
  lint: LintResult;
}

const PostCard: FC<PostCardProps> = ({ post, lint }) => {
  const [copied, setCopied] = useState(false);
  const [showLint, setShowLint] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreColor = lint.score >= 80 ? "text-green-400" : lint.score >= 70 ? "text-yellow-400" : "text-red-400";
  const scoreBg = lint.score >= 80 ? "bg-green-500/20 border-green-500/30" : lint.score >= 70 ? "bg-yellow-500/20 border-yellow-500/30" : "bg-red-500/20 border-red-500/30";

  return (
    <div className="group cursor-pointer transform transition-all duration-500 hover:scale-[1.02] hover:-rotate-[0.5deg]">
      <Card className="text-white rounded-2xl border border-white/10 bg-gradient-to-br from-[#010101] via-[#090909] to-[#010101] shadow-2xl relative backdrop-blur-xl overflow-hidden hover:border-white/25 hover:shadow-white/5 hover:shadow-3xl">

        {/* Animated background layers */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-white/10 opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-3xl opacity-30 group-hover:opacity-50 transform group-hover:scale-110 transition-all duration-700" />
          <div className="absolute top-10 right-10 w-16 h-16 rounded-full bg-white/5 blur-xl animate-ping" />
        </div>


        {/* Card content */}
        <div className="p-6 relative z-10">

          {/* Top row: hook type badge + lint score + copy button */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300">
                {post.hook_type}
              </span>
              <span className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full border ${scoreBg} ${scoreColor}`}>
                {lint.score}/100
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 transition-all duration-300 text-gray-400 hover:text-white"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Trend used */}
          <p className="text-[10px] sm:text-xs text-gray-500 mb-3 uppercase tracking-wider break-words">
            Trend: {post.trend_used}
          </p>

          {/* Post body */}
          <div className="mb-4 p-4 rounded-xl bg-white/10 border-l-2 border-blue-500/50 border-t border-t-white/10 border-r border-r-white/10 border-b border-b-white/10 backdrop-blur-sm">
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line font-medium">
              {post.body}
            </p>
          </div>

          {/* Why this works */}
          <p className="text-xs text-gray-400 italic leading-relaxed mb-4">
            {post.why_this_works}
          </p>

          {/* Divider */}
          <div className="w-1/4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full mx-auto group-hover:w-1/2 transition-all duration-500 mb-4" />

          {/* Lint issues expandable */}
          {lint.issues.length > 0 && (
            <div>
              <button
                onClick={() => setShowLint(!showLint)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors mx-auto"
              >
                {lint.issues.length} lint {lint.issues.length === 1 ? "issue" : "issues"}
                {showLint ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showLint && (
                <div className="mt-3 space-y-2">
                  {lint.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${issue.severity === "error" ? "bg-red-400" : "bg-yellow-400"}`} />
                      <span className="text-gray-400">{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PostCard;
