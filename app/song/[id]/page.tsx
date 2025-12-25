import React from "react";
import { prisma } from "@/lib/prisma";
import SongDetailClient from "@/components/SongDetailClient";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { CommentSection } from "@/components/CommentSection";
import { ShareButtons } from "@/components/ShareButtons";
import { Metadata } from "next";
import { Music } from "lucide-react";
import { LyricsControl } from "@/components/LyricsControl";
import { Contributors } from "@/components/Contributors";
import { Contributor } from "@/types/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const song = await prisma.song.findUnique({
    where: { id },
  });

  if (!song) return { title: "Song Not Found" };

  const ogImageUrl = `/api/og/song/${id}`;

  return {
    title: `${song.title} - ${song.artist}`,
    description: `Listen to ${song.title} by ${song.artist} on Dey`,
    openGraph: {
      title: song.title,
      description: `Listen to ${song.title} by ${song.artist} on Dey`,
      images: [ogImageUrl],
      type: "music.song",
    },
    twitter: {
      card: "summary_large_image",
      title: song.title,
      description: `Listen to ${song.title} by ${song.artist} on Dey`,
      images: [ogImageUrl],
    },
  };
}

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const songData = await prisma.song.findUnique({
    where: { id },
    include: {
      artists: true,
      contributors: {
        include: {
          user: {
            select: {
              userSlug: true,
              image: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!songData) {
    return (
      <div className="size-full flex items-center justify-center">
        <p className="text-muted-foreground text-3xl">Song not found!</p>
      </div>
    );
  }

  if (!songData.isActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full text-gray-400">
        <Music className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold">This Song is not active yet!</h2>
      </div>
    );
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isUserLoggedIn = !!session?.user;
  const userSlug = session?.user.userSlug;

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

  return (
    <div className="space-y-12 pb-24 w-full flex-1">
      <SongDetailClient song={song} isUserLoggedIn={isUserLoggedIn} />
      <div className="max-w-4xl mx-auto px-6 my-12 pb-28 w-full flex-1">
        <LyricsControl
          songId={song.id}
          hasLyrics={!!song.lyrics}
          hasSyncedLyrics={!!song.syncedLyrics}
          contributors={songData.contributors as unknown as Contributor[]}
          source={songData.lyricsSource}
          sourceUrl={songData.lyricsSourceUrl}
        />
        {/* <Contributors
          contributors={songData.contributors as unknown as Contributor[]}
        /> */}
        <div className="flex items-center justify-between bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Share this song</h3>
            <p className="text-sm text-gray-400">
              Spread the music with your friends
            </p>
          </div>
          <ShareButtons
            title={song.title}
            url={`/song/${song.id}`}
            type="song"
          />
        </div>
        <CommentSection
          userSlug={userSlug}
          songId={song.id}
          isUserLoggedIn={isUserLoggedIn}
        />
      </div>
    </div>
  );
}
