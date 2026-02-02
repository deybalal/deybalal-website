import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const songCount = await prisma.song.count({
      where: {
        isActive: true,
      },
    });

    if (songCount === 0) {
      return NextResponse.json({ error: "No songs found" }, { status: 404 });
    }

    const skip = Math.floor(Math.random() * songCount);

    const randomSong = await prisma.song.findFirst({
      where: {
        isActive: true,
      },
      skip: skip,
      select: {
        id: true,
        slug: true,
        title: true,
        titleEn: true,
        artist: true,
        artistEn: true,
        albumName: true,
        coverArt: true,
        year: true,
        duration: true,
        uri: true,
        lyrics: true,
        syncedLyrics: true,
        playCount: true,
        albumId: true,
        links: true,
        artists: {
          select: {
            id: true,
            name: true,
            image: true,
            isVerified: true,
          },
        },
        album: {
          select: {
            id: true,
            name: true,
            coverArt: true,
          },
        },
        genres: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!randomSong) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    return NextResponse.json(randomSong);
  } catch (error) {
    console.error("Error fetching random song:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
