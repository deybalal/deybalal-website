import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
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

    // Try to find existing favorites playlist
    let favoritesPlaylist = await prisma.playlist.findFirst({
      where: { isFavorite: true },
      include: {
        songs: {
          include: {
            artists: true,
            album: true,
          },
        },
      },
    });

    // If no favorites playlist exists, create one
    if (!favoritesPlaylist) {
      favoritesPlaylist = await prisma.playlist.create({
        data: {
          name: "Favorites",
          description: "Your favorite songs",
          isFavorite: true,
          duration: 0,
        },
        include: {
          songs: {
            include: {
              artists: true,
              album: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: favoritesPlaylist });
  } catch (error) {
    console.error("Failed to fetch favorites playlist", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch favorites playlist" },
      { status: 500 }
    );
  }
}
