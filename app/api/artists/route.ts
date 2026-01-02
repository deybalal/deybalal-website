import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const user = session?.user
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { isUserAnArtist: true, artistId: true },
        })
      : null;

    if (user?.isUserAnArtist && user.artistId) {
      const artist = await prisma.artist.findUnique({
        where: { id: user.artistId },
        select: {
          id: true,
          name: true,
          nameEn: true,
          image: true,
          isVerified: true,
        },
      });
      if (artist) {
        return NextResponse.json({
          success: true,
          data: [artist],
        });
      } else {
        return NextResponse.json({
          success: false,
          message: "Something went wrong! Artist from artistId was not found!",
        });
      }
    }

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
        isVerified: true,
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
