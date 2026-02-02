"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export default function HeroLyricsDemo() {
  const [data, setData] = useState<{
    id: string;
    title: string;
    singer: string;
    lyrics: { time: number; text: string }[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/songs/random-synced");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch demo lyrics", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Parse and normalize lyrics
  const lyrics = useMemo(() => {
    if (!data || data.lyrics.length === 0) return [];

    // Ignore LRC timestamps, each line is 7.5 seconds
    return data.lyrics.map((line, index) => ({
      ...line,
      time: index * 7.5,
    }));
  }, [data]);

  const totalDuration = useMemo(() => {
    if (lyrics.length === 0) return 0;
    return lyrics.length * 7.5;
  }, [lyrics]);

  // Timer loop
  useEffect(() => {
    if (lyrics.length === 0) return;

    let startTime = performance.now();
    let animationFrameId: number;

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000; // Convert to seconds

      if (elapsed >= totalDuration) {
        // Reset loop
        startTime = now;
        setCurrentTime(0);
      } else {
        setCurrentTime(elapsed);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [totalDuration, lyrics.length]);

  // Find active line
  const activeIndex = useMemo(() => {
    const index = lyrics.findIndex(
      (line, i) =>
        currentTime >= line.time &&
        (i === lyrics.length - 1 || currentTime < lyrics[i + 1].time)
    );
    return index === -1 ? 0 : index;
  }, [currentTime, lyrics]);

  return (
    <div className="relative w-[400px] h-[440px] group/card shrink-0 hidden lg:block">
      {/* Glassmorphism Background Layers */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl transform rotate-6 group-hover/card:rotate-12 transition-transform duration-500" />
      <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl transform -rotate-3 group-hover/card:-rotate-6 transition-transform duration-500" />

      {/* Main Content Container */}
      <div className="relative bg-linear-to-br from-black/40 to-black/20 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl p-6 h-full flex flex-col overflow-hidden">
        {/* Header / Now Playing Indicator */}
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-white/80 text-xs font-medium tracking-wider uppercase">
            متن آهنگ همگام سازی شده
          </span>
        </div>

        {/* Song Info */}
        <div className="text-center mb-2 shrink-0 z-10 transition-opacity duration-500">
          {loading ? (
            <div className="space-y-2 flex flex-col items-center">
              <div className="h-6 w-32 bg-white/20 rounded-md animate-pulse" />
              <div className="h-4 w-24 bg-white/10 rounded-md animate-pulse" />
            </div>
          ) : data ? (
            <a
              href={`/song/${data.id}`}
              className="block group/link cursor-pointer"
            >
              <h2 className="text-white font-bold text-xl md:text-2xl mb-1 drop-shadow-lg group-hover/link:text-green-400 transition-colors">
                {data.title}
              </h2>
              <p className="text-white/60 text-sm font-medium tracking-wide group-hover/link:text-white/80 transition-colors">
                {data.singer}
              </p>
            </a>
          ) : (
            <div className="text-white/50 text-sm">بارگذاری نشد</div>
          )}
        </div>

        {/* Lyrics Scroll Area */}
        <div
          className="flex-1 overflow-hidden mask-gradient relative"
          ref={scrollContainerRef}
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
          }}
        >
          {loading ? (
            <div className="py-10 space-y-4 px-8">
              <div className="h-4 bg-white/10 rounded-md w-3/4 mx-auto animate-pulse" />
              <div className="h-4 bg-white/20 rounded-md w-full mx-auto animate-pulse" />
              <div className="h-4 bg-white/10 rounded-md w-5/6 mx-auto animate-pulse" />
              <div className="h-4 bg-white/5 rounded-md w-2/3 mx-auto animate-pulse" />
            </div>
          ) : (
            <div className="py-10">
              {" "}
              {/* Padding to allow scrolling top/bottom items to center */}
              {lyrics.map((line, index) => (
                <p
                  key={index}
                  className={cn(
                    "text-base font-medium py-2 transition-all duration-500 text-center leading-relaxed",
                    index === activeIndex
                      ? "text-white scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                      : "text-white/30 blur-[0.5px] scale-95"
                  )}
                  dir="rtl"
                >
                  {line.text}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Progress Bar (Visual Only) */}
        <div className="mt-4 shrink-0">
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${(currentTime / totalDuration) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
