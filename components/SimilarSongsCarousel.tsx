"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SongCard from "./SongCard";
import { Song } from "@/types/types";
import { cn } from "@/lib/utils";

interface SimilarSongsCarouselProps {
  songs: Song[];
}

const SimilarSongsCarousel = ({ songs }: SimilarSongsCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
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
    if (!container || originalLength === 0 || isDragging) return;

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;
      e.preventDefault();
      const x = e.pageX - (scrollRef.current.offsetLeft || 0);
      const walk = (x - startX) * 1.5;
      // Invert drag direction to match user expectation
      if (isRTL) {
        scrollRef.current.scrollLeft = scrollLeft - walk;
      } else {
        scrollRef.current.scrollLeft = scrollLeft + walk;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, startX, scrollLeft, isRTL]);

  const onMouseDown = (e: React.MouseEvent) => {
    console.log("Above");

    if (!scrollRef.current) return;
    console.log("Nelowe");
    setIsDragging(true);
    // Use screenX for more consistent dragging across RTL containers
    setStartX(e.pageX - (scrollRef.current.offsetLeft || 0));
    setScrollLeft(scrollRef.current.scrollLeft);
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
        className="absolute -left-6 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 text-white shadow-2xl hover:bg-black transition-all hover:scale-110 active:scale-90 cursor-pointer flex items-center justify-center"
        aria-label="قبلی"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => scroll("right")}
        type="button"
        className="absolute -right-6 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full bg-black/80 backdrop-blur-xl border border-white/20 text-white shadow-2xl hover:bg-black transition-all hover:scale-110 active:scale-90 cursor-pointer flex items-center justify-center"
        aria-label="بعدی"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseDown={onMouseDown}
        className={cn(
          "flex gap-2 md:gap-4 overflow-x-auto py-4 px-2 scrollbar-hide snap-x selection:bg-transparent touch-pan-y",
          isDragging ? "cursor-grabbing snap-none" : "cursor-grab"
        )}
        style={{
          userSelect: isDragging ? "none" : "auto",
          WebkitUserSelect: isDragging ? "none" : "auto",
          // Force RTL if not detected correctly by browser quirks
          direction: "rtl",
        }}
      >
        {repeatedSongs.map((s, index) => (
          <div
            key={`${s.id}-${index}`}
            className={cn(
              "w-[150px] md:w-[200px] shrink-0 snap-start transition-transform duration-300",
              isDragging
                ? "pointer-events-none scale-[0.98]"
                : "hover:scale-[1.05]"
            )}
          >
            <SongCard song={s} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarSongsCarousel;
