"use client";

import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/neon-button";

interface ErrorDisplayProps {
  message?: string;
  onRetry: () => void;
}

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  const isCreditsError =
    message?.toLowerCase().includes("rate") ||
    message?.toLowerCase().includes("limit") ||
    message?.toLowerCase().includes("429") ||
    message?.toLowerCase().includes("credit") ||
    message?.toLowerCase().includes("quota") ||
    message?.toLowerCase().includes("billing");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">
        {isCreditsError ? "Oops! API Credits Exhausted" : "Something went wrong"}
      </h2>

      <p className="text-gray-400 text-sm max-w-md mb-6">
        {isCreditsError
          ? "We've hit the API rate limit. Please change the API key or add credits to continue generating posts."
          : message || "An unexpected error occurred while generating posts."}
      </p>

      {isCreditsError && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 max-w-sm w-full">
          <p className="text-gray-300 text-xs mb-3">
            Ask the developer to fix this:
          </p>
          <div className="space-y-2 text-sm">
            <p className="text-white font-medium">Vatsalya Dabhi</p>
            <a href="mailto:vatsalyadabhi05@gmail.com" className="block text-blue-400 hover:text-blue-300 transition-colors">
              vatsalyadabhi05@gmail.com
            </a>
            <a href="tel:+12065514161" className="block text-blue-400 hover:text-blue-300 transition-colors">
              +1 (206) 551-4161
            </a>
          </div>
        </div>
      )}

      <Button size="lg" onClick={onRetry} className="px-8 py-3">
        Try Again
      </Button>
    </motion.div>
  );
}
