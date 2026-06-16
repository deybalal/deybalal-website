"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Instagram } from "lucide-react";

interface ArtistDescriptionProps {
  description: string | null;
  maxLength?: number;
  instagramHandle?: string | null;
}

export default function ArtistDescription({
  description,
  maxLength = 300,
  instagramHandle,
}: ArtistDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!description) return null;

  const isLong = description && description.length > maxLength;
  const displayedText =
    isExpanded || !isLong ? description : description?.slice(0, maxLength);

  return (
    <div className="space-y-6">
      {description && (
        <div className="relative">
          <p
            className={`text-gray-200 text-lg leading-relaxed whitespace-pre-wrap transition-all duration-300 ${
              !isExpanded && isLong ? "max-h-[150px] overflow-hidden" : ""
            }`}
          >
            {displayedText}
            {!isExpanded && isLong && "..."}
          </p>

          {!isExpanded && isLong && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-background/80 to-transparent pointer-events-none" />
          )}

          {isLong && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-semibold cursor-pointer group"
            >
              {isExpanded ? (
                <>
                  <span>نمایش کمتر</span>
                  <ChevronUp
                    size={18}
                    className="transition-transform group-hover:-translate-y-0.5"
                  />
                </>
              ) : (
                <>
                  <span>نمایش بیشتر</span>
                  <ChevronDown
                    size={18}
                    className="transition-transform group-hover:translate-y-0.5"
                  />
                </>
              )}
            </button>
          )}
        </div>
      )}

      {instagramHandle && (
        <div className="pt-4 border-t border-white/5">
          <a
            href={`https://instagram.com/${instagramHandle.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-linear-to-tr from-purple-600 to-pink-600 text-white font-bold hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-pink-500/20"
          >
            <Instagram size={22} />
            <span>دنبال کردن در اینستاگرام</span>
          </a>
        </div>
      )}
    </div>
  );
}
