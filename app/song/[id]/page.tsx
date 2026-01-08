import React from "react";
import { prisma } from "@/lib/prisma";
import SongDetailClient from "@/components/SongDetailClient";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { CommentSection } from "@/components/CommentSection";
import { ShareButtons } from "@/components/ShareButtons";
import { Metadata } from "next";
import { Music, Download } from "lucide-react";
import { LyricsControl } from "@/components/LyricsControl";
import { Contributor } from "@/types/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      genres: true,
      album: {
        select: {
          name: true,
        },
      },
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
      crew: true,
    },
  });

  if (!songData) {
    return (
      <div className="size-full flex items-center justify-center">
        <p className="text-muted-foreground text-3xl">Song not found!</p>
      </div>
    );
  }

  console.log(songData);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (
    !songData.isActive &&
    session?.user.role !== "administrator" &&
    session?.user.role !== "moderator"
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full text-gray-400">
        <Music className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold">This Song is not active yet!</h2>
      </div>
    );
  }

  const isUserLoggedIn = !!session?.user;
  const userSlug = session?.user.userSlug;

  // Map Prisma result to match Song type
  const song = {
    ...songData,
    album: songData?.album?.name ?? null,
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
    genres: songData.genres,
    links: songData.links as unknown as Record<
      number,
      { url: string; size: string; bytes: number }
    >,
  };

  const isInstrumental = songData.genres.some(
    (genre) => genre.slug === "instrumental"
  );

  return (
    <div className="space-y-12 pb-24 w-full flex-1">
      <SongDetailClient
        song={song}
        isUserLoggedIn={isUserLoggedIn}
        isInstrumental={isInstrumental}
      />
      <div className="max-w-4xl mx-auto px-6 my-12 pb-28 w-full flex-1">
        {song.links && (
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Download Song</h3>
              <p className="text-sm text-gray-400">
                Choose your preferred quality
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {song.links[64] && (
                <Button
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white border-none h-16 rounded-xl flex items-center justify-between px-6 group transition-all"
                >
                  <a
                    href={song.links[64].url}
                    download={`${song.artist} - ${song.title} (64kbps).mp3`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                        <Download className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-lg">64 kbps</span>
                        <span className="text-xs opacity-80">Low Quality</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                      {song.links[64].size}
                    </span>
                  </a>
                </Button>
              )}
              {song.links[128] && (
                <Button
                  asChild
                  className="bg-purple-600 hover:bg-purple-700 text-white border-none h-16 rounded-xl flex items-center justify-between px-6 group transition-all"
                >
                  <a
                    href={song.links[128].url}
                    download={`${song.artist} - ${song.title} (128kbps).mp3`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                        <Download className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-lg">128 kbps</span>
                        <span className="text-xs opacity-80">
                          Standard Quality
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                      {song.links[128].size}
                    </span>
                  </a>
                </Button>
              )}
              {song.links[320] && (
                <Button
                  asChild
                  className="bg-green-600 hover:bg-green-700 text-white border-none h-16 rounded-xl flex items-center justify-between px-6 group transition-all"
                >
                  <a
                    href={song.links[320].url}
                    download={`${song.artist} - ${song.title} (320kbps).mp3`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                        <Download className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-lg">320 kbps</span>
                        <span className="text-xs opacity-80">High Quality</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                      {song.links[320].size}
                    </span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
        <LyricsControl
          songId={song.id}
          hasLyrics={!!song.lyrics}
          hasSyncedLyrics={!!song.syncedLyrics}
          contributors={songData.contributors as unknown as Contributor[]}
          source={songData.lyricsSource}
          sourceUrl={songData.lyricsSourceUrl}
          isInstrumental={isInstrumental}
        />

        {songData.crew && songData.crew.length > 0 && (
          <div className="flex flex-col gap-4 bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
            <h3 className="text-lg font-semibold">Song Credits</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {songData.crew.map((member) => (
                <Link
                  href={`/crew/${encodeURIComponent(member.name)}`}
                  key={member.id}
                  className="flex flex-col group hover:bg-white/5 p-2 rounded-lg transition-colors"
                >
                  <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    {member.role}
                  </span>
                  <span className="font-medium text-lg group-hover:underline">
                    {member.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

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
