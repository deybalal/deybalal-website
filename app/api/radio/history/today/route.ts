import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAssetUrl, resolveSongLinks } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const playlistData = await prisma.radioPlaylist.findFirst({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        tracks: {
          orderBy: { order: "asc" },
          include: {
            song: {
              include: {
                artists: true,
              },
            },
          },
        },
      },
    });

    if (!playlistData) {
      return NextResponse.json(
        { success: false, message: "پلی لیست پیدا نشد" },
        { status: 404 }
      );
    }

    const now = new Date();
    const elapsedTime = Math.floor(
      (now.getTime() - playlistData.startTime.getTime()) / 1000
    );

    const filteredTracks = playlistData.tracks.filter(
      (t) => t.startOffset <= elapsedTime
    );

    return NextResponse.json({
      success: true,
      data: {
        ...playlistData,
        tracks: filteredTracks.map((t) => ({
          ...t,
          song: {
            ...t.song,
            coverArt: getAssetUrl(t.song.coverArt),
            uri: getAssetUrl(t.song.uri),
            artists: t.song.artists.map((a) => ({
              ...a,
              image: getAssetUrl(a.image),
            })),
            links: resolveSongLinks(t.song.links as any),
          },
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching today playlist:", error);
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
}
