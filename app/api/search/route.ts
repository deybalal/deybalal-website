import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const query = body.query;

  if (!query || query.trim().length === 0) {
    return NextResponse.json({
      songs: [],
      artists: [],
      albums: [],
      playlists: [],
    });
  }

  const normalizedQuery = query.trim();

  try {
    const [songs, albums, playlists, artists] = await Promise.all([
      // 1. Search Songs (Limit 20)
      prisma.song.findMany({
        where: {
          OR: [
            { title: { contains: normalizedQuery, mode: "insensitive" } },
            { artist: { contains: normalizedQuery, mode: "insensitive" } },
            { albumName: { contains: normalizedQuery, mode: "insensitive" } },
            { titleEn: { contains: normalizedQuery, mode: "insensitive" } },
          ],
          isActive: true,
        },
        take: 20,
        select: {
          id: true,
          title: true,
          artist: true,
          coverArt: true,
          slug: true,
        },
      }),

      // 2. Search Albums (Limit 20)
      prisma.album.findMany({
        where: {
          OR: [
            { name: { contains: normalizedQuery, mode: "insensitive" } },
            { artistName: { contains: normalizedQuery, mode: "insensitive" } },
            {
              artistNameEn: { contains: normalizedQuery, mode: "insensitive" },
            },
          ],
          isActive: true,
        },
        take: 20,
        select: {
          id: true,
          name: true,
          artistName: true,
          coverArt: true,
        },
      }),

      // 3. Search Playlists (Limit 20)
      prisma.playlist.findMany({
        where: {
          name: { contains: normalizedQuery, mode: "insensitive" },
        },
        take: 20,
        select: {
          id: true,
          name: true,
          coverArt: true,
        },
      }),

      // 4. Search Artists (Limit 20)
      prisma.artist.findMany({
        where: {
          OR: [
            { name: { contains: normalizedQuery, mode: "insensitive" } },
            { nameEn: { contains: normalizedQuery, mode: "insensitive" } },
          ],
        },
        take: 20,
        select: {
          id: true,
          name: true,
          image: true,
        },
      }),
    ]);

    return NextResponse.json({
      songs,
      artists,
      albums,
      playlists,
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "خطا در انجام جستوجو" }, { status: 500 });
  }
}
