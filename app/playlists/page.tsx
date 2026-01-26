import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PlaylistGrid from "@/components/PlaylistGrid";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playlists",
  description: "Manage and listen to your custom playlists on دی بلال.",
};

export const dynamic = "force-dynamic";

export default async function PlaylistsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/login");
  }

  const playlistsData = await prisma.playlist.findMany({
    where: {
      userId: session.user.id,
    },
    include: { songs: true },
    orderBy: { createdAt: "desc" },
  });

  // Map Prisma result to match Playlist type
  const playlists = playlistsData.map((playlist) => ({
    ...playlist,
    createdAt: playlist.createdAt.getTime(),
    updatedAt: playlist.updatedAt.getTime(),
    songs: playlist.songs.map((song) => ({
      ...song,
      album: song.albumName,
      coverArt: song.coverArt || null,
      lyrics: song.lyrics || null,
      syncedLyrics: song.syncedLyrics || null,
      filename: song.filename || "",
      year: song.year.toString(),
      links: song.links as Record<
        number,
        { url: string; size: string; bytes: number }
      > | null,
      createdAt: song.createdAt.getTime(),
      updatedAt: song.updatedAt.getTime(),
      artists: [], // Minimal artist info for playlist view
    })),
    songsLength: playlist.songs.length,
    coverArt: playlist.coverArt || undefined,
    description: playlist.description || undefined,
    userId: undefined, // Add if needed
    userName: undefined, // Add if needed
    profileUrl: undefined, // Add if needed
  }));

  return (
    <div className="space-y-8 w-full pb-24">
      <div className="flex items-center">
        <h1 className="text-4xl font-bold text-white neon-text ml-5">
          Playlists
        </h1>
        <Button asChild variant="outline">
          <Link
            href="/panel/new/playlist"
            className=" text-foreground px-4 py-2 rounded-md transition-colors"
          >
            Create New
          </Link>
        </Button>
      </div>

      <PlaylistGrid initialPlaylists={playlists} />
    </div>
  );
}
