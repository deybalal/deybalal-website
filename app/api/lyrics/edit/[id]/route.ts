import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { updateContributorPercentages } from "@/lib/contributors";
import { createNotification } from "@/lib/notifications";

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
        { success: false, message: "شما مجاز به انجام این کار نیستید!" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const userRole = (session.user as { role?: string }).role;
    const isAdmin = userRole === "administrator" || userRole === "moderator";

    // Validate that lyrics is provided
    if (!body.lyrics) {
      return NextResponse.json(
        { success: false, message: "وارد کردن متن آهنگ اجباری است!" },
        { status: 400 }
      );
    }

    const { source, sourceUrl } = body;

    // Check if song exists
    const existingSong = await prisma.song.findUnique({
      where: { id },
    });

    if (!existingSong) {
      return NextResponse.json(
        { success: false, message: "آهنگ پیدا نشد!" },
        { status: 404 }
      );
    }

    if (isAdmin) {
      // Update the song's lyrics directly
      await prisma.$transaction(async (tx) => {
        await updateContributorPercentages({
          songId: id,
          userId: session.user.id,
          type: "lyrics",
          newContent: body.lyrics,
          tx,
        });

        await tx.song.update({
          where: { id },
          data: {
            lyrics: body.lyrics,
            lyricsSource: source,
            lyricsSourceUrl: sourceUrl,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "ویرایش متن آهنگ با موفقیت انجام شد!",
      });
    } else {
      // Create a suggestion for regular users
      const suggestion = await prisma.lyricsSuggestion.create({
        data: {
          songId: id,
          userId: session.user.id,
          lyrics: body.lyrics,
          type: "LYRICS",
          status: "PENDING",
          lyricsSource: existingSong.lyricsSource
            ? existingSong.lyricsSource
            : source,
          lyricsSourceUrl: existingSong.lyricsSourceUrl
            ? existingSong.lyricsSourceUrl
            : sourceUrl,
        },
      });

      // Notify the user that their suggestion was received
      await createNotification({
        userId: session.user.id,
        type: "LYRICS_SUBMITTED",
        title: "متن آهنگ ارسال شد!",
        message: `متن آهنگ "${existingSong.title}" ارسال شد و در انتظار تایید توسط مدیریت پلتفرم است!`,
        link: `/song/${id}`,
      });

      return NextResponse.json({
        success: true,
        data: suggestion,
        message: "متن آهنگ ارسال شد و در انتظار تایید توسط مدیریت پلتفرم است!",
      });
    }
  } catch (error) {
    console.error("Error updating Lyrics:", error);
    return NextResponse.json(
      { success: false, message: "خطا در ویرایش متن آهنگ!" },
      { status: 500 }
    );
  }
}
