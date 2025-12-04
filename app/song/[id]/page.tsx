"use client";

import React, { useEffect, useState } from "react";
import { Song } from "@/types/types";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Heart,
  List,
  ListPlus,
  LoaderIcon,
  LoaderPinwheel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { formatTime } from "@/lib/utils";
import Image from "next/image";
import Lyrics from "@/components/Lyrics";
import Link from "next/link";

export default function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    isPlaying,
    currentSong,
    progress,
    duration,
    play,
    pause,
    next,
    prev,
    setProgress,
    setSeekTo,
    isShuffling,
    toggleShuffle,
    repeatMode,
    setRepeatMode,
  } = usePlayerStore();

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const res = await fetch(`/api/songs/${id}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setSong(result.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch song", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [id]);

  const isCurrentSong = currentSong?.id === id;

  const handlePlayPause = () => {
    if (!song) return;

    if (isCurrentSong) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      // Play this song (add it to queue and play)
      usePlayerStore.getState().setQueue([song], 0);
    }
  };

  const toggleRepeat = () => {
    if (repeatMode === "off") setRepeatMode("all");
    else if (repeatMode === "all") setRepeatMode("one");
    else setRepeatMode("off");
  };

  const handleSeek = (value: number[]) => {
    setProgress(value[0]);
    setSeekTo(value[0]);
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center">
        <p className=" animate-spin">
          <LoaderPinwheel size={60} />
        </p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="size-full flex items-center justify-center">
        <p className="text-muted-foreground text-3xl">Song not found!</p>
      </div>
    );
  }

  const displayProgress = isCurrentSong ? progress : 0;
  const displayDuration = isCurrentSong ? duration : song.duration || 0;
  const hasLyrics = !!song.syncedLyrics || !!song.lyrics;

  return (
    <div
      className={`h-[calc(100dvh-120px)] w-full flex-1 flex justify-center m-0 mx-auto p-0 transition-all duration-500 ${
        hasLyrics
          ? "max-w-7xl flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 px-2"
          : "max-w-4xl flex flex-col items-center justify-center"
      }`}
    >
      {/* Lyrics Column (Left on Desktop) */}
      {hasLyrics && (
        <div className="hidden lg:block h-[calc(100dvh-120px)] bg-card/30 rounded-3xl p-6 border border-white/5 shadow-xl">
          <Lyrics lrc={song.syncedLyrics} plainLyrics={song.lyrics} />
        </div>
      )}

      {/* Main Content (Right or Center) */}
      {/* Main Content (Right or Center) */}
      <div
        className={`flex flex-col items-center justify-between w-full h-full py-2 ${
          hasLyrics
            ? "lg:h-[calc(100dvh-120px)] lg:justify-center lg:gap-8"
            : ""
        }`}
      >
        {/* Art */}
        <div
          className={`w-full aspect-square bg-card rounded-2xl shadow-2xl neon-box relative overflow-hidden group transition-all duration-500 ${
            hasLyrics ? "max-w-[80vw] lg:max-w-sm" : "max-w-md"
          }`}
        >
          {song.coverArt ? (
            <Image
              src={song.coverArt || ""}
              alt={song.title || "Song"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900">
              <span className="text-6xl font-bold text-white/20">♪</span>
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Mobile Lyrics Overlay */}
          {hasLyrics && (
            <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[2px] p-4 lg:hidden overflow-hidden rounded-2xl">
              <Lyrics lrc={song.syncedLyrics} plainLyrics={song.lyrics} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex justify-between w-full px-4">
          <div className="mt-2">
            <Button
              variant="outline"
              className="border-accent text-accent-foreground hover:bg-accent hover:text-white/30 cursor-pointer"
            >
              <ListPlus size="full" className="size-full" />
            </Button>
          </div>
          <div className="text-center flex-1 min-w-0 px-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 line-clamp-1">
              {song.title}
            </h1>
            {song.artist ? (
              song.artists && song.artists.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  {song.artists.map((artist, index) => (
                    <React.Fragment key={artist.id}>
                      <Link
                        href={`/artist/${artist.id}`}
                        className="text-lg md:text-xl text-muted-foreground hover:scale-110 hover:text-foreground transition-transform"
                      >
                        {artist.name}
                      </Link>
                      {index < song.artists.length - 1 && (
                        <span className="text-lg md:text-xl text-muted-foreground">
                          و
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <p className="text-lg md:text-xl text-muted-foreground line-clamp-1">
                  {song.artist || "Unknown Artist"}
                </p>
              )
            ) : (
              <p className="text-lg md:text-xl text-muted-foreground line-clamp-1">
                Unknown Artist
              </p>
            )}
            {song.album && (
              <p className="text-sm text-muted-foreground/70 mt-1 line-clamp-1">
                {song.album}
              </p>
            )}
          </div>

          <div className="mt-2">
            <Button
              variant="outline"
              className="border-accent text-accent-foreground hover:bg-accent hover:text-white/30 cursor-pointer"
            >
              <Heart size={33} />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full px-4">
          <Slider
            value={[displayProgress]}
            onValueChange={handleSeek}
            max={displayDuration || 100}
            step={1}
            className="mb-2 cursor-pointer"
            disabled={!isCurrentSong}
          />
          <div className="flex justify-between text-sm text-muted-foreground cursor-pointer">
            <span>{formatTime(displayProgress)}</span>
            <span>{formatTime(displayDuration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 md:gap-8">
          <Button
            variant="ghost"
            size="icon"
            className={`hover:bg-transparent scale-125 cursor-pointer ${
              isShuffling
                ? "text-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={toggleShuffle}
          >
            <Shuffle size={24} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-transparent scale-125 cursor-pointer"
            onClick={prev}
          >
            <SkipBack size={32} />
          </Button>
          <Button
            size="icon"
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent dark:bg-cyan-800 text-white hover:scale-105 transition-transform neon-box hover:bg-accent/90 flex items-center justify-center cursor-pointer"
            onClick={handlePlayPause}
          >
            {isCurrentSong && isPlaying ? (
              <Pause
                className="w-10 h-10 md:w-[60px] md:h-[60px]"
                fill="currentColor"
              />
            ) : (
              <Play
                className="w-10 h-10 md:w-[60px] md:h-[60px] ml-1"
                fill="currentColor"
              />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-transparent scale-125 cursor-pointer"
            onClick={next}
          >
            <SkipForward size={32} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`hover:bg-transparent scale-125 cursor-pointer ${
              repeatMode !== "off"
                ? "text-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={toggleRepeat}
          >
            {repeatMode === "one" ? (
              <Repeat1 size={24} />
            ) : (
              <Repeat size={24} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
