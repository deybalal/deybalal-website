"use client";

import React from "react";
import * as Diff from "diff";

interface LyricsDiffProps {
  oldLyrics: string | null;
  newLyrics: string | null;
}

export default function LyricsDiff({ oldLyrics, newLyrics }: LyricsDiffProps) {
  const diff = Diff.diffLines(oldLyrics || "", newLyrics || "");

  return (
    <div className="font-mono text-sm bg-black/50 p-4 rounded-lg border border-white/10 overflow-x-auto max-h-[500px] overflow-y-auto">
      {diff.map((part, index) => {
        const color = part.added
          ? "text-green-400 bg-green-900/30"
          : part.removed
          ? "text-red-400 bg-red-900/30"
          : "text-gray-300";

        const prefix = part.added ? "+" : part.removed ? "-" : " ";

        return (
          <div
            key={index}
            className={`${color} whitespace-pre-wrap px-2 py-0.5 rounded-sm`}
          >
            {part.value.split("\n").map((line, i) => {
              if (line === "" && i === part.value.split("\n").length - 1)
                return null;
              return (
                <div key={i} className="flex">
                  <span className="w-4 shrink-0 opacity-50">{prefix}</span>
                  <span>{line}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
