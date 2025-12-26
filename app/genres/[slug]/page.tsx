import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SongCard from "@/components/SongCard";
import AlbumCard from "@/components/AlbumCard";
import { Song } from "@/types/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const genre = await prisma.genre.findUnique({
    where: { slug },
  });

  if (!genre) {
    return {
      title: "Genre Not Found",
    };
  }

  return {
    title: `${genre.name} | Music Player`,
    description: `Listen to the best ${genre.name} songs and albums.`,
  };
}

export default async function GenrePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const genre = await prisma.genre.findUnique({
    where: { slug },
    include: {
      songs: {
        include: {
          artists: true,
          album: true,
        },
        orderBy: { createdAt: "desc" },
      },
      albums: {
        orderBy: { createdAt: "desc" },
        include: {
          songs: true,
        },
      },
    },
  });

  if (!genre) {
    return notFound();
  }

  // Transform Prisma songs to Song type
  const songs: Song[] = genre.songs.map((song) => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    albumId: song.albumId || undefined,
    albumName: song.albumName || undefined,
    coverArt: song.coverArt || undefined,
    duration: song.duration || 0,
    uri: song.uri,
    titleEn: song.titleEn,
    filename: song.filename,
    index: song.index,
    album: song.album,
    createdAt: song.createdAt,
    artists: song.artists.map((a) => ({
      id: a.id,
      name: a.name,
      nameEn: a.nameEn,
      image: a.image,
    })),
  }));

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden bg-linear-to-br from-primary/10 to-secondary/10 border border-white/5">
        <div className="relative z-10 p-10 flex flex-col items-center text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground drop-shadow-sm">
            {genre.name}
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            {songs.length} Songs • {genre.albums.length} Albums
          </p>
        </div>
      </div>

      {/* Songs Section */}
      {songs.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Top Songs</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </div>
      )}

      {/* Albums Section */}
      {genre.albums.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Popular Albums</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {genre.albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={{
                  ...album,
                  coverArt: album.coverArt || undefined,
                  releaseDate: album.releaseDate || 0,
                  artistId: album.artistId || "",
                  createdAt: album.createdAt.getTime(),
                  updatedAt: album.updatedAt.getTime(),
                  songs: album.songs.map((s) => ({
                    ...s,
                    albumId: s.albumId || null,
                    albumName: s.albumName || null,
                    coverArt: s.coverArt || null,
                    titleEn: s.titleEn || "",
                    artistEn: s.artistEn || "",
                    filename: s.filename || "",
                    lyrics: s.lyrics || null,
                    syncedLyrics: s.syncedLyrics || null,
                    lyricsSource: s.lyricsSource || null,
                    lyricsSourceUrl: s.lyricsSourceUrl || null,
                    disabledDescription: s.disabledDescription || null,
                    album: s.albumName || null,
                    artists: [],
                    year: s.year.toString(),
                  })),
                }}
              />
            ))}
          </div>
        </div>
      )}

      {songs.length === 0 && genre.albums.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No content found for this genre yet.
        </div>
      )}
    </div>
  );
}
