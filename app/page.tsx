import AlbumCard from "@/components/AlbumCard";
import SongCard from "@/components/SongCard";
import { prisma } from "@/lib/prisma";
import { Song as PrismaSong, Artist as PrismaArtist } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featuredSongsData, songsData, albumsData] = await Promise.all([
    prisma.song.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { artists: true },
    }),
    prisma.song.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { artists: true },
    }),
    prisma.album.findMany({
      where: { isActive: true },
      include: { songs: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  type PrismaSongWithArtists = PrismaSong & { artists: PrismaArtist[] };

  const mapSong = (song: PrismaSongWithArtists) => ({
    ...song,
    album: song.albumName,
    coverArt: song.coverArt || null,
    lyrics: song.lyrics || null,
    syncedLyrics: song.syncedLyrics || null,
    filename: song.filename || "",
    year: song.year.toString(),
    createdAt: song.createdAt.getTime(),
    updatedAt: song.updatedAt.getTime(),
    artists: song.artists.map((artist: PrismaArtist) => ({
      ...artist,
      songs: [],
    })),
  });

  const featuredSongs = featuredSongsData.map(mapSong);
  const songs = songsData.map(mapSong);

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
      {/* Hero Section - Premium Music Platform Design */}
      <section className="relative min-h-[600px] lg:min-h-[700px] rounded-2xl md:rounded-3xl overflow-hidden flex items-center px-6 py-16 md:px-12 lg:px-16 group">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-900 dark:via-purple-900 dark:to-fuchsia-900 animate-gradient-slow" />

        {/* Overlay Pattern with Animation */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay transition-transform duration-1000 group-hover:scale-110" />

        {/* Multiple Gradient Overlays for Depth */}
        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

        {/* Floating Orbs/Blur Effects */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-purple-500/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-fuchsia-500/30 rounded-full blur-[100px] animate-pulse delay-1000" />

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12">
            {/* Left Content */}
            <div className="flex-1 space-y-6 md:space-y-8 text-center lg:text-left">
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white text-xs md:text-sm font-semibold tracking-wide">
                  🎵 Premium Sound Experience
                </span>
              </div>

              {/* Massive Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.1]">
                Where Music
                <br />
                <span className="bg-clip-text bg-linear-to-r from-violet-400 via-fuchsia-400 to-pink-400 neon-text animate-pulse">
                  Comes Alive
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-gray-200 dark:text-gray-300 text-lg md:text-xl lg:text-2xl leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
                Discover millions of songs, curated playlists, and exclusive
                content from your favorite artists. Your soundtrack starts here.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <button className="group/btn px-8 py-4 bg-white text-black rounded-full font-bold text-base md:text-lg shadow-2xl hover:shadow-white/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Start Listening Now
                </button>

                <button className="px-8 py-4 bg-white/10 backdrop-blur-xl text-white border-2 border-white/30 rounded-full font-bold text-base md:text-lg hover:bg-white/20 hover:border-white/50 hover:scale-105 transition-all duration-300 shadow-xl">
                  Explore Playlists
                </button>
              </div>

              {/* Stats/Features */}
              <div className="flex flex-wrap gap-6 md:gap-8 justify-center lg:justify-start pt-6 text-white/80">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <span className="text-sm md:text-base font-medium">
                    100M+ Songs
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-purple-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <span className="text-sm md:text-base font-medium">
                    Ad-Free
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-pink-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <span className="text-sm md:text-base font-medium">
                    HD Quality
                  </span>
                </div>
              </div>
            </div>

            {/* Right Content - Floating Card (Hidden on Mobile) */}
            <div className="hidden lg:block shrink-0">
              <div className="relative w-80 h-80 group/card">
                {/* Glassmorphism Card */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl transform rotate-6 group-hover/card:rotate-12 transition-transform duration-500" />
                <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl transform -rotate-3 group-hover/card:-rotate-6 transition-transform duration-500" />
                <div className="relative bg-linear-to-br from-white/20 to-white/5 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl p-6 h-full flex flex-col justify-between hover:scale-105 transition-transform duration-500">
                  <div>
                    <div className="w-full h-48 bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 flex items-center justify-center">
                      <svg
                        className="w-20 h-20 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">
                      Now Playing
                    </h3>
                    <p className="text-white/70 text-sm">
                      Your favorite tracks
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-6 h-6 text-black"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full w-2/3 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Songs */}
      {featuredSongs.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
            <span className="w-2 h-8 bg-blue-500 mr-3 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
            Featured Songs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {featuredSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>
      )}

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
