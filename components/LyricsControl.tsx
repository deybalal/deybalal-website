"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useLyricsStore, LyricsMode } from "@/hooks/useLyricsStore";
import {
  EyeOff,
  AlignLeft,
  Timer,
  FileEdit,
  PlusCircle,
  RefreshCw,
  Type,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Contributors } from "./Contributors";
import { Contributor } from "@/types/types";

interface LyricsControlProps {
  songId: string;
  hasLyrics: boolean;
  hasSyncedLyrics: boolean;
  contributors: Contributor[];
  source: string | null;
  sourceUrl: string | null;
}

export const LyricsControl: React.FC<LyricsControlProps> = ({
  songId,
  hasLyrics,
  hasSyncedLyrics,
  contributors,
  source,
  sourceUrl,
}) => {
  const { lyricsMode, setLyricsMode } = useLyricsStore();

  const modes: { mode: LyricsMode; label: string; icon: React.ElementType }[] =
    [
      { mode: "hidden", label: "Hide Lyrics", icon: EyeOff },
      { mode: "un-synced", label: "Show Un-Synced lyrics", icon: AlignLeft },
      { mode: "synced", label: "Show Synced Lyrics", icon: Timer },
    ];

  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Lyrics Settings</h3>
        <p className="text-sm text-gray-400">Customize how you view lyrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {modes.map(({ mode, label, icon: Icon }) => (
          <Button
            key={mode}
            variant={lyricsMode === mode ? "default" : "secondary"}
            className={cn(
              "flex items-center gap-2 h-11 transition-all",
              lyricsMode === mode
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 hover:bg-white/10"
            )}
            onClick={() => setLyricsMode(mode)}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <Button
          asChild
          variant="secondary"
          className="bg-white/5 hover:bg-white/10 flex items-center gap-2 h-11"
        >
          <Link href={`/panel/edit/lyrics/${songId}`}>
            {hasLyrics ? (
              <>
                <FileEdit className="w-4 h-4" />
                Edit Lyrics
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Add Lyrics
              </>
            )}
          </Link>
        </Button>

        <Button
          asChild
          variant="secondary"
          className="bg-white/5 hover:bg-white/10 flex items-center gap-2 h-11"
        >
          <Link href={`/panel/edit/sync/${songId}`}>
            {hasSyncedLyrics ? (
              <>
                <RefreshCw className="w-4 h-4" />
                Re-Synced Lyrics
              </>
            ) : (
              <>
                <Timer className="w-4 h-4" />
                Sync The Lyrics
              </>
            )}
          </Link>
        </Button>

        {hasSyncedLyrics && (
          <Button
            asChild
            variant="secondary"
            className="bg-white/5 hover:bg-white/10 flex items-center gap-2 h-11"
          >
            <Link href={`/panel/edit/synced/${songId}`}>
              <Type className="w-4 h-4" />
              Edit Synced Lyrics Text
            </Link>
          </Button>
        )}
      </div>

      <div className="flex justify-center">
        <div className="h-px bg-foreground/50 w-10/12 mt-4 mb-2"></div>
      </div>

      <div className="mb-4">
        <div className="my-4">
          <h3 className="text-lg font-semibold">Contributers</h3>
          <p className="text-sm text-gray-400">Contributers of this song</p>
        </div>
        <Contributors contributors={contributors} />

        {source && (
          <>
            <div className="flex justify-center">
              <div className="h-px bg-foreground/50 w-10/12 mt-1 mb-2"></div>
            </div>

            <div className="my-8">
              <div className="flex flex-col items-center text-center mb-6">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/60">
                  Lyrics Source
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  The original source for these lyrics
                </p>
              </div>

              <div className="flex justify-center">
                {sourceUrl ? (
                  <Link
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative w-full max-w-md overflow-hidden rounded-2xl p-0.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {/* Animated gradient border */}
                    <div className="absolute inset-0 bg-linear-to-r from-primary/50 via-white/20 to-primary/50 opacity-20 group-hover:opacity-100 transition-opacity" />

                    <div className="relative flex items-center justify-between gap-4 bg-[#0a0a0a]/80 backdrop-blur-xl p-6 rounded-[14px] border border-white/5">
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-medium uppercase tracking-wider text-primary mb-1">
                          Verified Source
                        </span>
                        <span className="text-lg font-semibold text-white group-hover:text-primary transition-colors">
                          {source}
                        </span>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 group-hover:bg-primary group-hover:border-primary transition-all">
                        <ExternalLink className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 italic">
                    {source}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
