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

    // Check if song is already in playlist
    const songExists = playlist.songs.some((song) => song.id === songId);
    if (songExists) {
      return NextResponse.json(
        { success: false, message: "این آهنگ از قبل در پلی لیست موجود است!" },
        { status: 400 }
      );
    }

    // Get the song details
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      return NextResponse.json(
        { success: false, message: "Song not found" },
        { status: 404 }
      );
    }

    // Determine new cover art: if playlist has no cover art or no songs, use this song's cover
    // But since we are adding a song, if the playlist currently has no songs, this will be the first one.
    // Or if we want to enforce "cover art of the first song", we should check if the playlist is empty.
    let newCoverArt = playlist.coverArt;
    if (playlist.songs.length === 0 && song.coverArt) {
      newCoverArt = song.coverArt;
    }

    // Calculate new duration
    const newDuration = playlist.duration + (song.duration || 0);

    // Add song to playlist and update metadata
    await prisma.playlist.update({
      where: { id },
      data: {
        songs: {
          connect: { id: songId },
        },
        duration: newDuration,
        coverArt: newCoverArt,
      },
    });

    return NextResponse.json({
      success: true,
      message: "آهنگ به پلی لیست اضافه شد!",
    });
  } catch (error) {
    console.error("Error adding song to playlist:", error);
    return NextResponse.json(
      { success: false, message: "خطا در افزودن آهنگ به پلی لیست!" },
      { status: 500 }
    );
  }
}
