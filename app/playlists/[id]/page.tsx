"use client";

import React, { useEffect, useState } from "react";
import SongList from "@/components/SongList";
import { Playlist } from "@/types/types";
import { ListMusic, Loader2 } from "lucide-react";
import { formatTime } from "@/lib/utils";
import Image from "next/image";

export default function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const res = await fetch(`/api/playlists/${id}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setPlaylist(result.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch playlist", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
        <ListMusic className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-xl">Playlist not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-end">
        <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-2xl neon-box shrink-0 bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          {playlist.coverArt ? (
            <Image
              src={playlist.coverArt}
              alt={playlist.name}
              fill
              className="object-cover"
            />
          ) : (
            <ListMusic size={80} className="text-white opacity-50" />
          )}
        </div>
        <div className="flex flex-col gap-2 pb-2">
          <span className="text-accent uppercase tracking-widest text-sm font-bold">
            Playlist
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-white neon-text">
            {playlist.name}
          </h1>
          {playlist.description && (
            <p className="text-gray-300 text-lg max-w-2xl">
              {playlist.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-gray-400 mt-2">
            <span>{playlist.songs?.length || 0} songs</span>
            {playlist.duration > 0 && (
              <>
                <span>•</span>
                <span>{formatTime(playlist.duration)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Songs List */}
      <SongList songs={playlist.songs || []} />
    </div>
  );
}
