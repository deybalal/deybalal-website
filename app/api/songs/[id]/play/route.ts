import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unpackAndVerifyHash } from "@/lib/hash";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { hash } = body;

    const url = `/api/songs/${id}/play`;
    const { isValid, timestamp, userTimeInfo } = await unpackAndVerifyHash(
      hash,
      url
    );

    console.log("isValid", isValid);
    console.log("timestamp", timestamp);
    console.log("userTimeInfo", userTimeInfo);

    if (!isValid) {
      console.warn(
        `[API] Invalid or expired hash for song play request: ${id}`,
        { timestamp, userTimeInfo }
      );
      return NextResponse.json(
        { success: false, message: "درخواست نامعتبر است" },
        { status: 403 }
      );
    }

    await prisma.song.update({
      where: { id },
      data: {
        playCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error incrementing play count:", error);
    return NextResponse.json(
      { success: false, message: "خطا در افزایش میزان پخش آهنگ" },
      { status: 500 }
    );
  }
}
