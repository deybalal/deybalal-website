import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  noStore();
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const [songs, total] = await Promise.all([
      prisma.song.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          titleEn: true,
          artist: true,
          artistEn: true,
          coverArt: true,
          duration: true,
          year: true,
          playCount: true,
          isDisabled: true,
        },
      }),
      prisma.song.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: songs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "خطا در دریافت آهنگ ها" },
      { status: 500 }
    );
  }
}
