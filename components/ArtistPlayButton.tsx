"use strict";
"use client";

import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { Song } from "@/types/types";
import { Pause, Play } from "lucide-react";

interface ArtistPlayButtonProps {
  songs: Song[];
}

const ArtistPlayButton = ({ songs }: ArtistPlayButtonProps) => {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const setQueue = usePlayerStore((state) => state.setQueue);

  const isCurrentSong = currentSong?.id === songs[0]?.id;

  const handlePlay = () => {
    if (songs.length > 0) {
      setQueue(songs);
    }
  };

  return (
    <div className="flex items-center gap-3 md:gap-4">
      <div className="relative group">
        {/* Pulsing effect when playing */}
        {isCurrentSong && isPlaying && (
          <div className="absolute inset-0 rounded-full bg-indigo-500/50 animate-ping" />
        )}
        <Button
          size="icon"
          className="relative z-10 w-14 h-14 md:w-18 md:h-18 rounded-full bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-indigo-500/40 hover:scale-110 hover:shadow-indigo-500/60 ring-4 ring-white/10 transition-all duration-300 flex items-center justify-center cursor-pointer"
          onClick={handlePlay}
        >
          {isCurrentSong && isPlaying ? (
            <Pause className="size-5 md:size-12 fill-white" />
          ) : (
            <Play className="size-5 md:size-12 fill-white" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ArtistPlayButton;
