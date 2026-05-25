"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import PlaylistClient from "@/components/PlaylistClient";
import PlaylistSkeleton from "@/components/PlaylistSkeleton";
import { Playlist } from "@/types/types";
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

  const { setSong, setIsRadio, setSeekTo } = usePlayerStore();
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeout = useRef<NodeJS.Timeout | null>(null);

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
          coverArt: reversedTracks[0].song.coverArt ?? "/images/cover.png",
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
                artists: track.song.artists,
                id: track.songId,
                title: track.song.title,
                coverArt: track.song.coverArt,
                uri: track.song.uri ?? "",
                filename: track.song.filename ?? "",
                album: track.song.albumName,
                albumId: track.song.albumId,
                duration: track.duration,
                isFavorite: false,
                links: JSON.parse(JSON.stringify(track.song.links)),
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
      }
    } catch (err) {
      console.error("Failed to fetch playlist:", err);
    }
  }, [currentPage, pageSize]);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/radio/state");
      const data = await res.json();

      if (data.success) {
        setError(null);

        const currentStoredSong = usePlayerStore.getState().currentSong;
        const isCurrentlyRadio = usePlayerStore.getState().isRadio;

        if (
          !isCurrentlyRadio ||
          currentStoredSong?.id !== data.data.currentTrack.id
        ) {
          setIsRadio(true, true);
          setSong(data.data.currentTrack, true, true);
          setTimeout(() => {
            usePlayerStore
              .getState()
              .setSeekTo(data.data.currentTrack.position, "radio");
          }, 500);

          // Re-fetch playlist to get the new track in history
          fetchPlaylistData();
        } else {
          const currentProgress = usePlayerStore.getState().progress;
          const targetPos = data.data.currentTrack.position;
          if (Math.abs(currentProgress - targetPos) > 5) {
            setSeekTo(targetPos, "radio");
          }
        }

        if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
        const remainingTime =
          (data.data.currentTrack.duration - data.data.currentTrack.position) *
          1000;
        if (remainingTime > 0) {
          transitionTimeout.current = setTimeout(() => {
            fetchState();
          }, remainingTime + 500);
        }
      } else {
        setError(data.message);
        setIsRadio(false);
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  }, [setIsRadio, setSong, setSeekTo, fetchPlaylistData]);

  useEffect(() => {
    fetchPlaylistData();
    fetchState();
    syncInterval.current = setInterval(() => {
      fetchState();
      fetchPlaylistData();
    }, 30000);

    return () => {
      if (syncInterval.current) clearInterval(syncInterval.current);
      if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    };
  }, [fetchState, fetchPlaylistData]);

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
