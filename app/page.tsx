import AlbumCard from "@/components/AlbumCard";
import ArtistCard from "@/components/ArtistCard";
import GenreCard from "@/components/GenreCard";
import SongCard from "@/components/SongCard";
import { prisma } from "@/lib/prisma";
import { Song as PrismaSong, Artist as PrismaArtist } from "@prisma/client";
import SectionHeader from "@/components/ui/SectionHeader";
import HeroLyricsDemo from "@/components/HeroLyricsDemo";

import { Metadata } from "next";
import Footer from "@/components/Footer";
import Link from "next/link";
import PlayRandomButton from "@/components/PlayRandomButton";

export const metadata: Metadata = {
  title: "دی بلال | پلتفرم پخش آنلاین آهنگ لری به همراه متن آهنگ",
  description:
    "به دی بلال خوش آمدید. جدیدترین آهنگ‌ها، خوانندگان پیشنهادی و سبک‌های محبوب را کاوش کنید.",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const [
    featuredSongsData,
    newSongsData,
    albumsData,
    mostPlayedSongsData,
    genresData,
  ] = await Promise.all([
    prisma.song.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { artists: true },
    }),
    prisma.song.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 14,
      include: { artists: true },
    }),
    prisma.album.findMany({
      where: { isActive: true },
      include: { songs: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.song.findMany({
      where: { isActive: true },
      orderBy: { playCount: "desc" },
      take: 20,
      include: { artists: true },
    }),
    prisma.genre.findMany({
      include: { _count: { select: { songs: true } } },
      orderBy: { songs: { _count: "desc" } },
      take: 10,
    }),
    prisma.song.findMany({
      where: { isActive: true },
      orderBy: { playlists: { _count: "desc" } },
      take: 20,
      include: { artists: true },
    }),
  ]);

  // Extract unique artists from most played songs as a proxy for "Most Played Artists"
  const artistMap = new Map<string, PrismaArtist>();
  mostPlayedSongsData.forEach((song) => {
    song.artists.forEach((artist) => {
      if (!artistMap.has(artist.id)) {
        artistMap.set(artist.id, artist);
      }
    });
  });
  const mostPlayedArtists = Array.from(artistMap.values()).slice(0, 10);

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
    links: song.links as Record<
      number,
      { url: string; size: string; bytes: number }
    > | null,
  });

  const featuredSongs = featuredSongsData.map(mapSong);
  const newSongs = newSongsData.map(mapSong);
  const mostPlayedSongs = mostPlayedSongsData.map(mapSong);

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
      links: song.links as Record<
        number,
        { url: string; size: string; bytes: number }
      > | null,
    })),
  }));

  const genreColors = [
    "bg-purple-500",
    "bg-blue-500",
    "bg-pink-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-teal-500",
    "bg-indigo-500",
  ];

  return (
    <div className="space-y-12 pb-20 h-max container">
      {/* Hero Section - Premium Music Platform Design */}
      <section className="relative min-h-[500px] lg:min-h-[600px] rounded-2xl md:rounded-3xl overflow-hidden flex items-center px-6 py-12 md:px-12 lg:px-16 group">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-linear-to-br from-violet-600 via-purple-600 to-fuchsia-600 dark:from-violet-900 dark:via-purple-900 dark:to-fuchsia-900 animate-gradient-slow" />

        {/* Overlay Pattern with Animation */}
        <div className="absolute inset-0 bg-[url('/images/temp_landing.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay transition-transform duration-1000 group-hover:scale-110" />

        {/* Multiple Gradient Overlays for Depth */}
        <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

        {/* Floating Orbs/Blur Effects */}
        <div className="absolute top-20 end-20 w-96 h-96 bg-purple-500/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-20 start-20 w-80 h-80 bg-fuchsia-500/30 rounded-full blur-[100px] animate-pulse delay-1000" />

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12">
            {/* Left Content */}
            <div className="flex-1 space-y-6 md:space-y-8 text-center lg:text-start">
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-white text-xs md:text-sm font-semibold tracking-wide">
                  🎵 تجربه صدای با کیفیت
                </span>
              </div>

              {/* Massive Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.1]">
                جایی که موسیقی
                <br />
                <span className="bg-clip-text bg-linear-to-r from-violet-400 via-fuchsia-400 to-pink-400 neon-text animate-pulse">
                  زنده می‌شود
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-gray-200 dark:text-gray-300 text-lg md:text-xl lg:text-2xl leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
                میلیون‌ها آهنگ، لیست‌های پخش منتخب و متن آهنگ از هنرمندان مورد
                علاقه خود را کشف کنید. موسیقی شما از اینجا شروع می‌شود.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <PlayRandomButton />

                <Link
                  href="/artist"
                  className="px-8 py-4 bg-white/10 backdrop-blur-xl text-white border-2 border-white/30 rounded-full font-bold text-base md:text-lg hover:bg-white/20 hover:border-white/50 hover:scale-105 transition-all duration-300 shadow-xl"
                >
                  مشاهده خواننده ها
                </Link>
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
                    +100 میلیون آهنگ
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
                    بدون تبلیغات
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
                    کیفیت HD
                  </span>
                </div>
              </div>
            </div>

            {/* Right Content - Floating Card (Hidden on Mobile) */}
            {/* Right Content - Floating Card (Hidden on Mobile) */}
            <HeroLyricsDemo />
          </div>
        </div>
      </section>

      {/* Featured Songs */}
      {featuredSongs.length > 0 && (
        <section>
          <SectionHeader title="آهنگ‌های پیشنهادی" color="bg-blue-500" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {featuredSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>
      )}

      {/* New Releases (Previously Trending/New) */}
      <section>
        <SectionHeader title="جدیدترین‌ها" color="bg-green-500" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {newSongs.length > 0 ? (
            newSongs.map((song) => <SongCard key={song.id} song={song} />)
          ) : (
            <p className="text-gray-500 col-span-full">
              آهنگی یافت نشد. در پنل مدیریت آهنگ اضافه کنید!
            </p>
          )}
        </div>
      </section>

      {/* Most Played Artists */}
      {mostPlayedArtists.length > 0 && (
        <section>
          <SectionHeader
            title="محبوب‌ترین خواننده‌ها"
            color="bg-pink-500"
            href="/artist"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {mostPlayedArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </section>
      )}

      {/* Most Played Songs */}
      <section>
        <SectionHeader
          title="محبوب‌ترین آهنگ‌ها"
          color="bg-orange-500"
          href="/songs"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {mostPlayedSongs.length > 0 ? (
            mostPlayedSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))
          ) : (
            <p className="text-gray-500 col-span-full">
              آهنگی یافت نشد. برای مشاهده آهنگ‌ها، گوش دادن را شروع کنید!
            </p>
          )}
        </div>
      </section>

      {/* New Albums */}
      <section>
        <SectionHeader
          title="آلبوم‌های جدید"
          color="bg-teal-500"
          href="/album"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {albums.length > 0 ? (
            albums.map((album) => <AlbumCard key={album.id} album={album} />)
          ) : (
            <p className="text-gray-500 col-span-full">
              آلبومی یافت نشد. در پنل مدیریت آلبوم اضافه کنید!
            </p>
          )}
        </div>
      </section>

      {/* Genres */}
      {genresData.length > 0 && (
        <section>
          <SectionHeader
            title="سبک‌های محبوب"
            color="bg-purple-500"
            href="/genres"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {genresData.map((genre, index) => (
              <GenreCard
                key={genre.id}
                genre={genre}
                color={genreColors[index % genreColors.length]}
              />
            ))}
          </div>
        </section>
      )}
      <Footer />
    </div>
  );
}
