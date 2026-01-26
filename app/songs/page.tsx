import Pagination from "@/components/Pagination";
import SongCard from "@/components/SongCard";
import { prisma } from "@/lib/prisma";
import { Song as PrismaSong, Artist as PrismaArtist } from "@prisma/client";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Most Played Songs",
  description: "Discover the most popular and trending songs on دی بلال.",
};

export const dynamic = "force-dynamic";

export default async function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 20;

  const songsData = await prisma.song.findMany({
    where: { isActive: true },
    orderBy: { playCount: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { artists: true },
  });

  const totalSongs = await prisma.song.count({
    where: { isActive: true },
  });

  type PrismaSongWithArtists = PrismaSong & { artists: PrismaArtist[] };

  const mapSong = (song: PrismaSongWithArtists) => ({
    ...song,
    album: song.albumName,
    coverArt: song.coverArt || null,
    lyrics: song.lyrics || null,
    syncedLyrics: song.syncedLyrics || null,
    filename: song.filename || "",
    year: song.year.toString(),
    createdAt: song.createdAt.getTime(),
    updatedAt: song.updatedAt.getTime(),
    links: song.links as Record<
      number,
      { url: string; size: string; bytes: number }
    > | null,
    artists: song.artists.map((artist: PrismaArtist) => ({
      ...artist,
      songs: [],
    })),
  });

  const songs = songsData.map(mapSong);

  return (
    <div className="container mx-auto ps-4 pe-4 py-8 space-y-8 h-max">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Most Played Songs</h1>
        <p className="text-muted-foreground text-lg">
          The most popular tracks on the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>

      {songs.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No songs found.
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(totalSongs / pageSize)}
      />
    </div>
  );
}
