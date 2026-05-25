"use client";

import { Play } from "lucide-react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { Song } from "@/types/types";
import PlayAsRadioButton from "./PlayAsRadioButton";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";

interface PlayAlbumButtonProps {
  albumId: string;
  songs: Song[];
}

export default function PlayAlbumButton({
  songs,
  albumId,
}: PlayAlbumButtonProps) {
  const { setQueue } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllSongs = useCallback(async (): Promise<Song[] | null> => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/albums/${encodeURIComponent(albumId)}/songs`
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
  }, [albumId]);

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
        پخش آلبوم
      </button>
      <PlayAsRadioButton
        fetchAllSongs={fetchAllSongs}
        songs={songs}
        variant="secondary"
        className="px-8 py-3 h-auto"
      />
    </div>
  );
}
