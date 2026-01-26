import React from "react";
import { prisma } from "@/lib/prisma";
import SongCard from "@/components/SongCard";
import { Metadata } from "next";
import { Song } from "@/types/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const title = `${decodedName} | پروفایل`;
  const description = `آهنگ هایی که ${decodedName} در آنها مشارکت داشته را در پلتفرم دی بلال ببینید.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      siteName: "دی بلال",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CrewPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  // Fetch all crew entries with this name
  const contributions = await prisma.songCrew.findMany({
    where: {
      name: decodedName,
    },
    include: {
      song: {
        include: {
          artists: true,
        },
      },
    },
    orderBy: {
      song: {
        createdAt: "desc",
      },
    },
  });

  // Extract unique songs
  const uniqueSongsMap = new Map<string, Song>();
  contributions.forEach((contribution) => {
    if (contribution.song && !uniqueSongsMap.has(contribution.song.id)) {
      // Map Prisma song to Song type
      const mappedSong: Song = {
        ...contribution.song,
        album: contribution.song.albumName,
        coverArt: contribution.song.coverArt || null,
        lyrics: contribution.song.lyrics || null,
        syncedLyrics: contribution.song.syncedLyrics || null,
        filename: contribution.song.filename || "",
        year: contribution.song.year.toString(),
        date: contribution.song.createdAt.getTime(),
        links: contribution.song.links as Record<
          number,
          { url: string; size: string; bytes: number }
        > | null,
        artists: contribution.song.artists.map((artist) => ({
          ...artist,
          songs: [],
        })),
      };
      uniqueSongsMap.set(contribution.song.id, mappedSong);
    }
  });

  const songs = Array.from(uniqueSongsMap.values());

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">{decodedName}</h1>
        <p className="text-muted-foreground">مشارکت در {songs.length} آهنگ</p>
      </div>

      {songs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          آهنگی موجود نیست!
        </div>
      )}
    </div>
  );
}
