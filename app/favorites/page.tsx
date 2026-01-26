"use client";

import { useEffect, useState } from "react";
import SongList from "@/components/SongList";
import { Song } from "@/types/types";
import { Heart, LoaderPinwheel } from "lucide-react";
import Pagination from "@/components/Pagination";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function FavoritesPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSongs, setTotalSongs] = useState(0);
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 20;

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/favorites?page=${page}&pageSize=${pageSize}`
        );
        const data = await res.json();
        if (data.success && data.data) {
          setSongs(data.data.songs);
          setTotalSongs(data.data._count.songs);
        }
      } catch (error) {
        console.error("Failed to fetch favorites", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [page]);

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
    <div className="space-y-8 w-[95%] md:w-7/12">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
        <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-2xl neon-box shrink-0 bg-linear-to-br from-pink-600 to-purple-700 flex items-center justify-center">
          <Heart size={80} className="text-white fill-white" />
        </div>
        <div className="flex flex-col gap-2 pb-2">
          <span className="text-foreground/70 uppercase tracking-widest text-sm font-bold">
            مجموعه
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-white neon-text">
            آهنگ های موردعلاقه
          </h1>
          <div className="flex items-center gap-2 text-gray-300 mt-2">
            <span>{totalSongs} آهنگ</span>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="space-y-4">
        {songs.length > 0 ? (
          <>
            <SongList songs={songs} />
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(totalSongs / pageSize)}
            />
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Heart className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl">هیچ آهنگ موردعلاقه ای ندارید!</p>
            <p className="text-xl mt-2 flex justify-center items-center">
              ابتدا{" "}
              <Link className="text-teal-600 text-2xl mx-3" href="/login">
                وارد حساب کاربری
              </Link>{" "}
              شوید و آهنگ مورد علاقه ی خود را پیدا کنید و روی علامت قلب{" "}
              <Heart className="text-red-500" /> کلیک کنید!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
