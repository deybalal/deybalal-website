"use client";

import { usePlayerStore } from "@/hooks/usePlayerStore";
import { Play, Pause } from "lucide-react";

interface SongCardPlayButtonProps {
  songId: string;
  title: string;
  titleEn: string | null;
  uri: string;
  filename: string;
  index: number;
  duration: number;
  coverArt: string | null;
  artist: string;
  album: string | null;
  playCount: number;
  albumId: string | null;
  year: string;
  links: Record<number, { url: string; size: string; bytes: number }> | null;
}

export default function SongCardPlayButton({
  songId,
  title,
  titleEn,
  uri,
  filename,
  index,
  duration,
  coverArt,
  artist,
  album,
  playCount,
  albumId,
  year,
  links,
}: SongCardPlayButtonProps) {
  const { pause, play, currentSong, isPlaying, setSong } = usePlayerStore();

  const song = {
    id: songId,
    title: title as string | undefined,
    titleEn: titleEn as string | undefined,
    uri,
    filename,
    index,
    duration,
    coverArt,
    artist,
    album,
    playCount,
    albumId,
    year: year as string | null,
    links,
    artists: [],
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (songId === currentSong?.id) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      setSong(song);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-100">
      <div className="relative">
        {/* Pulsing Glow Ring */}
        <div className="absolute inset-0 w-16 h-16 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 bg-purple-400/40 dark:bg-white/30 rounded-full blur-xl animate-pulse" />

        {/* Play Button */}
        <div
          onClick={handleClick}
          className="z-200 relative w-16 h-16 rounded-full bg-white dark:bg-white/95 backdrop-blur-md flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-2xl shadow-purple-500/30 dark:shadow-black/50 hover:shadow-purple-500/50"
        >
          {isPlaying && songId === currentSong?.id ? (
            <Pause
              fill="currentColor"
              className="text-purple-600 dark:text-black w-7 h-7 ms-1"
            />
          ) : (
            <Play
              fill="currentColor"
              className="text-purple-600 dark:text-black w-7 h-7 ms-1"
            />
          )}
        </div>
      </div>
    </div>
  );
}
