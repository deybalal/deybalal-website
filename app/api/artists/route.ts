import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";

export async function GET() {
  try {
    const cacheKey = "artists:list";
    const cached = cache.get(cacheKey, 300000); // 5 minutes

    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const artists = await prisma.artist.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        image: true,
      },
    });

    cache.set(cacheKey, artists);

    return NextResponse.json({ success: true, data: artists });
  } catch (error) {
    console.error("Error fetching artists:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch artists" },
      { status: 500 }
    );
  }
}
