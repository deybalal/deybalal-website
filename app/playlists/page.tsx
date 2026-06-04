import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PlaylistGrid from "@/components/PlaylistGrid";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "پلی لیست ها",
  description: "مدیریت و گوش دادن به آهنگ های پلی لیست ها در پلتفرم دی بلال.",
};

export const dynamic = "force-dynamic";

export default async function PlaylistsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const playlistsData = await prisma.playlist.findMany({
    where: {
      userId: session ? session.user.id : "",
    },
    include: { songs: { include: { song: true } } },
    orderBy: { createdAt: "desc" },
  });

  const publicPlaylistsData = await prisma.playlist.findMany({
    where: {
      isPrivate: false,
    },
    include: { songs: { include: { song: true } }, user: true },
    orderBy: { createdAt: "desc" },
  });

  // Map Prisma result to match Playlist type
  const playlists = playlistsData.map((playlist) => ({
    ...playlist,
    doesUserOwnsPlaylist: playlist.userId === session?.user.id,
    createdAt: playlist.createdAt.getTime(),
    updatedAt: playlist.updatedAt.getTime(),
    songs: playlist.songs.map((ps: any) => ({
      id: ps.song.id,
      title: ps.song.title,
      titleEn: ps.song.titleEn,
      artist: ps.song.artist,
      artistEn: ps.song.artistEn,
      uri: ps.song.uri,
      album: ps.song.albumName,
      albumId: ps.song.albumId,
      coverArt: ps.song.coverArt || null,
      lyrics: ps.song.lyrics || null,
      syncedLyrics: ps.song.syncedLyrics || null,
      filename: ps.song.filename || "",
      year: ps.song.year?.toString() || "0",
      links: ps.song.links as Record<
        number,
        { url: string; size: string; bytes: number }
      > | null,
      duration: ps.song.duration,
      playCount: ps.song.playCount,
      isActive: ps.song.isActive,
      isFeatured: ps.song.isFeatured,
      index: ps.song.index,
      createdAt: ps.song.createdAt.getTime(),
      updatedAt: ps.song.updatedAt.getTime(),
      artists: [], // Minimal artist info for playlist view
    })),
    songsLength: playlist.songs.length,
    coverArt: playlist.coverArt || undefined,
    description: playlist.description || undefined,
    userId: undefined,
    userName: undefined, // Own playlist
    profileUrl: undefined, // Own playlist
  }));

  const publicPlaylists = publicPlaylistsData.map((playlist) => ({
    ...playlist,
    createdAt: playlist.createdAt.getTime(),
    updatedAt: playlist.updatedAt.getTime(),
    songs: playlist.songs.map((ps: any) => ({
      id: ps.song.id,
      title: ps.song.title,
      titleEn: ps.song.titleEn,
      artist: ps.song.artist,
      artistEn: ps.song.artistEn,
      uri: ps.song.uri,
      album: ps.song.albumName,
      albumId: ps.song.albumId,
      coverArt: ps.song.coverArt || null,
      lyrics: ps.song.lyrics || null,
      syncedLyrics: ps.song.syncedLyrics || null,
      filename: ps.song.filename || "",
      year: ps.song.year?.toString() || "0",
      links: ps.song.links as Record<
        number,
        { url: string; size: string; bytes: number }
      > | null,
      duration: ps.song.duration,
      playCount: ps.song.playCount,
      isActive: ps.song.isActive,
      isFeatured: ps.song.isFeatured,
      index: ps.song.index,
      createdAt: ps.song.createdAt.getTime(),
      updatedAt: ps.song.updatedAt.getTime(),
      artists: [], // Minimal artist info for playlist view
    })),
    songsLength: playlist.songs.length,
    coverArt: playlist.coverArt || undefined,
    description: playlist.description || undefined,
    userId: undefined,
    userName: playlist.user.name,
    profileUrl: playlist.user.image || undefined,
  }));

  return (
    <div className="space-y-8 w-full pb-24 h-max">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold text-white neon-text ml-5">
          پلی لیست ها
        </h1>
        <Button asChild variant="outline">
          <Link
            href="/panel/new/playlist"
            className=" text-foreground px-4 py-2 rounded-md transition-colors"
          >
            ساخت پلی لیست جدید
          </Link>
        </Button>
      </div>

      <PlaylistGrid initialPlaylists={playlists} />

      <div className="flex flex-col">
        <h2 className="text-3xl font-bold text-foreground neon-text ml-5 mb-4">
          پلی لیست های عمومی
        </h2>
        <PlaylistGrid initialPlaylists={publicPlaylists} />
      </div>
    </div>
  );
}
