import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
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
  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!playlist) return { title: "پلی لیست پیدا نشد" };

  const creator = playlist.user?.name || "کاربر";
  const title = `${playlist.name} توسط ${creator}`;
  const description = `به آهنگ های پلی لیست ${playlist.name}, توسط ${creator} در پلتفلرم دی بلال گوش دهید.`;

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
  searchParams: Promise<{ page?: string; sortBy?: string; sortOrder?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { id } = await params;
  const { page, sortBy, sortOrder } = await searchParams;
  const currentPage = Number(page) || 1;
  const sortField = typeof sortBy === "string" ? sortBy : "addedAt";
  const sortDir = (typeof sortOrder === "string" ? sortOrder : "desc") as "asc" | "desc";
  const pageSize = 20;

  const playlistData = await prisma.playlist.findUnique({
    where: { id },
    include: {
      _count: {
        select: { songs: { where: { song: { isActive: true } } } },
      },
      songs: {
        where: { song: { isActive: true } },
        include: {
          song: {
            include: {
              artists: true,
            },
          },
        },
        orderBy: sortField === "addedAt" 
          ? { addedAt: sortDir } 
          : { song: { [sortField]: sortDir } },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      },
    },
  });

  if (
    !playlistData ||
    (playlistData.isPrivate && playlistData.userId !== session?.user.id)
  ) {
    return notFound();
  }

  // Transform to match Playlist type
  const playlist = {
    ...playlistData,
    userId: undefined,
    doesUserOwnsPlaylist: playlistData.userId === session?.user.id,
    description: playlistData.description ?? undefined,
    coverArt: playlistData.coverArt ?? undefined,
    songsLength: playlistData._count.songs,
    createdAt: playlistData.createdAt.getTime(),
    updatedAt: playlistData.updatedAt.getTime(),
    songs: playlistData.songs.map((ps) => ({
      ...ps.song,
      addedAt: ps.addedAt.getTime(),
      uri: ps.song.uri ?? "",
      filename: ps.song.filename ?? "",
      artist: ps.song.artist,
      album: ps.song.albumName,
      albumId: ps.song.albumId,
      artists: [...ps.song.artists],
      index: ps.song.index,
      year: ps.song.year?.toString() || "0",
      comment: null,
      date: null,
      isFavorite: false,
      links: ps.song.links as Record<
        number,
        { url: string; size: string; bytes: number }
      > | null,
    })),
  };

  return (
    <Suspense key={currentPage} fallback={<PlaylistSkeleton />}>
      <PlaylistClient
        playlist={playlist}
        currentPage={currentPage}
        totalPages={Math.ceil(playlistData._count.songs / pageSize)}
      />
    </Suspense>
  );
}
