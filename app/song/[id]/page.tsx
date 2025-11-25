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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { formatTime } from "@/lib/utils";
import Image from "next/image";

export default function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  console.log("Whey ", id);

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
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Song not found</p>
      </div>
    );
  }

  const displayProgress = isCurrentSong ? progress : 0;
  const displayDuration = isCurrentSong ? duration : song.duration || 0;

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto py-10">
      {/* Art */}
      <div className="w-full max-w-md aspect-square bg-card rounded-2xl shadow-2xl mb-10 neon-box relative overflow-hidden group">
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
      </div>

      {/* Info */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {song.title}
        </h1>
        <p className="text-xl text-muted-foreground">
          {song.artist || "Unknown Artist"}
        </p>
        {song.album && (
          <p className="text-sm text-muted-foreground/70 mt-1">{song.album}</p>
        )}
      </div>

      {/* Progress */}
      <div className="w-full mb-8 px-4">
        <Slider
          value={[displayProgress]}
          onValueChange={handleSeek}
          max={displayDuration || 100}
          step={1}
          className="mb-2"
          disabled={!isCurrentSong}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatTime(displayProgress)}</span>
          <span>{formatTime(displayDuration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8">
        <Button
          variant="ghost"
          size="icon"
          className={`hover:bg-transparent scale-125 ${
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
          className="text-muted-foreground hover:text-foreground hover:bg-transparent scale-125"
          onClick={prev}
        >
          <SkipBack size={32} />
        </Button>
        <Button
          size="icon"
          className="w-20 h-20 rounded-full bg-accent text-accent-foreground hover:scale-105 transition-transform neon-box hover:bg-accent/90 flex items-center justify-center"
          onClick={handlePlayPause}
        >
          {isCurrentSong && isPlaying ? (
            <Pause size={60} fill="currentColor" />
          ) : (
            <Play size={60} fill="currentColor" className="m" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-transparent scale-125"
          onClick={next}
        >
          <SkipForward size={32} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`hover:bg-transparent scale-125 ${
            repeatMode !== "off"
              ? "text-accent"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={toggleRepeat}
        >
          {repeatMode === "one" ? <Repeat1 size={24} /> : <Repeat size={24} />}
        </Button>
      </div>

      <div className="mt-10">
        <Button
          variant="outline"
          className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
        >
          <Heart size={20} />
          Add to Favorites
        </Button>
      </div>
    </div>
  );
}
