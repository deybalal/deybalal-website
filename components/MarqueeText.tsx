"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MarqueeTextProps {
  text: string;
  className?: string;
}

const MarqueeText: React.FC<MarqueeTextProps> = ({ text, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(
          textRef.current.offsetWidth > containerRef.current.offsetWidth
        );
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden whitespace-nowrap", className)}
    >
      <div
        className={cn(
          "inline-block",
          isOverflowing && "animate-marquee flex gap-4"
        )}
      >
        <span ref={textRef}>{text}</span>
        {isOverflowing && <span>{text}</span>}
      </div>
    </div>
  );
};

export default MarqueeText;
