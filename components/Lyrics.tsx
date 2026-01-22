"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { parseLRC } from "@/tools/parseLyrics";
import { cn } from "@/lib/utils";

interface LyricsProps {
  lrc?: string | null;
  plainLyrics?: string | null;
}

export default function Lyrics({
  lrc,
  plainLyrics,
  songId,
}: LyricsProps & { songId?: string }) {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const setSeekTo = usePlayerStore((state) => state.setSeekTo);
  const progress = usePlayerStore((state) => state.progress);
  const setProgress = usePlayerStore((state) => state.setProgress);

  const parsedLyrics = useMemo(() => (lrc ? parseLRC(lrc) : []), [lrc]);

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [manualScroll, setManualScroll] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const isSynced = !!lrc;

  // Find active line based on progress
  useEffect(() => {
    if (!isSynced || parsedLyrics.length === 0) return;

    let targetIndex = 0;

    // Only sync if the playing song matches the displayed song
    if (!songId || currentSong?.id === songId) {
      const foundIndex = parsedLyrics.findIndex(
        (line, i) =>
          progress >= line.time &&
          (i === parsedLyrics.length - 1 || progress < parsedLyrics[i + 1].time)
      );
      if (foundIndex !== -1) {
        targetIndex = foundIndex;
      }
    }

    if (targetIndex !== activeIndex) {
      setActiveIndex(targetIndex);
    }
  }, [progress, parsedLyrics, isSynced, activeIndex, currentSong, songId]);

  // Auto-scroll to active line
  useEffect(() => {
    if (!isSynced || manualScroll || !scrollContainerRef.current) return;

    const activeElement = scrollContainerRef.current.children[
      activeIndex
    ] as HTMLElement;
    if (activeElement) {
      activeElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeIndex, manualScroll, isSynced]);

  const handleUserScroll = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    if (!manualScroll) setManualScroll(true);

    scrollTimeout.current = setTimeout(() => {
      setManualScroll(false);
    }, 3000);
  };

  const handleLineClick = (time: number) => {
    if (isSynced && currentSong?.id === songId) {
      setSeekTo(time);
      setProgress(time);
    }
  };

  if (!isSynced && !plainLyrics) return null;

  return (
    <div
      className="h-full w-full overflow-y-auto ps-4 pe-4 py-10 no-scrollbar scrollbar-hide mask-gradient"
      ref={scrollContainerRef}
      onScroll={handleUserScroll}
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      {isSynced ? (
        parsedLyrics.map((line, index) => (
          <p
            key={index}
            onClick={() => handleLineClick(line.time)}
            className={cn(
              "text-lg md:text-xl lg:text-2xl  font-medium py-3 transition-all duration-300 cursor-pointer hover:text-white/60 md:hover:text-foreground/60 text-center",
              index === activeIndex
                ? "text-white md:text-foreground scale-105 origin-center"
                : "text-muted-foreground/40"
            )}
          >
            {line.text}
          </p>
        ))
      ) : (
        <div className="text-center whitespace-pre-wrap text-xl md:text-2xl lg:text-3xl text-muted-foreground leading-loose">
          {plainLyrics}
        </div>
      )}
    </div>
  );
}
