import { prisma } from "@/lib/prisma";
import SongList from "@/components/SongList";
import AlbumCard from "@/components/AlbumCard";
import { User } from "lucide-react";
import Image from "next/image";
import { Song, Album } from "@/types/types";
import ArtistPlayButton from "@/components/ArtistPlayButton";

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  // Try to find by ID first, then by Name
  let artist = await prisma.artist.findUnique({
    where: { id: decodedId },
    include: {
      songs: {
        orderBy: { index: "asc" },
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
        songs: {
          orderBy: { index: "asc" },
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
        <h2 className="text-2xl font-bold">Artist not found</h2>
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
    <div className="space-y-10">
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
        <div className="text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-bold text-white neon-text mb-4">
            {artist.name}
          </h1>
          <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
            <p className="text-gray-400 text-lg">
              {songs.length} Songs • {albums.length} Albums
            </p>
            <ArtistPlayButton songs={songs} />
          </div>
        </div>
      </div>

      {/* Popular Songs */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6">Songs</h2>
        {songs.length > 0 ? (
          <div className="bg-foreground/5 rounded-2xl p-6 border border-white/5">
            <SongList songs={songs} />
          </div>
        ) : (
          <p className="text-gray-500">No songs found for this artist.</p>
        )}
      </section>

      {/* Albums */}
      <section className="pb-24">
        <h2 className="text-2xl font-bold text-foreground mb-6">Discography</h2>
        {albums.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No albums found for this artist.</p>
        )}
      </section>
    </div>
  );
}
