"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ArtistDescriptionProps {
  description: string | null;
  maxLength?: number;
}

export default function ArtistDescription({
  description,
  maxLength = 300,
}: ArtistDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) return null;

  const isLong = description.length > maxLength;
  const displayedText =
    isExpanded || !isLong
      ? description
      : description.slice(0, maxLength) + "...";

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 max-w-3xl">
      <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
        {displayedText}
      </p>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>نمایش کمتر</span>
              <ChevronUp size={20} />
            </>
          ) : (
            <>
              <span>نمایش بیشتر</span>
              <ChevronDown size={20} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
