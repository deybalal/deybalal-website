"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import PlaylistClient from "@/components/PlaylistClient";
import PlaylistSkeleton from "@/components/PlaylistSkeleton";
import { Playlist } from "@/types/types";
import { getAssetUrl, resolveSongLinks } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

function TodayHistoryPageContent() {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = 20;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState<
    (Playlist & { doesUserOwnsPlaylist: boolean }) | null
  >(null);
  const [totalPages, setTotalPages] = useState(1);

  const currentSongId = usePlayerStore((state) => state.currentSong?.id);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchPlaylistData = useCallback(async () => {
    try {
      const res = await fetch("/api/radio/history/today");
      const data = await res.json();
      if (data.success) {
        const raw = data.data;

        // SERVER already filtered for elapsed tracks
        // REVERSE order as requested
        const reversedTracks = [...raw.tracks].reverse();

        const totalTracksCount = reversedTracks.length;
        setTotalPages(Math.max(1, Math.ceil(totalTracksCount / pageSize)));

        const paginatedTracks = reversedTracks.slice(
          (currentPage - 1) * pageSize,
          currentPage * pageSize
        );

        const transformed: Playlist & { doesUserOwnsPlaylist: boolean } = {
          ...raw,
          name: "لیست پخش امروز",
          description:
            "آهنگ هایی که تا این لحظه در رادیو پخش شده است (به ترتیب از جدید به قدیم)",
          songsLength: totalTracksCount,
          coverArt: getAssetUrl(reversedTracks[0]?.song?.coverArt, "/images/cover.png"),
          songs: paginatedTracks.map(
            (track: {
              startOffset: number;
              duration: number;
              songId: string;
              song: {
                artists: {
                  createdAt: Date;
                  updatedAt: Date;
                  id: string;
                  name: string;
                  userId: string | null;
                  image: string | null;
                  isVerified: boolean;
                  description: string | null;
                  nameEn: string | null;
                }[];
              } & {
                duration: number;
                artist: string;
                title: string;
                coverArt: string | null;
                uri: string;
                filename: string | null;
                albumName: string | null;
                albumId: string | null;
                links: string;
                createdAt: Date;
                updatedAt: Date;
                id: string;
                lyrics: string | null;
                syncedLyrics: string | null;
              };
            }) => {
              const trackStartTime = new Date(
                new Date(raw.startTime).getTime() + track.startOffset * 1000
              );
              const trackEndTime = new Date(
                trackStartTime.getTime() + track.duration * 1000
              );
              const format = (date: Date) =>
                date.toLocaleTimeString("fa-IR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  numberingSystem: "latn",
                });
              const playedAtRange = `${format(trackStartTime)}-${format(
                trackEndTime
              )}`;

              return {
                ...track,
                playedAtRange,
                artist: track.song.artist,
                artists: track.song.artists.map((a) => ({ ...a, image: getAssetUrl(a.image) })),
                id: track.songId,
                title: track.song.title,
                coverArt: getAssetUrl(track.song.coverArt),
                uri: getAssetUrl(track.song.uri ?? ""),
                filename: track.song.filename ?? "",
                album: track.song.albumName,
                albumId: track.song.albumId,
                duration: track.duration,
                isFavorite: false,
                links: resolveSongLinks(JSON.parse(JSON.stringify(track.song.links))),
                doesUserOwnsPlaylist: false,
              };
            }
          ),
          doesUserOwnsPlaylist: false,
          duration: 0, // Set to 0 to match normal Radio History behavior
          createdAt: new Date(raw.createdAt).getTime(),
          updatedAt: new Date(raw.updatedAt).getTime(),
        };
        setPlaylist(transformed);
        setError(null);
      } else {
        setError(data.message || "خطا در دریافت لیست پخش");
      }
    } catch (err) {
      console.error("Failed to fetch playlist:", err);
      setError("خطا در دریافت لیست پخش");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchPlaylistData();
    syncInterval.current = setInterval(() => {
      fetchPlaylistData();
    }, 30000);

    return () => {
      if (syncInterval.current) clearInterval(syncInterval.current);
    };
  }, [fetchPlaylistData]);

  useEffect(() => {
    if (currentSongId) {
      fetchPlaylistData();
    }
  }, [currentSongId, fetchPlaylistData]);

  if (loading && !playlist) {
    return (
      <div className="container py-12 min-h-screen flex justify-center items-center h-max">
        <PlaylistSkeleton />
      </div>
    );
  }

  if (error && !playlist) {
    return (
      <div className="container py-32 text-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">{error}</h1>
      </div>
    );
  }

  return (
    <div className="container py-12 min-h-screen flex justify-center h-max">
      {playlist && (
        <PlaylistClient
          playlist={playlist}
          currentPage={currentPage}
          totalPages={totalPages}
          searchType="radioPlaylist"
        />
      )}
    </div>
  );
}

export default function TodayHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-12 min-h-screen flex justify-center items-center h-max">
          <PlaylistSkeleton />
        </div>
      }
    >
      <TodayHistoryPageContent />
    </Suspense>
  );
}
