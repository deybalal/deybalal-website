import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import SongList from "@/components/SongList";
import AlbumCard from "@/components/AlbumCard";
import { User } from "lucide-react";
import Image from "next/image";
import { Song, Album } from "@/types/types";
import ArtistPlayButton from "@/components/ArtistPlayButton";
import Pagination from "@/components/Pagination";
import { FollowButton } from "@/components/FollowButton";

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
    ...song,
    artists: [
      {
        id: artist!.id,
        name: artist!.name,
        image: artist!.image,
        isVerified: artist.isVerified,
        songs: [], // Empty array since we don't need nested song data
      },
    ],
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

  // Map Prisma albums to our app's Album type
  const albums: Album[] = artist.albums.map((album) => ({
    ...album,
    artistName: artist!.name,
    artistId: artist!.id,
    songs: [], // We don't need songs for the card view
    releaseDate: album.releaseDate ? Number(album.releaseDate) : 0,
    createdAt: new Date(album.createdAt).getTime(),
    updatedAt: new Date(album.updatedAt).getTime(),
    coverArt: album.coverArt || undefined,
  }));

  return (
    <div className="space-y-10 w-[95%]">
      {/* Header */}
      <div className="flex flex-col items-center md:items-start gap-6">
        <div className="w-48 h-48 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden shadow-2xl neon-box relative">
          {artist.image ? (
            <Image
              src={artist.image}
              alt={artist.name}
              fill
              className="object-cover"
            />
          ) : (
            <User size={64} className="text-gray-500" />
          )}
        </div>
        <div className="text-center md:text-start">
          <h1 className="text-5xl md:text-7xl font-bold text-white neon-text mb-4">
            {artist.name}
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-8 md:gap-4 mb-2 flex-col md:flex-row">
            <p className="text-gray-400 text-lg">
              {artist._count.songs} آهنگ • {albums.length} آلبوم
            </p>
            <FollowButton artistId={artist.id} />
            <ArtistPlayButton songs={songs} />
          </div>
        </div>
      </div>

      {/* Popular Songs */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6">آهنگ ها</h2>
        {songs.length > 0 ? (
          <div className="bg-foreground/5 rounded-2xl p-6 border border-white/5">
            <SongList songs={songs} />
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(artist._count.songs / pageSize)}
            />
          </div>
        ) : (
          <p className="text-gray-500">
            هیچ آهنگی از این خواننده در پلتفرم دی بلال موجود نیست!
          </p>
        )}
      </section>

      {/* Albums */}
      <section className="pb-24">
        <h2 className="text-2xl font-bold text-foreground mb-6">آلبوم ها</h2>
        {albums.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            هیچ آلبومی از این خواننده در پلتفرم دی بلال موجود نیست!
          </p>
        )}
      </section>
    </div>
  );
}
