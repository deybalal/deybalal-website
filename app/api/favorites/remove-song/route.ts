import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "ابتدا وارد حساب کاربری شوید.",
        },
        { status: 401 }
      );
    }

    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json(
        { success: false, message: "آیدی آهنگ اجباری است!" },
        { status: 400 }
      );
    }

    // Find favorites playlist
    const favoritesPlaylist = await prisma.playlist.findFirst({
      where: { isFavorite: true, userId: session.user.id },
      include: { songs: true },
    });

    if (!favoritesPlaylist) {
      return NextResponse.json(
        { success: false, message: "لیست موردعلاقه ها پیدا نشد!" },
        { status: 404 }
      );
    }

    // Check if song is in favorites
    const song = favoritesPlaylist.songs.find((s) => s.id === songId);
    if (!song) {
      return NextResponse.json(
        {
          success: false,
          message: "این آهنگ در لیست مورد علاقه های شما نیست!",
        },
        { status: 400 }
      );
    }

    // Calculate new duration
    const newDuration = Math.max(
      0,
      favoritesPlaylist.duration - (song.duration || 0)
    );

    // Remove song from favorites and update duration
    await prisma.playlist.update({
      where: { id: favoritesPlaylist.id },
      data: {
        songs: {
          disconnect: { id: songId },
        },
        duration: newDuration,
      },
    });

    return NextResponse.json({
      success: true,
      message: "از لیست علاقه مندی ها حذف شد!",
    });
  } catch (error) {
    console.error("Error removing song from favorites:", error);
    return NextResponse.json(
      { success: false, message: "خطا در حذف از لیست علاقه مندی ها!" },
      { status: 500 }
    );
  }
}
