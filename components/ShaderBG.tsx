"use client";

import dynamic from "next/dynamic";

// Loaded client-only to avoid SSR/WebGL issues
const GodRays = dynamic(
  () => import("@paper-design/shaders-react").then((m) => m.GodRays),
  { ssr: false }
);

export default function ShaderBG() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <GodRays
        colorBack="#00000000"
        colors={["#ffffff37", "#a1a1aa37", "#e4e4e737", "#71717a37"]}
        colorBloom="#ffffff"
        offsetX={0.85}
        offsetY={-1}
        intensity={0.65}
        spotty={0.45}
        midSize={10}
        midIntensity={0}
        density={0.38}
        bloom={0.45}
        speed={0.48}
        scale={1.6}
        style={{
          height: "100%",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}
