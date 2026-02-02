import { prisma } from "@/lib/prisma";
import { parseLRC } from "@/tools/parseLyrics";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Count valid songs
    const count = await prisma.song.count({
      where: {
        isActive: true,
        syncedLyrics: {
          not: null,
        },
      },
    });

    if (count === 0) {
      return NextResponse.json(
        { error: "No songs with synced lyrics found" },
        { status: 404 }
      );
    }

    // 2. Random skip
    const skip = Math.floor(Math.random() * count);

    // 3. Fetch random song
    const song = await prisma.song.findFirst({
      where: {
        isActive: true,
        syncedLyrics: {
          not: null,
        },
      },
      skip,
      include: {
        artists: true,
      },
    });

    if (!song || !song.syncedLyrics) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    // 4. Parse extraction
    const parsedLyrics = parseLRC(song.syncedLyrics);
    const snippetLength = 4;

    if (parsedLyrics.length < snippetLength) {
      // If not enough lines, just return what we have
      return NextResponse.json({
        id: song.id,
        title: song.title,
        singer: song.artists[0]?.name || song.artist, // Fallback to string artist if relation empty
        lyrics: parsedLyrics,
      });
    }

    // Get first 4 lines
    const startIndex = 0;
    const snippet = parsedLyrics.slice(startIndex, startIndex + snippetLength);

    return NextResponse.json({
      id: song.id,
      title: song.title,
      singer: song.artists[0]?.name || song.artist,
      lyrics: snippet,
    });
  } catch (error) {
    console.error("Error fetching random synced lyric:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
