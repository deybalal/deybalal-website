'use client';

import { useEffect, useState } from 'react';
import SongList from "@/components/SongList";
import { Album } from "@/types/types";
import Image from "next/image";

export default function AlbumDetailPage({ params }: { params: { id: string } }) {
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const res = await fetch('/api/albums', { method: 'POST' });
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            const foundAlbum = result.data.find((a: Album) => a.id === params.id);
            setAlbum(foundAlbum || null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch album', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [params.id]);

  if (loading) return <div className="text-white">Loading...</div>;
  if (!album) return <div className="text-white">Album not found</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-end">
        <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-2xl neon-box shrink-0">
           {album.coverArt ? (
             <img src={album.coverArt} alt={album.name} className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500 text-2xl">No Art</span>
              </div>
           )}
        </div>
        <div className="flex flex-col gap-2 pb-2">
          <span className="text-accent uppercase tracking-widest text-sm font-bold">Album</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white neon-text">{album.name}</h1>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="font-medium text-white hover:underline cursor-pointer">{album.artistName}</span>
            <span>•</span>
            <span>{new Date(album.createdAt).getFullYear()}</span>
            <span>•</span>
            <span>{album.songs?.length || 0} songs</span>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <SongList songs={album.songs || []} />
    </div>
  );
}
