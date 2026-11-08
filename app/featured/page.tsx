import Pagination from "@/components/Pagination";
import { Suspense } from "react";
import SongCard from "@/components/SongCard";
import { prisma } from "@/lib/prisma";
import { Song as PrismaSong, Artist as PrismaArtist } from "@prisma/client";
import { getAssetUrl, resolveSongLinks } from "@/lib/utils";

import { Metadata } from "next";
import FeaturedSort from "@/components/FeaturedSort";

export const metadata: Metadata = {
  title: "آهنگ های پیشنهادی",
  description: "آهنگ های پیشنهادی در پلتفرم آهنگ لری دی بلال.",
};

export const dynamic = "force-dynamic";

export default async function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sortBy?: string; sortOrder?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 20;
  const { sortBy, sortOrder } = await searchParams;
  const sortField = typeof sortBy === "string" ? sortBy : "playCount";
  const sortDir = (typeof sortOrder === "string" ? sortOrder : "desc") as
    | "asc"
    | "desc";

  const songsData = await prisma.song.findMany({
    where: { isActive: true, isFeatured: true },

    orderBy:
      sortField === "title"
        ? { title: sortDir === "asc" ? "desc" : "asc" }
        : { [sortField]: sortDir },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { artists: true },
  });

  const totalSongs = await prisma.song.count({
    where: { isActive: true, isFeatured: true },
  });

  type PrismaSongWithArtists = PrismaSong & { artists: PrismaArtist[] };

  const mapSong = (song: PrismaSongWithArtists) => ({
    ...song,
    album: song.albumName,
    coverArt: getAssetUrl(song.coverArt) || null,
    uri: getAssetUrl(song.uri),
    lyrics: song.lyrics || null,
    syncedLyrics: song.syncedLyrics || null,
    filename: song.filename || "",
    year: song.year.toString(),
    createdAt: song.createdAt.getTime(),
    updatedAt: song.updatedAt.getTime(),
    links: resolveSongLinks(song.links as Record<
      number,
      { url: string; size: string; bytes: number }
    > | null),
    artists: song.artists.map((artist: PrismaArtist) => ({
      ...artist,
      image: getAssetUrl(artist.image),
      songs: [],
    })),
  });

  const songs = songsData.map(mapSong);

  return (
    <div
      key={page}
      className="container mx-auto ps-4 pe-4 py-8 space-y-8 h-max"
    >
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">آهنگ های پیشنهادی</h1>
        <p className="text-muted-foreground text-lg">
          آهنگ های پیشنهادی در پلتفرم دی بلال
        </p>
        <div className="flex w-full justify-end">
          <div className="flex items-center max-w-[50%] md:max-w-max">
            <FeaturedSort />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>

      {songs.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          هنوز آهنگی وجود نداره :(
        </div>
      )}

      <Suspense>
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalSongs / pageSize)}
        />
      </Suspense>
    </div>
  );
}
