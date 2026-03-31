"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] gap-8 px-4">

      {/* Central AI orb */}
      <div className="relative flex items-center justify-center">

        {/* Outer rotating ring */}
        <motion.div
          className="absolute w-32 h-32 rounded-full border border-blue-500/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* Middle rotating ring — opposite direction */}
        <motion.div
          className="absolute w-24 h-24 rounded-full border border-blue-500/30"
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner pulsing ring */}
        <motion.div
          className="absolute w-16 h-16 rounded-full border border-blue-500/40"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Core glow dot */}
        <motion.div
          className="w-4 h-4 rounded-full bg-blue-500"
          animate={{
            scale: [1, 1.3, 1],
            boxShadow: [
              "0 0 10px 2px rgba(59,130,246,0.3)",
              "0 0 25px 8px rgba(59,130,246,0.5)",
              "0 0 10px 2px rgba(59,130,246,0.3)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-blue-400/60"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 1 }}
            style={{ transformOrigin: "0 -50px" }}
          />
        ))}
      </div>

      {/* Status text with typing dots */}
      <div className="flex flex-col items-center gap-3">
        <motion.p
          className="text-white/80 text-lg font-medium tracking-wide"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Analyzing trends
        </motion.p>

        {/* Pipeline steps */}
        <PipelineSteps />
        <ElapsedTimer />
      </div>
    </div>
  );
}

function ElapsedTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = mins > 0
    ? `${mins}m ${secs.toString().padStart(2, "0")}s`
    : `${secs}s`;

  return (
    <motion.p
      className="text-gray-600 text-[10px] sm:text-xs font-mono tracking-widest mt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      {display} elapsed · typically ~20–30s
    </motion.p>
  );
}

function PipelineSteps() {
  const steps = [
    "Fetching live trends from HN & Reddit",
    "Distilling trend brief with Claude",
    "Generating LinkedIn posts",
    "Running quality linter",
  ];

  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: [0, 0.4, 0.4], x: 0 }}
          transition={{ delay: i * 2.5, duration: 1 }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-blue-500/50"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          />
          <span className="text-xs sm:text-sm text-gray-500">{step}</span>
        </motion.div>
      ))}
    </div>
  );
}
