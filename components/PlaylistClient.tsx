"use client";

import React, { useState } from "react";
import SongList from "@/components/SongList";
import { Playlist } from "@/types/types";
import { ListMusic, Lock, Globe } from "lucide-react";
import { formatTime } from "@/lib/utils";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import Pagination from "@/components/Pagination";
import { ShareButtons } from "@/components/ShareButtons";

type Props = {
  playlist: Playlist;
  sessionUserId: string | null;
  currentPage: number;
  totalPages: number;
};

export default function PlaylistClient({
  playlist: initialPlaylist,
  sessionUserId,
  currentPage,
  totalPages,
}: Props) {
  const [playlist, setPlaylist] = useState(initialPlaylist);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-end">
        <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-2xl neon-box shrink-0 bg-linear-to-br from-primary to-accent flex items-center justify-center">
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

        <div className="flex flex-col gap-2 pb-2 flex-1">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <span className="text-gray-500 uppercase tracking-widest text-sm font-bold">
                Playlist
              </span>
              <h1 className="text-5xl md:text-7xl font-bold neon-text">
                {playlist.name}
              </h1>
            </div>

            {sessionUserId === playlist.userId && (
              <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                {playlist.isPrivate ? (
                  <Lock size={16} className="text-red-400" />
                ) : (
                  <Globe size={16} className="text-green-400" />
                )}
                <span className="text-sm font-medium text-gray-300">
                  {" "}
                  {playlist.isPrivate
                    ? "Playlist is Private. Make it Public?"
                    : "Playlist is Public. Make it Private?"}{" "}
                </span>
                <Switch
                  checked={playlist.isPrivate}
                  onCheckedChange={async (checked) => {
                    const prev = playlist.isPrivate;
                    setPlaylist({ ...playlist, isPrivate: checked });

                    try {
                      const res = await fetch(`/api/playlists/${playlist.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isPrivate: checked }),
                      });

                      const result = await res.json();
                      if (!result.success) throw new Error();
                      toast.success(
                        `Playlist is now ${checked ? "private" : "public"}`
                      );
                    } catch {
                      setPlaylist({ ...playlist, isPrivate: prev });
                      toast.error("Failed to update privacy");
                    }
                  }}
                />
              </div>
            )}
          </div>

          {playlist.description && (
            <p className="text-gray-300 text-lg max-w-2xl">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center justify-between text-gray-400 mt-2">
            <div className="flex items-center gap-2">
              <span>{playlist.songsLength} songs</span>
              {playlist.duration > 0 && (
                <>
                  <span>•</span>
                  <span>{formatTime(playlist.duration)}</span>
                </>
              )}
            </div>
            <ShareButtons
              title={playlist.name}
              url={`/playlists/${playlist.id}`}
              type="playlist"
            />
          </div>
        </div>
      </div>

      {/* Songs */}
      <div className="space-y-4">
        <SongList
          songs={playlist.songs}
          onRemove={async (songId) => {
            try {
              const res = await fetch(
                `/api/playlists/${playlist.id}/remove-song`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ songId }),
                }
              );

              const result = await res.json();
              if (result.success) {
                setPlaylist({
                  ...playlist,
                  songs: playlist.songs.filter((s) => s.id !== songId),
                });
                toast.success("Song removed");
              }
            } catch {
              toast.error("Failed to remove song");
            }
          }}
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </div>
  );
}
