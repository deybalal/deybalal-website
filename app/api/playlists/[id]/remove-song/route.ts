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
      include: { 
        songs: { 
          include: { song: true },
          orderBy: { addedAt: "asc" } // To correctly identify the first song for cover art
        } 
      },
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
    const psIndex = playlist.songs.findIndex((ps) => ps.songId === songId);
    if (psIndex === -1) {
      return NextResponse.json(
        { success: false, message: "این آهنگ در پلی لیست نیست!" },
        { status: 400 }
      );
    }

    const playlistSongToRemove = playlist.songs[psIndex];

    // Calculate new duration
    const newDuration = Math.max(
      0,
      playlist.duration - (playlistSongToRemove.song.duration || 0)
    );

    // Determine new cover art
    let newCoverArt = playlist.coverArt;

    const remainingSongs = playlist.songs.filter((ps) => ps.songId !== songId);

    if (remainingSongs.length === 0) {
      newCoverArt = null;
    } else if (playlist.songs[0].songId === songId) {
      // We removed the first song, so take the new first song's cover
      newCoverArt = remainingSongs[0].song.coverArt;
    }

    // Remove song from playlist and update metadata
    await prisma.playlist.update({
      where: { id },
      data: {
        songs: {
          delete: {
            playlistId_songId: {
              playlistId: id,
              songId: songId,
            },
          },
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
