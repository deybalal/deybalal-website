import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validate that syncedLyrics is provided
    if (!body.syncedLyrics) {
      return NextResponse.json(
        { success: false, message: "syncedLyrics is required" },
        { status: 400 }
      );
    }

    // Check if song exists
    const existingSong = await prisma.song.findUnique({
      where: { id },
    });

    if (!existingSong) {
      return NextResponse.json(
        { success: false, message: "Song not found" },
        { status: 404 }
      );
    }

    // Update the song's synced lyrics
    const updatedSong = await prisma.song.update({
      where: { id },
      data: {
        syncedLyrics: body.syncedLyrics,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSong,
    });
  } catch (error) {
    console.error("Error updating synced lyrics:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update synced lyrics" },
      { status: 500 }
    );
  }
}
