import { prisma } from "@/lib/prisma";
import SongList from "@/components/SongList";
import Image from "next/image";
import { Calendar, Music } from "lucide-react";
import PlayAlbumButton from "@/components/PlayAlbumButton";
import { Song } from "@/types/types";

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
        orderBy: { index: "asc" },
      },
      artist: true,
    },
  });

  if (!album) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
        <Music className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold">Album not found</h2>
      </div>
    );
  }

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
  }));

  return (
    <div className="space-y-8 relative">
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
            <div className="flex items-center gap-2">
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
            </div>
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

          <div className="mt-2">
            <PlayAlbumButton songs={songs} />
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="bg-foreground/5 rounded-2xl p-6 border border-forebg-foreground/5">
        <SongList songs={songs} />
      </div>
    </div>
  );
}
