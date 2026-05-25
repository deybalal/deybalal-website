"use client";

import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { Song } from "@/types/types";
import { Pause, Play, Loader2 } from "lucide-react";
import PlayAsRadioButton from "./PlayAsRadioButton";
import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";

interface ArtistPlayButtonProps {
  songs: Song[];
  artistId: string;
}

const ArtistPlayButton = ({ songs, artistId }: ArtistPlayButtonProps) => {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const [isLoading, setIsLoading] = useState(false);

  const isCurrentSong = currentSong?.id === songs[0]?.id;

  const fetchAllSongs = useCallback(async (): Promise<Song[] | null> => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/artists/${encodeURIComponent(artistId)}/songs`);
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        return data.data;
      }
      return null;
    } catch {
      toast.error("خطا در دریافت لیست آهنگ ها");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [artistId]);

  const handlePlay = async () => {
    const allSongs = await fetchAllSongs();
    if (allSongs && allSongs.length > 0) {
      setQueue(allSongs);
    } else if (songs.length > 0) {
      // Fallback to paginated songs if API fails
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
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="size-5 md:size-6 animate-spin" />
          ) : isCurrentSong && isPlaying ? (
            <Pause className="size-5 md:size-6 fill-white" />
          ) : (
            <Play className="size-5 md:size-6 fill-white" />
          )}
        </Button>
      </div>
      <PlayAsRadioButton
        songs={songs}
        fetchAllSongs={fetchAllSongs}
      />
    </div>
  );
};

export default ArtistPlayButton;
