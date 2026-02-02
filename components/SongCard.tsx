import { Card, CardContent } from "@/components/ui/card";
import { Song } from "@/types/types";
import { Play, Music2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPlayCount } from "@/lib/utils";
import SongCardPlayButton from "./SongCardPlayButton";
import SongCardContextMenu from "./SongCardContextMenu";

interface SongCardProps {
  song: Song;
}

const SongCard = ({ song }: SongCardProps) => {
  return (
    <SongCardContextMenu
      songId={song.id}
      title={song.title ?? ""}
      titleEn={song.titleEn ?? null}
      uri={song.uri}
      filename={song.filename}
      index={song.index}
      duration={song.duration}
      coverArt={song.coverArt}
      artist={song.artist ?? ""}
      album={song.album}
      playCount={song.playCount ?? 0}
      albumId={song.albumId}
      year={song.year ?? ""}
      links={song.links ?? null}
    >
      <Card className="group relative overflow-hidden cursor-pointer border-0 bg-transparent">
        <CardContent className="p-0">
          {/* Animated Border Gradient */}
          <div className="absolute inset-0 bg-linear-to-br from-purple-500/50 via-pink-500/50 to-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

          {/* Main Card Container */}
          <Link
            href={`/song/${song.id}`}
            className="relative bg-linear-to-br from-white/95 to-gray-100/95 dark:from-gray-900/90 dark:to-black/90 backdrop-blur-2xl rounded-2xl border border-gray-200 dark:border-white/10 group-hover:border-gray-300 dark:group-hover:border-white/30 transition-all duration-500 overflow-hidden shadow-lg dark:shadow-none block"
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
              <SongCardPlayButton
                songId={song.id}
                title={song.title ?? ""}
                titleEn={song.titleEn ?? null}
                uri={song.uri}
                filename={song.filename}
                index={song.index}
                duration={song.duration}
                coverArt={song.coverArt}
                artist={song.artist ?? ""}
                album={song.album}
                playCount={song.playCount ?? 0}
                albumId={song.albumId}
                year={song.year ?? ""}
                links={song.links ?? null}
              />

              {/* Color Gradient Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-white/80 via-white/10 to-transparent dark:from-black/90 dark:via-black/20 dark:to-transparent opacity-100 group-hover:opacity-70 transition-opacity duration-500" />
            </div>

            {/* Song Info Section with Gradient Background */}
            <div className="relative p-4 bg-linear-to-br from-white/80 to-gray-50/80 dark:from-black/60 dark:to-black/40 backdrop-blur-sm">
              {/* Animated Top Border */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <h3 className="text-gray-900 dark:text-white font-bold truncate text-base md:text-lg mb-0.5 md:mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-linear-to-r group-hover:from-purple-600 group-hover:to-pink-600 dark:group-hover:from-purple-400 dark:group-hover:to-pink-400 transition-all duration-300 line-clamp-1">
                {song.title || "بدون عنوان"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm truncate group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 font-medium line-clamp-1">
                {song.artist || "خواننده ناشناس"}
              </p>

              {/* Bottom Info Bar */}
              <div className="flex items-center justify-between mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200 dark:border-white/5">
                {/* Duration & Play Count */}
                <div className="flex items-center gap-1.5 md:gap-2">
                  {song.duration && (
                    <span className="text-[10px] md:text-xs ltr text-gray-600 dark:text-gray-500 bg-gray-200 dark:bg-white/5 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full group-hover:bg-purple-200 dark:group-hover:bg-purple-500/20 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-all duration-300 font-medium">
                      {Math.floor(song.duration / 60)}:
                      {String(song.duration % 60).padStart(2, "0")}
                    </span>
                  )}
                  <span className="text-[9px] md:text-[10px] ltr text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full flex items-center gap-1">
                    <Play size={9} className="fill-current" />
                    {formatPlayCount(song.playCount)}
                  </span>
                </div>

                {/* Animated Music Visualizer Bars - Will be handled by client component via CSS */}
                <div className="flex items-center gap-0.5 transition-opacity duration-300 shrink-0 opacity-0 group-hover:opacity-40">
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
    </SongCardContextMenu>
  );
};

export default SongCard;
