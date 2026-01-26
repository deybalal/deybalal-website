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

    // Validate that syncedLyrics is provided
    if (!body.syncedLyrics) {
      return NextResponse.json(
        { success: false, message: "خطا! متن آهنگ اجباری است!" },
        { status: 400 }
      );
    }

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
        message: "متن سینک شده ی آهنگ با موفقیت ارسال شد!",
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

      // Notify the user that their suggestion was received
      await createNotification({
        userId: session.user.id,
        type: "LYRICS_SUBMITTED",
        title: "متن  سینک شده ی آهنگ ارسال شد!",
        message: `متن سینک شده ی آهنگ "${existingSong.title}" ارسال شد و در انتظار تایید توسط مدیریت پلتفرم است!`,
        link: `/song/${id}`,
      });

      return NextResponse.json({
        success: true,
        data: suggestion,
        message:
          "متن سینک شده ی آهنگ ارسال شد و در انتظار تایید توسط مدیریت پلتفرم است!",
      });
    }
  } catch (error) {
    console.error("Error updating synced lyrics:", error);
    return NextResponse.json(
      { success: false, message: "خطا در ارسال متن سینک شده ی آهنگ!" },
      { status: 500 }
    );
  }
}
