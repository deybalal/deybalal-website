"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SongCard from "./SongCard";
import { Song } from "@/types/types";

interface SimilarSongsCarouselProps {
  songs: Song[];
}

const SimilarSongsCarousel = ({ songs }: SimilarSongsCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isRTL, setIsRTL] = useState(true);
  const [itemWidth, setItemWidth] = useState(216); // Default for desktop

  // Triple the items for infinite loop effect
  const repeatedSongs = [...songs, ...songs, ...songs];
  const originalLength = songs.length;

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      const direction = window.getComputedStyle(container).direction;
      setIsRTL(direction === "rtl");
    }

    const updateWidth = () => {
      const isMobile = window.innerWidth < 768;
      // Mobile: 150 (width) + 8 (gap-2) = 158
      // Desktop: 200 (width) + 16 (gap-4) = 216
      setItemWidth(isMobile ? 158 : 216);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (container && originalLength > 0) {
      // Center on the middle set
      if (isRTL) {
        // In most RTL browsers, scrollLeft is 0 at the far right and negative as you move left
        container.scrollLeft = -itemWidth * originalLength;
      } else {
        container.scrollLeft = itemWidth * originalLength;
      }
    }
  }, [originalLength, isRTL, itemWidth]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container || originalLength === 0) return;

    const currentScroll = container.scrollLeft;
    const totalContentWidth = itemWidth * originalLength;

    if (isRTL) {
      // RTL Infinite loop (assuming 0 is right, negative is left)
      if (currentScroll > -totalContentWidth * 0.5) {
        container.scrollLeft -= totalContentWidth;
      } else if (
        currentScroll <
        -totalContentWidth * 2.5 + container.clientWidth
      ) {
        container.scrollLeft += totalContentWidth;
      }
    } else {
      // LTR Infinite loop
      if (currentScroll < totalContentWidth * 0.5) {
        container.scrollLeft += totalContentWidth;
      } else if (
        currentScroll >
        totalContentWidth * 2.5 - container.clientWidth
      ) {
        container.scrollLeft -= totalContentWidth;
      }
    }
  };

  const scroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = itemWidth * 2;

    // In RTL, "right" button should increase scrollLeft (towards 0), "left" should decrease it
    // But scrollTo with {left: ...} often handles direction automatically if behavior: "smooth" is used?
    // Let's be explicit.
    let targetScroll = container.scrollLeft;
    if (direction === "left") {
      targetScroll -= scrollAmount;
    } else {
      targetScroll += scrollAmount;
    }

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  if (songs.length === 0) return null;

  return (
    <div className="relative group/carousel w-full">
      {/* Navigation Buttons - Always Visible and Functional */}
      <button
        onClick={() => scroll("left")}
        type="button"
        className="absolute -left-6 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 text-white shadow-2xl hover:bg-black transition-all hover:scale-110 active:scale-90 cursor-pointer flex items-center justify-center"
        aria-label="قبلی"
      >
        <ChevronLeft className="size-6" />
      </button>

      <button
        onClick={() => scroll("right")}
        type="button"
        className="absolute -right-6 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 text-white shadow-2xl hover:bg-black transition-all hover:scale-110 active:scale-90 cursor-pointer flex items-center justify-center"
        aria-label="بعدی"
      >
        <ChevronRight className="size-6" />
      </button>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-2 md:gap-4 overflow-x-auto py-4 px-2 scrollbar-hide snap-x selection:bg-transparent touch-pan-y select-none"
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          // Force RTL if not detected correctly by browser quirks
          direction: "rtl",
        }}
      >
        {repeatedSongs.map((s, index) => (
          <div
            key={`${s.id}-${index}`}
            className="w-[150px] md:w-[200px] shrink-0 snap-start transition-transform duration-300 select-none hover:scale-[1.05]"
          >
            <SongCard song={s} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarSongsCarousel;
