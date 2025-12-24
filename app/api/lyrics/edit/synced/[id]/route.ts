import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { updateContributorPercentages } from "@/lib/contributors";

export const dynamic = "force-dynamic";

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

    const body = await request.json();
    const userRole = (session.user as { role?: string }).role;
    const isAdmin = userRole === "administrator" || userRole === "moderator";

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

    if (isAdmin) {
      // Update the song's synced lyrics directly
      await prisma.$transaction(async (tx) => {
        await updateContributorPercentages({
          songId: id,
          userId: session.user.id,
          type: "sync",
          newContent: body.syncedLyrics,
          tx,
        });

        await tx.song.update({
          where: { id },
          data: {
            syncedLyrics: body.syncedLyrics,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Synced lyrics updated successfully",
      });
    } else {
      // Create a suggestion for regular users
      const suggestion = await prisma.lyricsSuggestion.create({
        data: {
          songId: id,
          userId: session.user.id,
          syncedLyrics: body.syncedLyrics,
          type: "SYNCED",
          status: "PENDING",
        },
      });

      return NextResponse.json({
        success: true,
        data: suggestion,
        message: "Synced lyrics suggestion submitted for review",
      });
    }
  } catch (error) {
    console.error("Error updating synced lyrics:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update synced lyrics" },
      { status: 500 }
    );
  }
}
