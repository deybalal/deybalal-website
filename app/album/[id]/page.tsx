import { prisma } from "@/lib/prisma";
import SongList from "@/components/SongList";
import Image from "next/image";
import { Calendar, Music } from "lucide-react";
import PlayAlbumButton from "@/components/PlayAlbumButton";
import { Song } from "@/types/types";
import { CommentSection } from "@/components/CommentSection";
import { ShareButtons } from "@/components/ShareButtons";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const album = await prisma.album.findUnique({
    where: { id },
  });

  if (!album) return { title: "Album Not Found" };

  const title = `${album.name} by ${album.artistName}`;
  const description = `Listen to ${album.name} by ${album.artistName} on Dey Music. Explore all tracks from this album.`;
  const ogImageUrl = `/api/og/album/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImageUrl],
      type: "music.album",
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

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const album = await prisma.album.findUnique({
    where: { id },
    include: {
      songs: {
        where: { isActive: true },
        orderBy: { index: "asc" },
      },
      artist: true,
    },
  });

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full text-gray-400">
        <Music className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold">Album not found</h2>
      </div>
    );
  }

  if (!album.isActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full text-gray-400">
        <Music className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold">This album is not active yet!</h2>
      </div>
    );
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isUserLoggedIn = !!session?.user;
  const userSlug = session?.user.userSlug;

  // Map Prisma songs to our app's Song type if needed, or cast if compatible
  // The Prisma type has artist as a relation, but our Song type expects artist name string
  // We need to map it to ensure compatibility with SongList and Player
  const songs: Song[] = album.songs.map((song) => ({
    ...song,
    artists: [],
    album: song.albumName || null,
    coverArt: song.coverArt || null,
    title: song.title,
    titleEn: song.titleEn,
    uri: song.uri,
    filename: song.filename || "",
    index: song.index,
    year: song.year.toString(),
    duration: song.duration,
    id: song.id,
    links: song.links as Record<
      number,
      { url: string; size: string; bytes: number }
    > | null,
  }));

  return (
    <div className="space-y-8 relative h-max">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-accent/10 via-background to-background pointer-events-none -z-10 h-[500px]" />

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-end p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-2xl">
        <div className="relative w-64 h-64 rounded-xl overflow-hidden shadow-2xl shrink-0 group">
          {album.coverArt ? (
            <Image
              src={album.coverArt}
              alt={album.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <Music className="w-20 h-20 text-gray-600" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 pb-2 w-full">
          <div className="space-y-1">
            <span className="dark:text-gray-400 text-accent bg-accent/10 dark:bg-accent/90 uppercase tracking-widest text-xs font-bold px-3 py-1 rounded-full w-fit">
              Album
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight neon-text">
              {album.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-foreground/60 text-sm md:text-base">
            <Link
              href={`/artist/${album.artistId}`}
              className="flex items-center gap-2"
            >
              {album.artist?.image && (
                <div className="w-6 h-6 rounded-full overflow-hidden relative">
                  <Image
                    src={album.artist.image}
                    alt={album.artistName}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span className="font-bold text-foreground hover:text-accent cursor-pointer transition-colors">
                {album.artistName}
              </span>
            </Link>
            {album.releaseDate && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-500" />
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{album.releaseDate}</span>
                </div>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-gray-500" />
            <div className="flex items-center gap-1.5">
              <Music className="w-4 h-4" />
              <span>{album.songs?.length || 0} songs</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-4">
            <PlayAlbumButton songs={songs} />
            <ShareButtons
              title={album.name}
              url={`/album/${album.id}`}
              type="album"
            />
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="bg-foreground/5 rounded-2xl p-6 border border-white/5">
        <SongList songs={songs} />
      </div>

      {/* Comments Section */}
      <div className="max-w-4xl mx-auto">
        <CommentSection
          userSlug={userSlug}
          albumId={album.id}
          isUserLoggedIn={isUserLoggedIn}
        />
      </div>
    </div>
  );
}
