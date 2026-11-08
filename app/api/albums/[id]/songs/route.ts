import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAssetUrl, resolveSongLinks } from "@/lib/utils";

/**
 * GET /api/albums/[id]/songs
 * Returns ALL active songs for an album (no pagination).
 * Used by play buttons to queue the full album catalog.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    // Try by ID first, then by name
    const album = await prisma.album.findFirst({
      where: {
        OR: [{ id: decodedId }, { name: decodedId }],
      },
      select: {
        id: true,
        name: true,
        songs: {
          where: { isActive: true },
          orderBy: { index: "asc" },
          select: {
            id: true,
            title: true,
            titleEn: true,
            uri: true,
            filename: true,
            index: true,
            duration: true,
            coverArt: true,
            artist: true,
            albumName: true,
            albumId: true,
            playCount: true,
            year: true,
            links: true,
          },
        },
      },
    });

    if (!album) {
      return NextResponse.json(
        { success: false, message: "خواننده پیدا نشد!" },
        { status: 404 }
      );
    }

    // Map to Song type format
    const songs = album.songs.map((song) => ({
      id: song.id,
      title: song.title,
      titleEn: song.titleEn,
      uri: getAssetUrl(song.uri),
      filename: song.filename || "",
      index: song.index,
      duration: song.duration,
      coverArt: getAssetUrl(song.coverArt),
      artist: album!.name,
      album: song.albumName,
      playCount: song.playCount,
      albumId: song.albumId,
      year: song.year?.toString() ?? null,
      links: resolveSongLinks(song.links as any),
      artists: [
        {
          id: album!.id,
          name: album!.name,
        },
      ],
    }));

    return NextResponse.json({ success: true, data: songs });
  } catch (error) {
    console.error("Error fetching album songs:", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت آهنگ های آلبوم!" },
      { status: 500 }
    );
  }
}
