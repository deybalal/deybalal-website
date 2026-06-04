import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/playlists/[id]/songs
 * Returns ALL active songs for a playlist (no pagination).
 * Used by play buttons to queue the full playlist.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      select: {
        id: true,
        isPrivate: true,
        songs: {
          where: { song: { isActive: true } },
          orderBy: { addedAt: "desc" },
          select: {
            addedAt: true,
            song: {
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
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { success: false, message: "پلی لیست پیدا نشد!" },
        { status: 404 }
      );
    }

    // Map to Song type format
    const songs = playlist.songs.map((ps) => ({
      id: ps.song.id,
      title: ps.song.title,
      titleEn: ps.song.titleEn,
      uri: ps.song.uri ?? "",
      filename: ps.song.filename ?? "",
      index: ps.song.index,
      duration: ps.song.duration,
      coverArt: ps.song.coverArt,
      artist: ps.song.artist,
      album: ps.song.albumName,
      playCount: ps.song.playCount,
      albumId: ps.song.albumId,
      year: ps.song.year?.toString() ?? null,
      links: ps.song.links,
      artists: [],
      addedAt: ps.addedAt.getTime(),
    }));

    return NextResponse.json({ success: true, data: songs });
  } catch (error) {
    console.error("Error fetching playlist songs:", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت آهنگ های پلی لیست!" },
      { status: 500 }
    );
  }
}
