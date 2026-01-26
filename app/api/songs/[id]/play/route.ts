import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
