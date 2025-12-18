import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  noStore();
  try {
    const { id } = await context.params;

    const song = await prisma.song.findUnique({
      where: { id },
      include: { artists: true },
    });

    if (!song) {
      return NextResponse.json(
        { success: false, message: "Song not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: song });
  } catch (error) {
    console.error("Error fetching song:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch song" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role;

    // Check if song exists
    const existingSong = await prisma.song.findUnique({
      where: { id },
      include: { artists: true },
    });

    if (!existingSong) {
      return NextResponse.json(
        { success: false, message: "Song not found" },
        { status: 404 }
      );
    }

    // Update the song
    const updatedSong = await prisma.song.update({
      where: { id },
      data: {
        title: body.title,
        titleEn: body.titleEn ?? existingSong.titleEn ?? null,
        artist: body.artist,
        artistEn: body.artistEn ?? existingSong.artistEn ?? null,
        artists: {
          set: [], // Disconnect all existing
          connect: body.artistIds?.map((id: string) => ({ id })) || [], // Connect new ones
        },
        albumId:
          (body.albumId ? body.albumId : null) ?? existingSong.albumId ?? null,
        albumName: body.albumName ?? existingSong.albumName ?? null,
        coverArt: body.coverArt ?? existingSong.coverArt ?? null,
        year: body.year ?? existingSong.year ?? null,
        duration: body.duration ?? existingSong.duration ?? null,
        lyrics: body.lyrics ?? existingSong.lyrics ?? null,
        syncedLyrics: body.syncedLyrics ?? existingSong.syncedLyrics ?? null,
        isActive:
          body.isActive !== undefined
            ? userRole === "moderator" || userRole === "administrator"
              ? body.isActive
              : existingSong.isActive
            : existingSong.isActive,
      },
    });

    return NextResponse.json({ success: true, data: updatedSong });
  } catch (error) {
    console.error("Error updating song:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update song" },
      { status: 500 }
    );
  }
}
