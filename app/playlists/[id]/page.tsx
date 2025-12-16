import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import PlaylistClient from "@/components/PlaylistClient";
import { Suspense } from "react";
import PlaylistSkeleton from "@/components/PlaylistSkeleton";

export default async function PlaylistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { id } = await params;

  const playlistData = await prisma.playlist.findUnique({
    where: { id },
    include: {
      songs: true,
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
    songsLength: playlistData.songs.length,
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
    })),
  };

  return (
    <Suspense fallback={<PlaylistSkeleton />}>
      <PlaylistClient
        playlist={playlist}
        sessionUserId={session?.user.id ?? null}
      />
    </Suspense>
  );
}
