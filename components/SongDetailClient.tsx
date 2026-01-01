"use client";

import React, { useEffect, useState } from "react";
import { Song } from "@/types/types";
import { Play, Pause, Heart, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import SongProgressSlider from "@/components/SongProgressSlider";
import Image from "next/image";
import Lyrics from "@/components/Lyrics";
import Link from "next/link";
import AddToPlaylistDialog from "@/components/AddToPlaylistDialog";
import { toast } from "react-hot-toast";
import { useLyricsStore } from "@/hooks/useLyricsStore";

interface SongDetailClientProps {
  song: Song;
  isUserLoggedIn: boolean;
}

export default function SongDetailClient({
  song,
  isUserLoggedIn,
}: SongDetailClientProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const play = usePlayerStore((state) => state.play);
  const pause = usePlayerStore((state) => state.pause);
  const { lyricsMode } = useLyricsStore();

  const isCurrentSong = currentSong?.id === song.id;

  const handlePlayPause = () => {
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

  // Check if song is in favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!isUserLoggedIn) return;
      try {
        const res = await fetch("/api/favorites/isfavorite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songId: song.id }),
        });
        const data = await res.json();
        if (data.success && data.isFavorite) {
          setIsFavorite(true);
        }
      } catch (error) {
        console.error("Failed to check favorite status", error);
      }
    };

    checkFavoriteStatus();
  }, [isUserLoggedIn, song.id]);

  const toggleFavorite = async () => {
    if (isTogglingFavorite || isUserLoggedIn === false) return;

    setIsTogglingFavorite(true);
    try {
      const endpoint = isFavorite
        ? "/api/favorites/remove-song"
        : "/api/favorites/add-song";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: song.id }),
      });

      const result = await res.json();

      if (result.success) {
        setIsFavorite(!isFavorite);
        toast.success(
          isFavorite ? "Removed from favorites" : "Added to favorites"
        );
      } else {
        toast.error(result.message || "Failed to update favorites");
      }
    } catch (error) {
      console.error("Failed to toggle favorite", error);
      toast.error("Failed to update favorites");
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const showLyrics =
    lyricsMode !== "hidden" && (!!song.syncedLyrics || !!song.lyrics);
  const showSynced = lyricsMode === "synced" && !!song.syncedLyrics;

  return (
    <div
      className={`h-[calc(100dvh-120px)] w-full flex-1 flex justify-center m-0 mx-auto p-0 transition-all duration-500 ${
        showLyrics
          ? "max-w-7xl flex flex-col lg:grid lg:grid-cols-2 lg:gap-12 px-2"
          : "max-w-4xl flex flex-col items-center justify-center"
      }`}
    >
      {/* Lyrics Column (Left on Desktop) */}
      {showLyrics && (
        <div className="hidden lg:block h-[calc(100dvh-120px)] bg-card/30 rounded-3xl p-6 border border-white/5 shadow-xl">
          <Lyrics
            lrc={showSynced ? song.syncedLyrics : null}
            plainLyrics={song.lyrics}
            songId={song.id}
          />
        </div>
      )}

      {/* Main Content (Right or Center) */}
      <div
        className={`flex flex-col items-center justify-between w-full h-full py-2 ${
          showLyrics
            ? "lg:h-[calc(100dvh-120px)] lg:justify-center lg:gap-8"
            : ""
        }`}
      >
        {/* Art */}
        <div
          className={`w-full aspect-square bg-card rounded-2xl shadow-2xl neon-box relative overflow-hidden group transition-all duration-500 ${
            showLyrics ? "max-w-[90vw] lg:max-w-sm" : "max-w-md"
          }`}
        >
          {song.coverArt ? (
            <Image
              src={song.coverArt || "/images/cover.png"}
              alt={song.title || "Song"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900">
              <span className="text-6xl font-bold text-white/20">♪</span>
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Mobile Lyrics Overlay */}
          {showLyrics && (
            <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[2px] p-4 lg:hidden overflow-hidden rounded-2xl">
              <Lyrics
                lrc={showSynced ? song.syncedLyrics : null}
                plainLyrics={song.lyrics}
                songId={song.id}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex justify-between w-full px-4">
          <div className="mt-2">
            {isUserLoggedIn ? (
              <AddToPlaylistDialog
                songId={song.id}
                trigger={
                  <Button
                    variant="outline"
                    className="border-accent text-accent-foreground hover:bg-accent hover:text-white/30 cursor-pointer"
                  >
                    <ListPlus size={33} className="size-full" />
                  </Button>
                }
              />
            ) : (
              <Button
                variant="outline"
                className="border-accent text-accent-foreground hover:bg-accent hover:text-white/30 cursor-pointer"
                onClick={() => toast.error("You should Login first!")}
              >
                <ListPlus size={33} className="size-full" />
              </Button>
            )}
          </div>
          <div className="text-center flex-1 min-w-0 px-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
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
            {song.album &&
              (song.albumId ? (
                <Link
                  href={`/album/${song.albumId}`}
                  className="text-sm text-foreground/80 hover:text-foreground mt-1 line-clamp-1"
                >
                  {song.album}
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground/70 mt-1 line-clamp-1">
                  {song.album}
                </p>
              ))}
            {song.genres && song.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {song.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-center mt-4">
              {!song.lyrics && (
                <Link href={`/panel/edit/lyrics/${song.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs cursor-pointer"
                  >
                    Add Lyrics
                  </Button>
                </Link>
              )}
              {song.lyrics && !song.syncedLyrics && (
                <Link href={`/panel/edit/sync/${song.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs cursor-pointer"
                  >
                    Sync Lyrics
                  </Button>
                </Link>
              )}
              {song.lyrics && !song.syncedLyrics && (
                <Link href={`/panel/edit/synced/${song.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs cursor-pointer"
                  >
                    Paste Synced Lyrics
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="mt-2">
            <Button
              variant="outline"
              onClick={
                isUserLoggedIn
                  ? toggleFavorite
                  : () => toast.error("You should Login first!")
              }
              disabled={isTogglingFavorite}
              className="border-accent text-accent-foreground hover:bg-accent hover:text-white/30 cursor-pointer"
            >
              <Heart
                size={33}
                className={isFavorite ? "fill-red-500 text-red-500" : ""}
              />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <SongProgressSlider song={song} />

        {/* Controls */}
        <div className="flex items-center gap-6 md:gap-8">
          <div className="relative group">
            {/* Pulsing effect when playing */}
            {isCurrentSong && isPlaying && (
              <div className="absolute inset-0 rounded-full bg-indigo-500/50 animate-ping" />
            )}
            <Button
              size="icon"
              className="relative z-10 w-18 h-18 md:w-24 md:h-24 rounded-full bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-indigo-500/40 hover:scale-110 hover:shadow-indigo-500/60 ring-4 ring-white/10 transition-all duration-300 flex items-center justify-center cursor-pointer"
              onClick={handlePlayPause}
            >
              {isCurrentSong && isPlaying ? (
                <Pause className="size-10 md:size-12 fill-white" />
              ) : (
                <Play className="size-10 md:size-12 fill-white" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
