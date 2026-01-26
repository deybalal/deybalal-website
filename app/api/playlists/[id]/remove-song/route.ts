import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json(
        { success: false, message: "وارد کردن آیدی آهنگ اجباری است!" },
        { status: 400 }
      );
    }

    // Check if playlist exists
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: { songs: true },
    });

    if (!playlist) {
      return NextResponse.json(
        { success: false, message: "پلی لیست پیدا نشد!" },
        { status: 404 }
      );
    }

    // Check if user owns the playlist
    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "شما مجاز به انجام این کار نیستید!" },
        { status: 403 }
      );
    }

    // Check if song is in playlist
    const songIndex = playlist.songs.findIndex((song) => song.id === songId);
    if (songIndex === -1) {
      return NextResponse.json(
        { success: false, message: "این آهنگ در پلی لیست نیست!" },
        { status: 400 }
      );
    }

    const songToRemove = playlist.songs[songIndex];

    // Calculate new duration
    const newDuration = Math.max(
      0,
      playlist.duration - (songToRemove.duration || 0)
    );

    // Determine new cover art
    let newCoverArt = playlist.coverArt;

    // If we are removing the song that provided the cover art (or if we just want to reset it)
    // The logic "cover art of the first song" implies we should check the NEW first song.
    // If the removed song was the first one, we need the next one.
    // If the playlist becomes empty, cover art is null.

    const remainingSongs = playlist.songs.filter((s) => s.id !== songId);

    if (remainingSongs.length === 0) {
      newCoverArt = null;
    } else if (playlist.songs[0].id === songId) {
      // We removed the first song, so take the new first song's cover
      newCoverArt = remainingSongs[0].coverArt;
    }
    // If we removed a song that wasn't the first one, the cover art stays the same (as it comes from the first song).

    // Remove song from playlist and update metadata
    await prisma.playlist.update({
      where: { id },
      data: {
        songs: {
          disconnect: { id: songId },
        },
        duration: newDuration,
        coverArt: newCoverArt,
      },
    });

    return NextResponse.json({
      success: true,
      message: "آهنگ از پلی لیست حذف شد!",
    });
  } catch (error) {
    console.error("Error removing song from playlist:", error);
    return NextResponse.json(
      { success: false, message: "خطا در حذف کردن آهنگ از پلی لیست!" },
      { status: 500 }
    );
  }
}
