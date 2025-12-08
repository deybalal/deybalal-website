import AlbumCard from "@/components/AlbumCard";
import SongCard from "@/components/SongCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const songsData = await prisma.song.findMany({
    orderBy: { createdAt: "desc" },
    include: { artists: true },
  });

  const songs = songsData.map((song) => ({
    ...song,
    album: song.albumName,
    coverArt: song.coverArt || null,
    lyrics: song.lyrics || null,
    syncedLyrics: song.syncedLyrics || null,
    filename: song.filename || "",
    year: song.year.toString(),
    createdAt: song.createdAt.getTime(),
    updatedAt: song.updatedAt.getTime(),
    artists: song.artists.map((artist) => ({
      ...artist,
      songs: [],
    })),
  }));

  const albumsData = await prisma.album.findMany({
    include: { songs: true },
    orderBy: { createdAt: "desc" },
  });

  const albums = albumsData.map((album) => ({
    ...album,
    artistId: album.artistId || "",
    coverArt: album.coverArt || undefined,
    releaseDate: album.releaseDate || 0,
    createdAt: album.createdAt.getTime(),
    updatedAt: album.updatedAt.getTime(),
    songs: album.songs.map((song) => ({
      ...song,
      album: song.albumName,
      coverArt: song.coverArt || null,
      lyrics: song.lyrics || null,
      syncedLyrics: song.syncedLyrics || null,
      filename: song.filename || "",
      year: song.year.toString(),
      createdAt: song.createdAt.getTime(),
      updatedAt: song.updatedAt.getTime(),
      artists: [],
    })),
  }));

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative h-80 rounded-3xl overflow-hidden bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 flex items-center px-12 shadow-2xl neon-box group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent dark:from-black/80 dark:via-black/40" />

        <div className="z-10 max-w-2xl space-y-6">
          <div className="text-white inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/20 text-sm font-medium">
            Premium Sound Experience
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tight leading-tight">
            Feel the{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 dark:from-accent dark:to-purple-400 font-extrabold">
              Rhythm
            </span>
          </h1>
          <p className="text-gray-200 dark:text-gray-300 text-xl leading-relaxed max-w-lg">
            Immerse yourself in a world of crystal clear audio and curated
            playlists designed for your every mood.
          </p>
        </div>
      </section>

      {/* Trending Songs */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
          <span className="w-2 h-8 bg-accent mr-3 rounded-full shadow-[0_0_10px_var(--accent)]"></span>
          Trending Songs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {songs.length > 0 ? (
            songs.map((song) => <SongCard key={song.id} song={song} />)
          ) : (
            <p className="text-gray-500 col-span-full">
              No songs found. Add some in the Admin Panel!
            </p>
          )}
        </div>
      </section>

      {/* New Releases */}
      <section className="pb-32">
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
          <span className="w-2 h-8 bg-purple-500 mr-3 rounded-full shadow-[0_0_10px_purple]"></span>
          New Albums
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {albums.length > 0 ? (
            albums.map((album) => <AlbumCard key={album.id} album={album} />)
          ) : (
            <p className="text-gray-500 col-span-full">
              No albums found. Add some in the Admin Panel!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
