import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pass = searchParams.get("pass");

    if (pass !== "12345678") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const songCount = await prisma.song.count({
      where: {
        isFeatured: true,
      },
    });

    if (songCount === 0) {
      return NextResponse.json(
        { error: "No featured songs found" },
        { status: 404 }
      );
    }

    const skip = Math.floor(Math.random() * songCount);

    const randomSong = await prisma.song.findFirst({
      where: {
        isFeatured: true,
      },
      skip: skip,
    });

    if (!randomSong) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    await prisma.songOfTheDay.deleteMany();

    const songOfTheDay = await prisma.songOfTheDay.create({
      data: {
        songId: randomSong.id,
        ts: Math.floor(Date.now() / 1000),
      },
    });

    return NextResponse.json({
      success: true,
      data: songOfTheDay,
    });
  } catch (error) {
    console.error("Error generating song of the day:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
