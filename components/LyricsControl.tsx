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
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LyricsControlProps {
  songId: string;
  hasLyrics: boolean;
  hasSyncedLyrics: boolean;
}

export const LyricsControl: React.FC<LyricsControlProps> = ({
  songId,
  hasLyrics,
  hasSyncedLyrics,
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
    </div>
  );
};
