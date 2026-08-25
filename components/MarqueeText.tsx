"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MarqueeTextProps {
  text: string;
  className?: string;
  /** "auto" detects RTL scripts (Persian/Arabic) in the text itself */
  dir?: "rtl" | "ltr" | "auto";
}

const RTL_REGEX = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;

function resolveDir(text: string, dir: "rtl" | "ltr" | "auto") {
  if (dir !== "auto") return dir;
  return RTL_REGEX.test(text) ? "rtl" : "ltr";
}

// Tune these to taste
const SPEED_PX_PER_SEC = 22; // lower = slower scroll
const HOLD_FRACTION = 0.08; // portion of the cycle paused at EACH of the 3 holds

const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  className,
  dir = "auto",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(10);

  const resolvedDir = resolveDir(text, dir);
  const isRtl = resolvedDir === "rtl";

  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current || !textRef.current) return;

      const textWidth = textRef.current.offsetWidth;
      const containerWidth = containerRef.current.offsetWidth;
      const overflow = textWidth - containerWidth;
      const overflowing = overflow > 0;

      setIsOverflowing(overflowing);

      if (overflowing) {
        setDistance(overflow);
        // Round trip = distance travelled twice (out + back)
        const travelTime = (overflow / SPEED_PX_PER_SEC) * 2;
        // travelTime is the "moving" portion; holds make up the rest
        setDuration(travelTime / (1 - HOLD_FRACTION * 3));
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [text]);

  if (!isOverflowing) {
    return (
      <div
        ref={containerRef}
        dir={resolvedDir}
        className={cn("relative overflow-hidden whitespace-nowrap", className)}
      >
        <span ref={textRef}>{text}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden whitespace-nowrap", className)}
    >
      <span
        ref={textRef}
        dir={resolvedDir}
        className={cn(
          "marquee-track inline-block",
          isRtl ? "marquee-rtl" : "marquee-ltr"
        )}
        style={
          {
            animationDuration: `${duration}s`,
            "--marquee-distance": `${distance}px`,
          } as React.CSSProperties
        }
      >
        {text}
      </span>

      <style jsx>{`
        .marquee-track {
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .marquee-ltr {
          animation-name: marquee-scroll-ltr;
        }
        .marquee-rtl {
          animation-name: marquee-scroll-rtl;
        }
        /*
          0%–8%:   hold at start
          8%–46%:  scroll out to the end
          46%–54%: hold at the end
          54%–92%: scroll back to the start
          92%–100%: hold at start
          Cycle starts AND ends at translateX(0), so looping is seamless.
        */
        @keyframes marquee-scroll-ltr {
          0%,
          8% {
            transform: translateX(0);
          }
          46%,
          54% {
            transform: translateX(calc(-1 * var(--marquee-distance)));
          }
          92%,
          100% {
            transform: translateX(0);
          }
        }
        @keyframes marquee-scroll-rtl {
          0%,
          8% {
            transform: translateX(0);
          }
          46%,
          54% {
            transform: translateX(var(--marquee-distance));
          }
          92%,
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MarqueeText;
