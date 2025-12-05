"use client";

import { useEffect, useState } from "react";
import SongList from "@/components/SongList";
import { Song } from "@/types/types";
import { Heart, LoaderPinwheel } from "lucide-react";

export default function FavoritesPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await fetch("/api/favorites");
        const data = await res.json();
        if (data.success && data.data.songs) {
          setSongs(data.data.songs);
        }
      } catch (error) {
        console.error("Failed to fetch favorites", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center">
        <p className="animate-spin">
          <LoaderPinwheel size={60} />
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-end">
        <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-2xl neon-box shrink-0 bg-linear-to-br from-pink-600 to-purple-700 flex items-center justify-center">
          <Heart size={80} className="text-white fill-white" />
        </div>
        <div className="flex flex-col gap-2 pb-2">
          <span className="text-accent uppercase tracking-widest text-sm font-bold">
            Collection
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-white neon-text">
            Liked Songs
          </h1>
          <div className="flex items-center gap-2 text-gray-300 mt-2">
            <span>{songs.length} songs</span>
          </div>
        </div>
      </div>

      {/* Songs List */}
      {songs.length > 0 ? (
        <SongList songs={songs} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Heart className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">No favorite songs yet</p>
          <p className="text-sm mt-2">
            Click the heart icon on songs to add them to your favorites!
          </p>
        </div>
      )}
    </div>
  );
}
