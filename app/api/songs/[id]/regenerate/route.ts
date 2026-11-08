import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { regenerateSong } from "@/lib/song-regenerator";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "ابتدا وارد حساب کاربری خود شوید!" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string })?.role;

    if (userRole !== "administrator") {
      return NextResponse.json(
        { success: false, message: "خطای دسترسی! فقط مدیران مجاز به ساخت مجدد آهنگ هستند." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const result = await regenerateSong(id);

    return NextResponse.json({
      success: true,
      message: "کاور و فایل‌های صوتی آهنگ با موفقیت مجدداً ساخته شدند.",
      data: {
        id: result.song.id,
        slug: result.song.slug,
        title: result.song.title,
        artist: result.song.artist,
        coverArt: result.song.coverArt,
        uri: result.song.uri,
        fingerprintCount: result.fingerprintCount,
      },
    });
  } catch (error: any) {
    console.error("Error regenerating song:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "خطا در ساخت مجدد آهنگ!",
      },
      { status: 500 }
    );
  }
}
