import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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
    if (userRole !== "administrator" && userRole !== "moderator") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body; // 'APPROVED' or 'REJECTED'

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const suggestion = await prisma.lyricsSuggestion.findUnique({
      where: { id },
      include: { song: true },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, message: "Suggestion not found" },
        { status: 404 }
      );
    }

    if (status === "APPROVED") {
      // Update the song with new lyrics based on type
      const updateData: Prisma.SongUpdateInput = {};
      if (suggestion.type === "LYRICS") {
        updateData.lyrics = suggestion.lyrics;
      } else if (suggestion.type === "SYNCED") {
        updateData.syncedLyrics = suggestion.syncedLyrics;
      }

      await prisma.song.update({
        where: { id: suggestion.songId },
        data: updateData,
      });
    }

    const updatedSuggestion = await prisma.lyricsSuggestion.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updatedSuggestion });
  } catch (error) {
    console.error("Error moderating lyrics suggestion:", error);
    return NextResponse.json(
      { success: false, message: "Failed to moderate suggestion" },
      { status: 500 }
    );
  }
}
