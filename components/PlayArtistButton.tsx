"use client";

import { Play } from "lucide-react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { Song } from "@/types/types";
import PlayAsRadioButton from "./PlayAsRadioButton";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";

interface PlayArtistButtonProps {
  artistId: string;
  songs: Song[];
}

export default function PlayArtistButton({
  songs,
  artistId,
}: PlayArtistButtonProps) {
  const { setQueue } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllSongs = useCallback(async (): Promise<Song[] | null> => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/artists/${encodeURIComponent(artistId)}/songs`
      );
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
    <div className="flex flex-col md:flex-row items-center gap-4">
      <button
        onClick={handlePlay}
        className="bg-accent cursor-pointer text-foreground font-bold px-8 py-3 rounded-full hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-accent/25"
        disabled={isLoading}
      >
        <Play fill="currentColor" className="w-5 h-5" />
        پخش آهنگها
      </button>
      <PlayAsRadioButton
        fetchAllSongs={fetchAllSongs}
        songs={songs}
        contextId={artistId}
        contextType="artist"
        variant="secondary"
        className="px-8 py-3 h-auto"
      />
    </div>
  );
}
