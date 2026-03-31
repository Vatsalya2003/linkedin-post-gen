"use client";

import { FC, useEffect, useState } from "react";
import { X, Check, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { LintResult } from "@/lib/linter";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    post_number: number;
    hook_type: string;
    trend_used: string;
    body: string;
    why_this_works: string;
  };
  lint: LintResult;
}

const PostModal: FC<PostModalProps> = ({ isOpen, onClose, post, lint }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const scoreColor = lint.score >= 80 ? "text-green-400" : lint.score >= 70 ? "text-yellow-400" : "text-red-400";
  const scoreBg = lint.score >= 80 ? "bg-green-500/20 border-green-500/30" : lint.score >= 70 ? "bg-yellow-500/20 border-yellow-500/30" : "bg-red-500/20 border-red-500/30";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 sm:py-10 px-3 sm:px-8">

          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10 w-full max-w-3xl my-auto rounded-2xl border border-white/10 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] shadow-2xl"
          >
            {/* Top-right actions: copy + close */}
            <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-8">

              {/* Top row: hook type + score */}
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300">
                  {post.hook_type}
                </span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${scoreBg} ${scoreColor}`}>
                  {lint.score}/100
                </span>
                <span className="text-xs text-gray-600">Post #{post.post_number}</span>
              </div>

              {/* Trend */}
              <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider">
                Trend: {post.trend_used}
              </p>

              {/* Post body — large and readable */}
              <div className="mb-6 p-5 sm:p-6 rounded-xl bg-white/5 border-l-2 border-blue-500/50 border-t border-t-white/10 border-r border-r-white/10 border-b border-b-white/10">
                <p className="text-sm sm:text-base md:text-lg text-gray-100 leading-relaxed whitespace-pre-line font-medium">
                  {post.body}
                </p>
              </div>

              {/* Why this works */}
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Why this works</p>
                <p className="text-sm text-gray-300 leading-relaxed italic">
                  {post.why_this_works}
                </p>
              </div>

              {/* Lint issues if any */}
              {lint.issues.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Lint issues</p>
                  <div className="space-y-2">
                    {lint.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${issue.severity === "error" ? "bg-red-400" : "bg-yellow-400"}`} />
                        <span className="text-gray-400">{issue.message}</span>
                        <span className="text-gray-600 ml-auto text-xs">-{issue.penalty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PostModal;
