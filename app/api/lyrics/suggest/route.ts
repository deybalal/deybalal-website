import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "شما مجاز به انجام این کار نیستید!" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { songId, lyrics, syncedLyrics } = body;

    if (!songId) {
      return NextResponse.json(
        { success: false, message: "آیدی آهنگ اجباری است!" },
        { status: 400 }
      );
    }

    const suggestion = await prisma.lyricsSuggestion.create({
      data: {
        songId,
        userId: session.user.id,
        lyrics,
        syncedLyrics,
        type: "LYRICS",
        status: "PENDING",
      },
      include: {
        song: {
          select: {
            title: true,
          },
        },
      },
    });

    // Notify the user that their suggestion was received
    await createNotification({
      userId: session.user.id,
      type: "LYRICS_SUBMITTED",
      title: "متن آهنگ ارسال شد!",
      message: `متن آهنگ "${suggestion.song.title}" ارسال شد و در انتظار تایید توسط مدیریت پلتفرم است!`,
      link: `/song/${songId}`,
    });

    return NextResponse.json({ success: true, data: suggestion });
  } catch (error) {
    console.error("Error submitting lyrics suggestion:", error);
    return NextResponse.json(
      { success: false, message: "خطا در ارسال متن آهنک" },
      { status: 500 }
    );
  }
}
