"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Song } from "@/types/types";
import { Play, Music2, Pause } from "lucide-react";
import Image from "next/image";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SongCardProps {
  song: Song;
}

const SongCard = ({ song }: SongCardProps) => {
  const { pause, play, currentSong, isPlaying } = usePlayerStore();

  return (
    <Card className="group relative overflow-hidden cursor-pointer border-0 bg-transparent">
      <CardContent className="p-0">
        {/* Animated Border Gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-purple-500/50 via-pink-500/50 to-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

        {/* Main Card Container */}
        <Link
          href={`/song/${song.id}`}
          className="relative bg-linear-to-br from-white/95 to-gray-100/95 dark:from-gray-900/90 dark:to-black/90 backdrop-blur-2xl rounded-2xl border border-gray-200 dark:border-white/10 group-hover:border-gray-300 dark:group-hover:border-white/30 transition-all duration-500 overflow-hidden shadow-lg dark:shadow-none"
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500 via-pink-500 to-blue-500 animate-pulse" />
          </div>

          {/* Album Art Container */}
          <div className="relative aspect-square overflow-hidden">
            {song.coverArt ? (
              <>
                <Image
                  src={song.coverArt}
                  alt={song.title || "Song"}
                  fill
                  className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-2"
                />
                {/* Vinyl Record Effect */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)] opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
              </>
            ) : (
              <div className="w-full h-full bg-linear-to-br from-purple-200/50 via-pink-200/50 to-blue-200/50 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-blue-900/30 flex items-center justify-center">
                <Music2 className="w-16 h-16 text-gray-300 dark:text-white/20" />
              </div>
            )}

            {/* Floating Play Button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
              <div className="relative">
                {/* Pulsing Glow Ring */}
                <div className="absolute inset-0 w-16 h-16 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 bg-purple-400/40 dark:bg-white/30 rounded-full blur-xl animate-pulse" />

                {/* Play Button */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (song.id === currentSong?.id) {
                      if (isPlaying) {
                        pause();
                      } else {
                        play();
                      }
                    }
                  }}
                  className="z-50 relative w-16 h-16 rounded-full bg-white dark:bg-white/95 backdrop-blur-md flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-2xl shadow-purple-500/30 dark:shadow-black/50 hover:shadow-purple-500/50"
                >
                  {isPlaying && song.id === currentSong?.id ? (
                    <Pause
                      fill="currentColor"
                      className="text-purple-600 dark:text-black w-7 h-7 ml-1"
                    />
                  ) : (
                    <Play
                      fill="currentColor"
                      className="text-purple-600 dark:text-black w-7 h-7 ml-1"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Color Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-white/80 via-white/10 to-transparent dark:from-black/90 dark:via-black/20 dark:to-transparent opacity-100 group-hover:opacity-70 transition-opacity duration-500" />
          </div>

          {/* Song Info Section with Gradient Background */}
          <div className="relative p-4 bg-linear-to-br from-white/80 to-gray-50/80 dark:from-black/60 dark:to-black/40 backdrop-blur-sm">
            {/* Animated Top Border */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <h3 className="text-gray-900 dark:text-white font-bold truncate text-lg mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-purple-600 group-hover:to-pink-600 dark:group-hover:from-purple-400 dark:group-hover:to-pink-400 transition-all duration-300">
              {song.title || "Unknown Title"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm truncate group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 font-medium">
              {song.artist || "Unknown Artist"}
            </p>

            {/* Bottom Info Bar */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-white/5">
              {/* Duration */}
              {song.duration && (
                <span className="text-xs text-gray-600 dark:text-gray-500 bg-gray-200 dark:bg-white/5 px-3 py-1.5 rounded-full group-hover:bg-purple-200 dark:group-hover:bg-purple-500/20 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-all duration-300 font-medium">
                  {Math.floor(song.duration / 60)}:
                  {String(song.duration % 60).padStart(2, "0")}
                </span>
              )}

              {/* Animated Music Visualizer Bars */}
              <div
                className={cn(
                  "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  isPlaying && song.id === currentSong?.id
                    ? "opacity-100"
                    : "opacity-0"
                )}
              >
                <div
                  className="w-0.5 h-2 bg-purple-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-0.5 h-3 bg-pink-500 rounded-full animate-pulse"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-0.5 h-4 bg-blue-500 rounded-full animate-pulse"
                  style={{ animationDelay: "300ms" }}
                />
                <div
                  className="w-0.5 h-3 bg-purple-500 rounded-full animate-pulse"
                  style={{ animationDelay: "450ms" }}
                />
                <div
                  className="w-0.5 h-2 bg-pink-500 rounded-full animate-pulse"
                  style={{ animationDelay: "600ms" }}
                />
              </div>
            </div>
          </div>

          {/* Shimmer Sweep Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 dark:via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500" />
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

export default SongCard;
