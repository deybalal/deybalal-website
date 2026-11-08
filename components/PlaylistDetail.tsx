"use client";

import React, { useState, useCallback } from "react";
import SongList from "@/components/SongList";
import { Playlist, Song } from "@/types/types";
import { ListMusic, Lock, Globe, Play, Loader2 } from "lucide-react";
import { formatTime, getAssetUrl } from "@/lib/utils";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import PlayAsRadioButton from "./PlayAsRadioButton";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { Button } from "@/components/ui/button";

interface PlaylistDetailProps {
  initialPlaylist: Playlist;
  currentUserId?: string;
}

export default function PlaylistDetail({
  initialPlaylist,
  currentUserId,
}: PlaylistDetailProps) {
  const [playlist, setPlaylist] = useState<Playlist>(initialPlaylist);
  const { setQueue } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllSongs = useCallback(async (): Promise<Song[] | null> => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/playlists/${playlist.id}/songs`);
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        return data.data;
      }
      return null;
    } catch {
      toast.error("خطا در دریافت لیست آهنگ ها");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [playlist.id]);

  const handlePlay = async () => {
    const allSongs = await fetchAllSongs();
    if (allSongs && allSongs.length > 0) {
      setQueue(allSongs);
    } else if (playlist.songs?.length > 0) {
      setQueue(playlist.songs);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-end">
        <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-2xl neon-box shrink-0 bg-linear-to-br from-primary to-accent flex items-center justify-center">
          {playlist.coverArt ? (
            <Image
              src={getAssetUrl(playlist.coverArt)}
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
                پلی لیست
              </span>
              <h1 className="text-5xl md:text-7xl font-bold text-white neon-text">
                {playlist.name}
              </h1>
            </div>
            {currentUserId === playlist.userId && (
              <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-2 me-2">
                  {playlist.isPrivate ? (
                    <Lock size={16} className="text-red-400" />
                  ) : (
                    <Globe size={16} className="text-green-400" />
                  )}
                  <span className="text-sm font-medium text-gray-300">
                    {playlist.isPrivate
                      ? "پلی لیست خصوصی است. عمومی شود؟"
                      : "پلی لیست عمومی است. خصوصی شود؟"}
                  </span>
                </div>
                <Switch
                  checked={playlist.isPrivate || false}
                  onCheckedChange={async (checked) => {
                    // Optimistic update
                    setPlaylist({ ...playlist, isPrivate: checked });
                    try {
                      const res = await fetch(`/api/playlists/${playlist.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isPrivate: checked }),
                      });
                      const result = await res.json();
                      if (result.success) {
                        toast.success(
                          `پلی لیست اکنون ${checked ? "خصوصی" : "عمومی"} است`
                        );
                      } else {
                        // Revert on failure
                        setPlaylist({ ...playlist, isPrivate: !checked });
                        toast.error(
                          result.message || "خطا در بروزرسانی وضعیت نمایش"
                        );
                      }
                    } catch {
                      setPlaylist({ ...playlist, isPrivate: !checked });
                      toast.error("خطا در بروزرسانی وضعیت نمایش");
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
          <div className="flex flex-col md:flex-row md:items-center gap-4 mt-2">
             <div className="flex items-center gap-2 text-gray-400">
              <span>{playlist.songs?.length || 0} آهنگ</span>
              {playlist.duration > 0 && (
                <>
                  <span>•</span>
                  <span>{formatTime(playlist.duration)}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handlePlay}
                disabled={isLoading}
                className="gap-2 rounded-full font-bold bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-lg hover:scale-105 transition-all duration-300 px-6 py-3 h-auto"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                پخش همه
              </Button>
              <PlayAsRadioButton
                songs={playlist.songs || []}
                contextId={playlist.id}
                contextType="playlist"
                fetchAllSongs={fetchAllSongs}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <SongList
        songs={playlist.songs || []}
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
              // Refresh playlist
              const res = await fetch(`/api/playlists/${playlist.id}`);
              if (res.ok) {
                const data = await res.json();
                if (data.success) {
                  setPlaylist(data.data);
                  toast.success("آهنگ از پلی لیست حذف شد");
                } else {
                  toast.error(result.message);
                }
              } else {
                toast.error("خطا در حذف آهنگ");
              }
            } else {
              console.error(result.message);
            }
          } catch (error) {
            console.error("Failed to remove song", error);
          }
        }}
      />
    </div>
  );
}
