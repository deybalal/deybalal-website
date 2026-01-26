import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { updateContributorPercentages } from "@/lib/contributors";
import { createNotification } from "@/lib/notifications";

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
        { success: false, message: "شما مجاز به انجام این کار نیستید!" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "administrator" && userRole !== "moderator") {
      return NextResponse.json(
        { success: false, message: "شما مجاز به انجام این کار نیستید!" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = body; // 'APPROVED' or 'REJECTED'

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "وضعیت نامعتبر" },
        { status: 400 }
      );
    }

    const suggestion = await prisma.lyricsSuggestion.findUnique({
      where: { id },
      include: { song: true },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, message: "ویرایش پیشنهادی پیدا نشد!" },
        { status: 404 }
      );
    }

    if (status === "APPROVED") {
      // Update the song with new lyrics based on type
      const updateData: Prisma.SongUpdateInput = {};

      if (suggestion.type === "LYRICS") {
        updateData.lyrics = suggestion.lyrics;
        updateData.lyricsSource = suggestion.lyricsSource;
        updateData.lyricsSourceUrl = suggestion.lyricsSourceUrl;
      } else if (suggestion.type === "SYNCED") {
        updateData.syncedLyrics = suggestion.syncedLyrics;
      }

      await prisma.$transaction(async (tx) => {
        // Handle contributors using the new utility (MUST BE CALLED BEFORE SONG UPDATE)
        await updateContributorPercentages({
          songId: suggestion.songId,
          userId: suggestion.userId,
          type: suggestion.type === "LYRICS" ? "lyrics" : "sync",
          newContent:
            (suggestion.type === "LYRICS"
              ? suggestion.lyrics
              : suggestion.syncedLyrics) || "",
          tx,
        });

        // Update song lyrics
        await tx.song.update({
          where: { id: suggestion.songId },
          data: updateData,
        });
      });
    }

    const updatedSuggestion = await prisma.lyricsSuggestion.update({
      where: { id },
      data: { status },
    });

    //         message: `متن سینک شده ی آهنگ "${existingSong.title}" ارسال شد و در انتظار تایید توسط مدیریت پلتفرم است!`,

    // Notify the user about the status update
    await createNotification({
      userId: suggestion.userId,
      type: status === "APPROVED" ? "LYRICS_APPROVED" : "LYRICS_REJECTED",
      title:
        status === "APPROVED" ? "متن آهنگ تایید شد!" : "متن آهنگ تایید نشد!",
      message:
        status === "APPROVED"
          ? `ویرایش پیشنهادی شما برای آهنگ "${suggestion.song.title}" تایید شد!`
          : `ویرایش پیشنهادی شما برای آهنگ "${suggestion.song.title}" تایید نشد!`,
      link: `/song/${suggestion.songId}`,
    });

    return NextResponse.json({ success: true, data: updatedSuggestion });
  } catch (error) {
    console.error("Error moderating lyrics suggestion:", error);
    return NextResponse.json(
      { success: false, message: "خطا در مدیریت متن پیشنهادی آهنگ" },
      { status: 500 }
    );
  }
}
