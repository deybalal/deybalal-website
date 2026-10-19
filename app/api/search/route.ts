import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  parseSearchQuery,
  buildSongSearchWhere,
  buildAlbumSearchWhere,
  buildArtistSearchWhere,
  buildPlaylistSearchWhere,
  calculateRelevance,
} from "@/lib/search-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query;

    const parsed = parseSearchQuery(query);

    if (!parsed.raw || parsed.coreTokens.length === 0) {
      return NextResponse.json({
        songs: [],
        artists: [],
        albums: [],
        playlists: [],
        radioPlaylist: [],
        topResult: null,
      });
    }

    const scope = body.scope as {
      type: "artist" | "album" | "playlist" | "radioPlaylist";
      id: string;
    } | null;

    const isScoped = !!scope;

    // 1. Build queries
    const { highPrecisionWhere, broadRecallWhere } = buildSongSearchWhere(
      parsed,
      scope
    );

    // Run parallel DB queries
    const [
      highPrecisionSongs,
      candidateAlbums,
      candidatePlaylists,
      candidateArtists,
      candidateRadioTracks,
    ] = await Promise.all([
      // 1. Songs (High Precision)
      prisma.song.findMany({
        where: highPrecisionWhere,
        orderBy: [{ playCount: "desc" }],
        take: 35,
        select: {
          id: true,
          title: true,
          artist: true,
          coverArt: true,
          slug: true,
          titleEn: true,
          artistEn: true,
          albumName: true,
          playCount: true,
        },
      }),

      // 2. Albums
      isScoped && scope.type !== "artist"
        ? Promise.resolve([])
        : prisma.album.findMany({
            where: buildAlbumSearchWhere(parsed, scope),
            take: 20,
            select: {
              id: true,
              name: true,
              artistName: true,
              artistNameEn: true,
              coverArt: true,
            },
          }),

      // 3. Playlists
      isScoped
        ? Promise.resolve([])
        : prisma.playlist.findMany({
            where: buildPlaylistSearchWhere(parsed),
            take: 15,
            select: {
              id: true,
              name: true,
              coverArt: true,
            },
          }),

      // 4. Artists
      isScoped && scope.type !== "artist"
        ? Promise.resolve([])
        : prisma.artist.findMany({
            where: buildArtistSearchWhere(parsed),
            take: 20,
            select: {
              id: true,
              name: true,
              nameEn: true,
              image: true,
            },
          }),

      // 5. RadioPlaylists
      isScoped && scope.type !== "radioPlaylist"
        ? Promise.resolve([])
        : prisma.radioTrack.findMany({
            where: {
              playlistId: scope?.id,
            },
            take: 15,
            select: {
              id: true,
              song: true,
              duration: true,
            },
          }),
    ]);

    // If songs from high precision are few and multi-word query, supplement with broad recall
    let allCandidateSongs = highPrecisionSongs;
    if (highPrecisionSongs.length < 15 && parsed.coreTokens.length > 1) {
      const existingIds = new Set(highPrecisionSongs.map((s) => s.id));
      const broadSongs = await prisma.song.findMany({
        where: {
          AND: [broadRecallWhere, { id: { notIn: Array.from(existingIds) } }],
        },
        orderBy: [{ playCount: "desc" }],
        take: 35 - highPrecisionSongs.length,
        select: {
          id: true,
          title: true,
          artist: true,
          coverArt: true,
          slug: true,
          titleEn: true,
          artistEn: true,
          albumName: true,
          playCount: true,
        },
      });
      allCandidateSongs = [...highPrecisionSongs, ...broadSongs];
    }

    // Rank Songs
    const scoredSongs = allCandidateSongs
      .map((s) => ({
        ...s,
        type: "song" as const,
        ...calculateRelevance(parsed, { ...s, type: "song" }),
      }))
      .filter((s) => s.score > 20)
      .sort((a, b) => b.score - a.score);

    // Rank Artists
    const scoredArtists = candidateArtists
      .map((a) => ({
        ...a,
        type: "artist" as const,
        ...calculateRelevance(parsed, { ...a, type: "artist" }),
      }))
      .filter((a) => a.score > 20)
      .sort((a, b) => b.score - a.score);

    // Rank Albums
    const scoredAlbums = candidateAlbums
      .map((al) => ({
        ...al,
        type: "album" as const,
        ...calculateRelevance(parsed, { ...al, type: "album" }),
      }))
      .filter((al) => al.score > 20)
      .sort((a, b) => b.score - a.score);

    // Rank Playlists
    const scoredPlaylists = candidatePlaylists
      .map((p) => ({
        ...p,
        type: "playlist" as const,
        ...calculateRelevance(parsed, { ...p, type: "playlist" }),
      }))
      .filter((p) => p.score > 15)
      .sort((a, b) => b.score - a.score);

    // Determine Top Result across all categories
    const allRanked = [
      ...scoredSongs,
      ...scoredArtists,
      ...scoredAlbums,
      ...scoredPlaylists,
    ].sort((a, b) => b.score - a.score);

    type TopResultType =
      | {
          id: string;
          title: string;
          artist: string;
          coverArt: string | null;
          slug: string;
          type: "song";
        }
      | {
          id: string;
          name: string;
          image: string | null;
          type: "artist";
        }
      | {
          id: string;
          name: string;
          artistName: string;
          coverArt: string | null;
          type: "album";
        }
      | {
          id: string;
          name: string;
          coverArt: string | null;
          type: "playlist";
        }
      | null;

    let topResult: TopResultType = null;
    if (allRanked.length > 0) {
      const best = allRanked[0];
      if (best.type === "song") {
        topResult = {
          id: best.id,
          title: best.title,
          artist: best.artist,
          coverArt: best.coverArt,
          slug: best.slug,
          type: "song",
        };
      } else if (best.type === "artist") {
        topResult = {
          id: best.id,
          name: best.name,
          image: best.image,
          type: "artist",
        };
      } else if (best.type === "album") {
        topResult = {
          id: best.id,
          name: best.name,
          artistName: best.artistName,
          coverArt: best.coverArt,
          type: "album",
        };
      } else if (best.type === "playlist") {
        topResult = {
          id: best.id,
          name: best.name,
          coverArt: best.coverArt,
          type: "playlist",
        };
      }
    }

    return NextResponse.json({
      songs: scoredSongs.slice(0, 20).map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        coverArt: s.coverArt,
        slug: s.slug,
        titleEn: s.titleEn,
        artistEn: s.artistEn,
      })),
      artists: scoredArtists.slice(0, 20).map((a) => ({
        id: a.id,
        name: a.name,
        nameEn: a.nameEn,
        image: a.image,
      })),
      albums: scoredAlbums.slice(0, 20).map((al) => ({
        id: al.id,
        name: al.name,
        artistName: al.artistName,
        artistNameEn: al.artistNameEn,
        coverArt: al.coverArt,
      })),
      playlists: scoredPlaylists.slice(0, 20).map((p) => ({
        id: p.id,
        name: p.name,
        coverArt: p.coverArt,
      })),
      radioPlaylist: candidateRadioTracks.slice(0, 20),
      topResult,
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "خطا در انجام جستوجو" }, { status: 500 });
  }
}
