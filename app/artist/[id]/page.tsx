import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import SongList from "@/components/SongList";
import AlbumCard from "@/components/AlbumCard";
import { User, Music } from "lucide-react";
import Image from "next/image";
import { Song, Album } from "@/types/types";
import ArtistPlayButton from "@/components/ArtistPlayButton";
import Pagination from "@/components/Pagination";
import { FollowButton } from "@/components/FollowButton";
import ArtistDescription from "@/components/ArtistDescription";
import SectionHeader from "@/components/ui/SectionHeader";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  let artist = await prisma.artist.findUnique({
    where: { id: decodedId },
  });

  if (!artist) {
    artist = await prisma.artist.findUnique({
      where: { name: decodedId },
    });
  }

  if (!artist) return { title: "خواننده پیدا نشد!" };

  const title = `${artist.name} | خواننده`;
  const description = `شنونده ی آهنگ ها و آلبوم های ${artist.name} در پلتفرم دی بلال باشید.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: artist.image ? [artist.image] : [],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: artist.image ? [artist.image] : [],
    },
  };
}

export default async function ArtistDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;
  const decodedId = decodeURIComponent(id);
  const currentPage = Number(page) || 1;
  const pageSize = 20;

  // Try to find by ID first, then by Name
  let artist = await prisma.artist.findUnique({
    where: { id: decodedId },
    include: {
      _count: {
        select: { songs: { where: { isActive: true } } },
      },
      songs: {
        where: { isActive: true },
        orderBy: { index: "asc" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      },
      albums: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!artist) {
    artist = await prisma.artist.findUnique({
      where: { name: decodedId },
      include: {
        _count: {
          select: { songs: { where: { isActive: true } } },
        },
        songs: {
          where: { isActive: true },
          orderBy: { index: "asc" },
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
        },
        albums: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  if (!artist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
        <User className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-2xl font-bold">خواننده پیدا نشد!</h2>
      </div>
    );
  }

  // Map Prisma songs to our app's Song type
  const songs: Song[] = artist.songs.map((song) => ({
    id: song.id,
    title: song.title,
    titleEn: song.titleEn,
    uri: song.uri,
    filename: song.filename || "",
    index: song.index,
    duration: song.duration,
    coverArt: song.coverArt,
    artist: artist!.name,
    album: song.albumName,
    playCount: song.playCount,
    albumId: song.albumId,
    year: song.year.toString(),
    links: song.links as Song["links"],
    artists: [
      {
        id: artist!.id,
        name: artist!.name,
        image: artist!.image,
        isVerified: artist!.isVerified,
        songs: [],
      },
    ],
  }));

  // Map Prisma albums to our app's Album type
  const albums: Album[] = artist.albums.map((album) => ({
    id: album.id,
    name: album.name,
    artistId: artist!.id,
    artistName: artist!.name,
    coverArt: album.coverArt || undefined,
    songs: [],
    releaseDate: album.releaseDate ? Number(album.releaseDate) : 0,
    duration: album.duration,
    createdAt: new Date(album.createdAt).getTime(),
    updatedAt: new Date(album.updatedAt).getTime(),
  }));

  return (
    <div className="space-y-12 pb-24 h-max w-full md:w-auto">
      {/* Header Section */}
      <div className="relative min-h-[400px] md:h-[50vh] -mt-8 overflow-hidden rounded-b-[3rem] shadow-2xl flex flex-col justify-center">
        {/* Blurred Background */}
        {artist.image && (
          <div className="absolute inset-0 z-0">
            <Image
              src={artist.image}
              alt={artist.name}
              fill
              className="object-cover blur-3xl opacity-30 scale-110"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
          </div>
        )}

        <div className="relative z-10 w-full p-6 md:p-12 mt-12 md:mt-2">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
            <div className="relative w-40 h-40 md:w-64 md:h-64 shrink-0 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 group">
              {artist.image ? (
                <Image
                  src={artist.image}
                  alt={artist.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User size={60} className="text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-right space-y-4 w-full">
              <div className="space-y-2">
                {artist.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold tracking-wider uppercase">
                    <Image
                      src="/images/verified.svg"
                      alt="خواننده تایید شده"
                      width={20}
                      height={20}
                    />
                    خواننده تایید شده
                  </span>
                )}
                <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter neon-text wrap-break-word">
                  {artist.name}
                </h1>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-6">
                <div className="flex items-center gap-6 text-muted-foreground font-medium">
                  <div className="flex flex-col items-center md:items-start">
                    <span className="text-foreground text-lg md:text-xl font-bold">
                      {artist._count.songs}
                    </span>
                    <span className="text-[10px] md:text-xs uppercase tracking-widest">
                      آهنگ
                    </span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col items-center md:items-start">
                    <span className="text-foreground text-lg md:text-xl font-bold">
                      {albums.length}
                    </span>
                    <span className="text-[10px] md:text-xs uppercase tracking-widest">
                      آلبوم
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:ms-auto">
                  <FollowButton artistId={artist.id} />
                  <ArtistPlayButton songs={songs} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-0 md:px-8 space-y-16">
        {/* Description */}
        {artist.description && (
          <section className="max-w-4xl">
            <SectionHeader title="درباره خواننده" color="bg-blue-500" />
            <div className="glass p-8 rounded-3xl border border-white/5">
              <ArtistDescription description={artist.description} />
            </div>
          </section>
        )}

        {/* Songs Section */}
        <section className="w-full">
          <SectionHeader title="آهنگ های برتر" color="bg-purple-500" />
          {songs.length > 0 ? (
            <div className="glass rounded-3xl p-1 md:p-8 border border-white/5 w-full">
              <SongList songs={songs} showArtist={false} />
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(artist._count.songs / pageSize)}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl border border-white/5 text-muted-foreground">
              <Music className="w-12 h-12 mb-4 opacity-20" />
              <p>هیچ آهنگی از این خواننده یافت نشد.</p>
            </div>
          )}
        </section>

        {/* Albums Section */}
        {albums.length > 0 && (
          <section>
            <SectionHeader title="آلبوم ها" color="bg-pink-500" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
