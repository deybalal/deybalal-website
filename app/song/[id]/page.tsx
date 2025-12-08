import React from "react";
import { prisma } from "@/lib/prisma";
import SongDetailClient from "@/components/SongDetailClient";
import { LoaderPinwheel } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const songData = await prisma.song.findUnique({
    where: { id },
    include: { artists: true },
  });

  if (!songData) {
    return (
      <div className="size-full flex items-center justify-center">
        <p className="text-muted-foreground text-3xl">Song not found!</p>
      </div>
    );
  }

  // Map Prisma result to match Song type
  const song = {
    ...songData,
    album: songData.albumName,
    coverArt: songData.coverArt || null,
    lyrics: songData.lyrics || null,
    syncedLyrics: songData.syncedLyrics || null,
    filename: songData.filename || "",
    year: songData.year.toString(),
    createdAt: songData.createdAt.getTime(),
    updatedAt: songData.updatedAt.getTime(),
    artists: songData.artists.map((artist) => ({
      ...artist,
      songs: [], // Artist songs not needed for this view
    })),
  };

  return <SongDetailClient song={song} />;
}
