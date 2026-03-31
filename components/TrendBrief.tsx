"use client";

import { useState } from "react";

interface TrendBriefItem {
  trend: string;
  why_it_matters: string;
  post_angle: string;
  source_url: string;
}

interface Props {
  items: TrendBriefItem[];
}

export default function TrendBrief({ items }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-800 transition-colors"
      >
        <span className="font-semibold text-zinc-100 text-sm">
          Trend Brief
          <span className="ml-2 text-xs font-normal text-zinc-500">
            ({items.length} items)
          </span>
        </span>
        <span className="text-zinc-500 text-xs">{open ? "▲ hide" : "▼ show"}</span>
      </button>

      {open && (
        <div className="divide-y divide-zinc-800 border-t border-zinc-800">
          {items.map((item, i) => (
            <div key={i} className="px-5 py-4 space-y-2">
              <div className="font-medium text-zinc-100 text-sm break-words">{item.trend}</div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                <span className="font-medium text-zinc-300">Why it matters: </span>
                {item.why_it_matters}
              </p>
              <p className="text-zinc-400 text-xs leading-relaxed">
                <span className="font-medium text-zinc-300">Angle: </span>
                {item.post_angle}
              </p>
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-blue-400 hover:underline truncate max-w-full"
                >
                  {item.source_url}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
