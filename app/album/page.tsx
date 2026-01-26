"use client";

import { useEffect, useState } from "react";
import AlbumCard from "@/components/AlbumCard";
import { Album } from "@/types/types";

export default function AlbumPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await fetch("/api/albums");
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setAlbums(result.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch albums", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 container">
        <h1 className="text-4xl font-bold text-white neon-text">آلبوم ها</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white/5 rounded-lg aspect-square"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 container">
      <h1 className="text-4xl font-bold text-white neon-text">آلبوم ها</h1>

      {albums.length === 0 ? (
        <div className="text-gray-400 text-lg">هنوز هیچ آلبومی نداریم :(</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  );
}
