"use client";

import React, { useState, useCallback, useEffect } from "react";
import SongList from "@/components/SongList";
import { Playlist, Song } from "@/types/types";
import { ListMusic, Lock, Globe, Play, Loader2, Heart } from "lucide-react";
import { formatTime } from "@/lib/utils";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Pagination from "@/components/Pagination";
import { ShareButtons } from "@/components/ShareButtons";
import SearchModal from "@/components/SearchModal";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import PlayAsRadioButton from "@/components/PlayAsRadioButton";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { SortDropdown, SortOption } from "@/components/SortDropdown";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, PlayCircle, ArrowDownAZ, Calendar } from "lucide-react";

type Props = {
  playlist: Playlist & { doesUserOwnsPlaylist: boolean };
  currentPage: number;
  totalPages: number;
  searchType?: "artist" | "album" | "playlist" | "radioPlaylist";
};

export default function PlaylistClient({
  playlist: initialPlaylist,
  currentPage,
  totalPages,
  searchType = "playlist",
}: Props) {
  const [playlist, setPlaylist] = useState(initialPlaylist);

  useEffect(() => {
    setPlaylist(initialPlaylist);
  }, [initialPlaylist]);

  const { setQueue } = usePlayerStore();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const onSortChange = (sortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSortBy = searchParams.get("sortBy");
    const currentOrder = searchParams.get("sortOrder") || "desc";

    if (currentSortBy === sortBy) {
      params.set("sortOrder", currentOrder === "desc" ? "asc" : "desc");
    } else {
      params.set("sortBy", sortBy);
      params.set("sortOrder", "desc");
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const sortOptions: SortOption[] = [
    {
      label: "زمان اضافه شدن",
      value: "addedAt",
      icon: <Clock className="w-4 h-4" />,
    },
    {
      label: "جدیدترین انتشار",
      value: "createdAt",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      label: "بیشترین پخش",
      value: "playCount",
      icon: <PlayCircle className="w-4 h-4" />,
    },
    {
      label: "نام (الفبا)",
      value: "title",
      icon: <ArrowDownAZ className="w-4 h-4" />,
    },
  ];

  const sortBy = searchParams.get("sortBy") || "addedAt";

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
    } else if (playlist.songs.length > 0) {
      // Fallback to paginated songs if API fails
      setQueue(playlist.songs);
    }
  };

  const handlePlaylistPrivacyToggle = async (isPrivate: boolean) => {
    const prev = playlist.isPrivate;
    setPlaylist({ ...playlist, isPrivate });

    try {
      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrivate }),
      });

      const result = await res.json();
      if (!result.success) throw new Error();
      toast.success(`پلی لیست اکنون ${isPrivate ? "خصوصی" : "عمومی"} است`);
    } catch {
      setPlaylist({ ...playlist, isPrivate: prev });
      toast.error("خطا در بروزرسانی وضعیت نمایش");
    }
  };

  return (
    <div className="space-y-8 mb-24 h-max w-full lg:w-7/12">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-end">
        <div className="flex w-full md:max-w-max justify-center">
          <div
            className={`relative w-64 h-64 rounded-lg overflow-hidden shadow-2xl neon-box shrink-0 flex items-center justify-center ${
              playlist.isFavorite
                ? "bg-linear-to-br from-pink-600 to-purple-700"
                : "bg-linear-to-br from-primary to-accent"
            }`}
          >
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
        </div>

        <div className="flex flex-col gap-2 pb-2 flex-1">
          <div className="flex justify-between items-start flex-col md:flex-row">
            <div className="flex flex-col gap-2">
              <span className="text-gray-500 uppercase tracking-widest text-sm font-bold">
                پلی لیست
              </span>
              <h1 className="text-3xl md:text-5xl font-bold neon-text">
                {playlist.isFavorite ? "آهنگ های موردعلاقه" : playlist.name}
              </h1>
            </div>

            {playlist.doesUserOwnsPlaylist && (
              <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg backdrop-blur-sm border border-white/10 m-4 md:m-0 mt-8">
                <span className="text-sm font-medium text-gray-300">
                  نمایش:
                </span>
                <Button
                  variant={playlist.isPrivate ? "outline" : "default"}
                  size="sm"
                  onClick={async () => {
                    await handlePlaylistPrivacyToggle(false);
                  }}
                  className={
                    !playlist.isPrivate ? "bg-green-600 hover:bg-green-700" : ""
                  }
                >
                  <Globe size={16} className="mr-1" />
                  عمومی
                </Button>
                <Button
                  variant={playlist.isPrivate ? "default" : "outline"}
                  size="sm"
                  onClick={async () => {
                    await handlePlaylistPrivacyToggle(true);
                  }}
                  className={
                    playlist.isPrivate ? "bg-red-600 hover:bg-red-700" : ""
                  }
                >
                  <Lock size={16} className="mr-1" />
                  خصوصی
                </Button>
              </div>
            )}
          </div>

          {playlist.description && (
            <p className="text-gray-300 text-lg max-w-2xl">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center justify-between text-gray-400 mt-2 flex-col md:flex-row gap-y-4">
            <div className="flex items-center gap-2">
              <span>{playlist.songsLength} آهنگ</span>
              {playlist.duration > 0 && (
                <>
                  <span>•</span>
                  <span>{formatTime(playlist.duration)}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-4">
              <SearchModal
                scope={{
                  type: searchType,
                  id: playlist.id,
                  name: playlist.isFavorite
                    ? "آهنگ های موردعلاقه"
                    : playlist.name,
                }}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                  >
                    <Search className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </Button>
                }
              />
              <ShareButtons
                title={
                  playlist.isFavorite ? "آهنگ های موردعلاقه" : playlist.name
                }
                url={
                  playlist.isFavorite
                    ? "/favorites"
                    : `/playlists/${playlist.id}`
                }
              />
            </div>
          </div>

          {/* Play Buttons */}
          {searchType !== "radioPlaylist" && (
            <div className="flex items-center gap-3 mt-3">
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
                songs={playlist.songs}
                fetchAllSongs={fetchAllSongs}
              />
            </div>
          )}
        </div>
      </div>

      {/* Songs */}
      <div className="space-y-4">
        {playlist.songsLength > 0 && (
          <div className="flex w-full justify-end">
            <div className="flex items-center max-w-[50%] md:max-w-max">
              <SortDropdown
                options={sortOptions}
                value={sortBy}
                onChange={onSortChange}
                className="w-full md:w-[200px]"
              />
            </div>
          </div>
        )}

        {playlist.songsLength > 0 ? (
          <>
            <SongList
              songs={playlist.songs}
              onRemove={async (songId) => {
                const deleteUrl = playlist.isFavorite
                  ? `/api/favorites/remove-song`
                  : `/api/playlists/${playlist.id}/remove-song`;
                try {
                  const res = await fetch(deleteUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ songId }),
                  });

                  const result = await res.json();
                  if (result.success) {
                    setPlaylist({
                      ...playlist,
                      songs: playlist.songs.filter((s) => s.id !== songId),
                      songsLength: Math.max(0, playlist.songsLength - 1),
                    });
                    toast.success(
                      playlist.isFavorite
                        ? "از لیست علاقه مندی ها حذف شد"
                        : "آهنگ حذف شد"
                    );
                  } else {
                    toast.error(result.message);
                  }
                } catch {
                  toast.error(
                    playlist.isFavorite
                      ? "خطا در حذف از لیست علاقه مندی ها"
                      : "خطا در حذف آهنگ"
                  );
                }
              }}
            />
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-black/10 rounded-2xl border border-white/5 p-8">
            {playlist.isFavorite ? (
              <>
                <Heart className="h-16 w-16 mx-auto mb-4 opacity-50 text-red-500 fill-red-500 animate-pulse" />
                <p className="text-xl font-bold text-white">
                  هیچ آهنگ موردعلاقه ای ندارید!
                </p>
                <p className="text-md text-gray-400 mt-2">
                  آهنگ مورد علاقه ی خود را پیدا کنید و روی علامت قلب کلیک کنید!
                </p>
              </>
            ) : (
              <>
                <ListMusic className="h-16 w-16 mx-auto mb-4 opacity-50 text-violet-500 animate-pulse" />
                <p className="text-xl font-bold text-white">
                  این پلی لیست خالی است!
                </p>
                <p className="text-md text-gray-400 mt-2">
                  با استفاده از دکمه افزودن، آهنگ های مورد نظرتان را به این پلی
                  لیست اضافه کنید.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
