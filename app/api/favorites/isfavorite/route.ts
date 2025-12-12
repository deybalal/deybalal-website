import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  noStore();
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "You should Login first!",
        },
        { status: 401 }
      );
    }

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
