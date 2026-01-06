import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SongCard from "@/components/SongCard";
import AlbumCard from "@/components/AlbumCard";
import { Song } from "@/types/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const pageSize = 20;
  const skip = (currentPage - 1) * pageSize;

  const [genre, totalSongs] = await Promise.all([
    prisma.genre.findUnique({
      where: { slug },
      include: {
        songs: {
          include: {
            artists: true,
            album: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        },
        albums: {
          orderBy: { createdAt: "desc" },
          include: {
            songs: true,
          },
        },
      },
    }),
    prisma.song.count({
      where: {
        genres: {
          some: { slug },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalSongs / pageSize);

  if (!genre) {
    return notFound();
  }

  // Transform Prisma songs to Song type
  const songs: Song[] = genre.songs.map((song) => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    albumId: song.albumId || null,
    album: song.albumName || null,
    coverArt: song.coverArt || null,
    duration: song.duration || 0,
    uri: song.uri,
    titleEn: song.titleEn,
    filename: song.filename || "",
    index: song.index,
    artists: song.artists.map((a) => ({
      id: a.id,
      name: a.name,
      image: a.image,
      isVerified: a.isVerified,
      songs: [],
    })),
    links: song.links as unknown as Song["links"],
    year: song.year.toString(),
  }));

  return (
    <div className="container px-4 py-8 space-y-12 pb-24 mb-24 h-max">
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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Top Songs</h2>
            <p className="text-sm text-muted-foreground">
              Showing {skip + 1}-{Math.min(skip + pageSize, totalSongs)} of{" "}
              {totalSongs}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 pt-8">
              <Button
                asChild
                variant="outline"
                disabled={currentPage <= 1}
                className={
                  currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                }
              >
                <Link href={`/genres/${slug}?page=${currentPage - 1}`}>
                  Previous
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <Button
                      key={p}
                      asChild
                      variant={currentPage === p ? "default" : "outline"}
                      size="sm"
                      className="w-10 h-10"
                    >
                      <Link href={`/genres/${slug}?page=${p}`}>{p}</Link>
                    </Button>
                  )
                )}
              </div>
              <Button
                asChild
                variant="outline"
                disabled={currentPage >= totalPages}
                className={
                  currentPage >= totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              >
                <Link href={`/genres/${slug}?page=${currentPage + 1}`}>
                  Next
                </Link>
              </Button>
            </div>
          )}
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
                    album: s.albumName || null,
                    coverArt: s.coverArt || null,
                    titleEn: s.titleEn || "",
                    artistEn: s.artistEn || "",
                    filename: s.filename || "",
                    lyrics: s.lyrics || null,
                    syncedLyrics: s.syncedLyrics || null,
                    lyricsSource: s.lyricsSource || null,
                    lyricsSourceUrl: s.lyricsSourceUrl || null,
                    disabledDescription: s.disabledDescription || null,
                    artists: [],
                    year: s.year.toString(),
                    links: s.links as unknown as Song["links"],
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
