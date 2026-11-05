import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Fuse from "fuse.js";

export async function POST(request: Request) {
  const body = await request.json();
  const query = body.query;

  if (!query || query.trim().length === 0) {
    return NextResponse.json({
      songs: [],
      artists: [],
      albums: [],
      playlists: [],
      topResult: null,
    });
  }

  const normalizedQuery = query.trim();
  const scope = body.scope as {
    type: "artist" | "album" | "playlist";
    id: string;
  } | null;

  try {
    const isScoped = !!scope;

    const [songs, albums, playlists, artists] = await Promise.all([
      // 1. Search Songs
      prisma.song.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: normalizedQuery } },
                { artist: { contains: normalizedQuery } },
                {
                  albumName: { contains: normalizedQuery },
                },
                { titleEn: { contains: normalizedQuery } },
              ],
            },
            { isActive: true },
            scope?.type === "artist"
              ? { artists: { some: { id: scope.id } } }
              : {},
            scope?.type === "album" ? { albumId: scope.id } : {},
            scope?.type === "playlist"
              ? { playlists: { some: { id: scope.id } } }
              : {},
          ],
        },
        take: 30, // Get a bit more for ranking
        select: {
          id: true,
          title: true,
          artist: true,
          coverArt: true,
          slug: true,
          titleEn: true,
          artistEn: true,
        },
      }),

      // 2. Search Albums
      isScoped && scope.type !== "artist"
        ? Promise.resolve([])
        : prisma.album.findMany({
            where: {
              AND: [
                {
                  OR: [
                    {
                      name: { contains: normalizedQuery },
                    },
                    {
                      artistName: {
                        contains: normalizedQuery,
                      },
                    },
                    {
                      artistNameEn: {
                        contains: normalizedQuery,
                      },
                    },
                  ],
                },
                { isActive: true },
                scope?.type === "artist" ? { artistId: scope.id } : {},
              ],
            },
            take: 15,
            select: {
              id: true,
              name: true,
              artistName: true,
              artistNameEn: true,
              coverArt: true,
            },
          }),

      // 3. Search Playlists
      isScoped
        ? Promise.resolve([])
        : prisma.playlist.findMany({
            where: {
              name: { contains: normalizedQuery },
              isPrivate: false,
            },
            take: 10,
            select: {
              id: true,
              name: true,
              coverArt: true,
            },
          }),

      // 4. Search Artists
      isScoped
        ? Promise.resolve([])
        : prisma.artist.findMany({
            where: {
              OR: [
                { name: { contains: normalizedQuery } },
                { nameEn: { contains: normalizedQuery } },
              ],
            },
            take: 10,
            select: {
              id: true,
              name: true,
              nameEn: true,
              image: true,
            },
          }),
    ]);

    // Combine all for Top Result calculation
    const allResults = [
      ...songs.map((s) => ({ ...s, type: "song" })),
      ...artists.map((a) => ({ ...a, type: "artist" })),
      ...albums.map((al) => ({ ...al, type: "album" })),
      ...playlists.map((p) => ({ ...p, type: "playlist" })),
    ];

    const fuse = new Fuse(allResults, {
      keys: [
        { name: "title", weight: 1 },
        { name: "name", weight: 1 },
        { name: "titleEn", weight: 0.7 },
        { name: "nameEn", weight: 0.7 },
        { name: "artist", weight: 0.5 },
        { name: "artistName", weight: 0.5 },
      ],
      includeScore: true,
      threshold: 0.4,
    });

    const fuzzyResults = fuse.search(normalizedQuery);
    const topResultMatch = fuzzyResults[0];

    // If we have a very strong match (score < 0.2), prioritize it as topResult
    // Otherwise, use the first exact Prisma match or just the first fuzzy result
    let topResult = null;
    if (topResultMatch && topResultMatch.score! < 0.4) {
      topResult = topResultMatch.item;
    } else if (allResults.length > 0) {
      topResult = allResults[0];
    }

    return NextResponse.json({
      songs: songs.slice(0, 20),
      artists: artists.slice(0, 20),
      albums: albums.slice(0, 20),
      playlists: playlists.slice(0, 20),
      topResult,
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "خطا در انجام جستوجو" }, { status: 500 });
  }
}
