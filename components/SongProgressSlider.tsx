"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { formatTime } from "@/lib/utils";
import { Song } from "@/types/types";

interface SongProgressSliderProps {
  song: Song | null;
}

export default function SongProgressSlider({ song }: SongProgressSliderProps) {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const setProgress = usePlayerStore((state) => state.setProgress);
  const setSeekTo = usePlayerStore((state) => state.setSeekTo);

  const isCurrentSong = currentSong?.id === song?.id;
  const displayProgress = isCurrentSong ? progress : 0;
  // Use store duration if it's the current song and duration is set, otherwise fallback to song.duration
  const displayDuration =
    isCurrentSong && duration > 0 ? duration : song?.duration || 0;

  const handleSeek = (value: number[]) => {
    setProgress(value[0]);
    setSeekTo(value[0]);
  };

  return (
    <div className="w-full ps-4 pe-4">
      <Slider
        value={[displayProgress]}
        onValueChange={handleSeek}
        max={displayDuration || 100}
        step={1}
        className="mb-2 cursor-pointer"
        disabled={!isCurrentSong}
      />
      <div className="flex justify-between text-sm text-muted-foreground cursor-pointer">
        <span>{formatTime(displayDuration)}</span>
        <span>{formatTime(displayProgress)}</span>
      </div>
    </div>
  );
}
