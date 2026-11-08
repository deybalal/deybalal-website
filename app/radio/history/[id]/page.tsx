import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PlaylistClient from "@/components/PlaylistClient";
import { Suspense } from "react";
import { getAssetUrl, resolveSongLinks } from "@/lib/utils";
import PlaylistSkeleton from "@/components/PlaylistSkeleton";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const playlist = await prisma.radioPlaylist.findUnique({
    where: { id },
  });

  if (!playlist) return { title: "پلی لیست پیدا نشد" };

  const playlistName = playlist.date.toLocaleDateString("fa-IR", {
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const title = `پلی لیست رادیو تاریخ ${playlistName}`;
  const description = `به آهنگ های پلی لیست ${playlistName}, در پلتفلرم دی بلال گوش دهید.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "music.playlist",
      siteName: "دی بلال",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PlaylistDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 20;

  const playlistData = await prisma.radioPlaylist.findUnique({
    where: { id },
    include: {
      tracks: {
        orderBy: { order: "asc" },
        include: {
          song: {
            include: {
              artists: true,
            },
          },
        },
      },
      _count: {
        select: { tracks: true },
      },
    },
  });

  if (!playlistData) {
    return notFound();
  }

  const now = new Date();
  const isToday = playlistData.date.toDateString() === now.toDateString();
  const elapsedTime = Math.floor(
    (now.getTime() - playlistData.startTime.getTime()) / 1000
  );

  let filteredTracks = playlistData.tracks;
  if (isToday) {
    filteredTracks = filteredTracks.filter((t) => t.startOffset <= elapsedTime);
  }

  const totalFilteredTracks = filteredTracks.length;
  const paginatedTracks = filteredTracks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Transform to match Playlist type
  const playlist = {
    ...playlistData,
    userId: undefined,
    name: isToday ? "لیست پخش امروز" : "پلی لیست رادیو",
    duration: 0,
    doesUserOwnsPlaylist: false,
    description: isToday
      ? "آهنگ هایی که تا این لحظه در رادیو دی بلال پخش شده است."
      : `پلی لیست رادیو در تاریخ ${playlistData.date.toLocaleDateString(
          "fa-IR",
          {
            numberingSystem: "latn",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }
        )}`,
    coverArt:
      getAssetUrl(playlistData.tracks[0]?.song?.coverArt, "/images/default-album-art.png"),
    songsLength: totalFilteredTracks,
    createdAt: playlistData.createdAt.getTime(),
    updatedAt: playlistData.updatedAt.getTime(),
    songs: paginatedTracks.map((song) => {
      const trackStartTime = new Date(
        playlistData.startTime.getTime() + song.startOffset * 1000
      );
      const trackEndTime = new Date(
        trackStartTime.getTime() + song.duration * 1000
      );
      const format = (date: Date) =>
        date.toLocaleTimeString("fa-IR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          numberingSystem: "latn",
        });
      const playedAtRange = `${format(trackStartTime)}-${format(trackEndTime)}`;

      return {
        ...song,
        playedAtRange,
        uri: getAssetUrl(song.song.uri ?? ""),
        filename: song.song.filename ?? "",
        artist: song.song.artist,
        artists: song.song.artists.map((a) => ({ ...a, image: getAssetUrl(a.image) })),
        id: song.songId,
        album: song.song.albumName,
        albumId: song.song.albumId,
        title: song.song.title,
        titleEn: song.song.titleEn,
        coverArt: getAssetUrl(song.song.coverArt),
        index: 0,
        year: null,
        comment: null,
        date: null,
        isFavorite: false,
        links: resolveSongLinks(song.song.links as Record<
          number,
          { url: string; size: string; bytes: number }
        > | null),
      };
    }),
  };

  return (
    <Suspense key={currentPage} fallback={<PlaylistSkeleton />}>
      <PlaylistClient
        searchType="radioPlaylist"
        playlist={playlist}
        currentPage={currentPage}
        totalPages={Math.ceil(totalFilteredTracks / pageSize)}
      />
    </Suspense>
  );
}
