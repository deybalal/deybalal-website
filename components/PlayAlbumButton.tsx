"use client";

import { Play } from "lucide-react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { Song } from "@/types/types";

interface PlayAlbumButtonProps {
  songs: Song[];
}

export default function PlayAlbumButton({ songs }: PlayAlbumButtonProps) {
  const { setQueue } = usePlayerStore();

  const handlePlayAlbum = () => {
    if (songs && songs.length > 0) {
      setQueue(songs);
    }
  };

  return (
    <button
      onClick={handlePlayAlbum}
      className="bg-accent text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-accent/25"
    >
      <Play fill="currentColor" className="w-5 h-5" />
      Play Album
    </button>
  );
}
