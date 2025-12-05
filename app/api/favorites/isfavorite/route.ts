import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  noStore();
  try {
    const data = await request.json();
    const { songId } = data;
    const findSong = await prisma.playlist.findFirst({
      where: {
        isFavorite: true,
        songs: {
          some: {
            id: songId,
          },
        },
      }, // TODO: check for matching userId
    });

    if (!findSong) {
      return NextResponse.json({ success: true, isFavorite: false });
    }

    return NextResponse.json({ success: true, isFavorite: true });
  } catch (error) {
    console.error("Failed to fetch favorites playlist", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch favorites playlist" },
      { status: 500 }
    );
  }
}
