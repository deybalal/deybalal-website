import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
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
    const { songId, lyrics, syncedLyrics } = body;

    if (!songId) {
      return NextResponse.json(
        { success: false, message: "Song ID is required" },
        { status: 400 }
      );
    }

    const suggestion = await prisma.lyricsSuggestion.create({
      data: {
        songId,
        userId: session.user.id,
        lyrics,
        syncedLyrics,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: suggestion });
  } catch (error) {
    console.error("Error submitting lyrics suggestion:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit suggestion" },
      { status: 500 }
    );
  }
}
