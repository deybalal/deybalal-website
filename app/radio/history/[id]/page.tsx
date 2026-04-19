import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PlaylistClient from "@/components/PlaylistClient";
import { Suspense } from "react";
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
      _count: {
        select: { tracks: true },
      },
      tracks: {
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        include: {
          song: {
            include: {
              artists: true,
              // _count: true,
            },
          },
        },
      },
    },
  });

  if (!playlistData) {
    return notFound();
  }

  // Transform to match Playlist type
  const playlist = {
    ...playlistData,
    userId: undefined,
    name: "پلی لیست رادیو",
    duration: 0,
    doesUserOwnsPlaylist: false,
    description: `پلی لیست رادیو در تاریخ ${playlistData.date.toLocaleDateString(
      "fa-IR",
      {
        numberingSystem: "latn",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    )}`,
    coverArt:
      playlistData.tracks[0].song.coverArt || "/images/default-album-art.png",
    songsLength: playlistData._count.tracks,
    createdAt: playlistData.createdAt.getTime(),
    updatedAt: playlistData.updatedAt.getTime(),
    songs: playlistData.tracks.map((song) => ({
      ...song,
      uri: song.song.uri ?? "",
      filename: song.song.filename ?? "",
      artist: song.song.artist,
      artists: song.song.artists,
      id: song.songId,
      album: song.song.albumName,
      albumId: song.song.albumId,
      title: song.song.title,
      titleEn: song.song.titleEn,
      coverArt: song.song.coverArt,
      index: 0,
      year: null,
      comment: null,
      date: null,
      isFavorite: false,
      links: song.song.links as Record<
        number,
        { url: string; size: string; bytes: number }
      > | null,
    })),
  };

  return (
    <Suspense key={currentPage} fallback={<PlaylistSkeleton />}>
      <PlaylistClient
        searchType="radioPlaylist"
        playlist={playlist}
        currentPage={currentPage}
        totalPages={Math.ceil(playlistData._count.tracks / pageSize)}
      />
    </Suspense>
  );
}
