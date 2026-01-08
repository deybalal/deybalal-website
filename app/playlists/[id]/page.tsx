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

  if (!playlist) return { title: "Playlist Not Found" };

  const creator = playlist.user?.name || "User";
  const title = `${playlist.name} by ${creator}`;
  const description = `Listen to ${playlist.name}, a curated playlist by ${creator} on Dey Music.`;
  const ogImageUrl = `/api/og/playlist/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImageUrl],
      type: "music.playlist",
      siteName: "Dey Music",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { id } = await params;
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 20;

  const playlistData = await prisma.playlist.findUnique({
    where: { id },
    include: {
      _count: {
        select: { songs: { where: { isActive: true } } },
      },
      songs: {
        where: { isActive: true },
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
    userId: playlistData.userId ?? undefined,
    description: playlistData.description ?? undefined,
    coverArt: playlistData.coverArt ?? undefined,
    songsLength: playlistData._count.songs,
    createdAt: playlistData.createdAt.getTime(),
    updatedAt: playlistData.updatedAt.getTime(),
    songs: playlistData.songs.map((song) => ({
      ...song,
      uri: song.uri ?? "",
      filename: song.filename ?? "",
      artist: song.artist,
      album: song.albumName,
      albumId: song.albumId,
      artists: [],
      index: 0,
      year: null,
      comment: null,
      date: null,
      isFavorite: false,
      links: song.links as Record<
        number,
        { url: string; size: string; bytes: number }
      > | null,
    })),
  };

  return (
    <Suspense fallback={<PlaylistSkeleton />}>
      <PlaylistClient
        playlist={playlist}
        sessionUserId={session?.user.id ?? null}
        currentPage={currentPage}
        totalPages={Math.ceil(playlistData._count.songs / pageSize)}
      />
    </Suspense>
  );
}
