import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { title, titleEn, duration, artistIds } = await request.json();

    if (!title && !titleEn) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 1. Fetch potential candidates by artists
    // If artistIds are provided, we focus on songs by those artists.
    // Otherwise, we search globally (less efficient but necessary if artist is not yet linked).

    const whereClause: Prisma.SongWhereInput = {
      isActive: true,
    };

    if (artistIds && artistIds.length > 0) {
      whereClause.artists = {
        some: {
          id: { in: artistIds },
        },
      };
    }

    const candidates = await prisma.song.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        titleEn: true,
        duration: true,
        slug: true,
        artists: {
          select: {
            name: true,
          },
        },
      },
      take: 20, // Limit candidates
    });

    // 2. Filter candidates in memory for better fuzzy control or specific logic
    const matches = candidates.filter((song) => {
      const sameTitle =
        (title && song.title.toLowerCase() === title.toLowerCase()) ||
        (titleEn && song.titleEn.toLowerCase() === titleEn.toLowerCase()) ||
        (title && song.titleEn.toLowerCase() === title.toLowerCase()) ||
        (titleEn && song.title.toLowerCase() === titleEn.toLowerCase());

      if (sameTitle) return true;

      // If duration is very close and title is somewhat similar (contains)
      const sameDuration = duration && Math.abs(song.duration - duration) < 5;
      const similarTitle =
        (title && song.title.toLowerCase().includes(title.toLowerCase())) ||
        (titleEn && song.titleEn.toLowerCase().includes(titleEn.toLowerCase()));

      if (sameDuration && similarTitle) return true;

      return false;
    });

    return NextResponse.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    console.error("Error checking for duplicate songs:", error);
    return NextResponse.json(
      { success: false, message: "خطا در بررسی آهنگ های تکراری" },
      { status: 500 }
    );
  }
}
