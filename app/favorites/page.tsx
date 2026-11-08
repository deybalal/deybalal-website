import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import PlaylistClient from "@/components/PlaylistClient";
import { Suspense } from "react";
import { getAssetUrl, resolveSongLinks } from "@/lib/utils";
import PlaylistSkeleton from "@/components/PlaylistSkeleton";
import { Heart } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "آهنگ های موردعلاقه",
  description: "لیست آهنگ های مورد علاقه شما در دی بلال",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sortBy?: string; sortOrder?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <div className="size-full flex items-center justify-center p-4 min-h-[70vh]">
        <div className="text-center py-12 text-muted-foreground w-full max-w-md bg-black/20 p-8 rounded-2xl border border-white/5 backdrop-blur-md flex flex-col items-center">
          <Heart
            size={64}
            className="text-red-500 fill-red-500 animate-pulse mb-6 opacity-80"
          />
          <h2 className="text-2xl font-bold text-white mb-2">
            لیست آهنگ های موردعلاقه
          </h2>
          <p className="text-gray-300 mb-6 text-sm">
            برای مشاهده آهنگ های موردعلاقه خود باید ابتدا وارد حساب کاربری شوید.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3 px-6 rounded-full font-bold bg-linear-to-br from-violet-600 to-indigo-600 text-white shadow-lg hover:scale-105 transition-all duration-300 text-center"
          >
            ورود به حساب کاربری
          </Link>
        </div>
      </div>
    );
  }

  const { page, sortBy, sortOrder } = await searchParams;
  const currentPage = Number(page) || 1;
  const sortField = typeof sortBy === "string" ? sortBy : "addedAt";
  const sortDir = (typeof sortOrder === "string" ? sortOrder : "desc") as
    | "asc"
    | "desc";
  const pageSize = 20;

  // Try to find the favorites playlist or create it if not present
  let favoritesPlaylist = await prisma.playlist.findFirst({
    where: {
      isFavorite: true,
      userId: session.user.id,
    },
  });

  if (!favoritesPlaylist) {
    favoritesPlaylist = await prisma.playlist.create({
      data: {
        name: "Favorites",
        description: "Your favorite songs",
        isFavorite: true,
        duration: 0,
        userId: session.user.id,
      },
    });
  }

  // Fetch playlist data with sorted/paginated songs
  const playlistData = await prisma.playlist.findUnique({
    where: { id: favoritesPlaylist.id },
    include: {
      _count: {
        select: { songs: { where: { song: { isActive: true } } } },
      },
      songs: {
        where: { song: { isActive: true } },
        include: {
          song: {
            include: {
              artists: true,
            },
          },
        },
        orderBy:
          sortField === "addedAt"
            ? { addedAt: sortDir }
            : { song: { [sortField]: sortDir } },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      },
    },
  });

  if (!playlistData) {
    return (
      <div className="size-full flex items-center justify-center p-4">
        <p className="text-white">خطا در دریافت لیست آهنگ های مورد علاقه</p>
      </div>
    );
  }

  // Transform playlist to match the Playlist type format
  const playlist = {
    ...playlistData,
    userId: undefined,
    doesUserOwnsPlaylist: true,
    description: playlistData.description ?? undefined,
    coverArt: playlistData.coverArt ? getAssetUrl(playlistData.coverArt) : undefined,
    songsLength: playlistData._count.songs,
    createdAt: playlistData.createdAt.getTime(),
    updatedAt: playlistData.updatedAt.getTime(),
    songs: playlistData.songs.map((ps) => ({
      ...ps.song,
      coverArt: getAssetUrl(ps.song.coverArt),
      addedAt: ps.addedAt.getTime(),
      uri: getAssetUrl(ps.song.uri ?? ""),
      filename: ps.song.filename ?? "",
      artist: ps.song.artist,
      album: ps.song.albumName,
      albumId: ps.song.albumId,
      artists: ps.song.artists.map((a) => ({ ...a, image: getAssetUrl(a.image) })),
      index: ps.song.index,
      year: ps.song.year?.toString() || "0",
      comment: null,
      date: null,
      isFavorite: true,
      links: resolveSongLinks(ps.song.links as Record<
        number,
        { url: string; size: string; bytes: number }
      > | null),
    })),
  };

  return (
    <Suspense key={currentPage} fallback={<PlaylistSkeleton />}>
      <PlaylistClient
        playlist={playlist}
        currentPage={currentPage}
        totalPages={Math.ceil(playlistData._count.songs / pageSize)}
      />
    </Suspense>
  );
}
