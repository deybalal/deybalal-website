import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache } from "@/lib/cache";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, nameEn, image } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Artist name is required" },
        { status: 400 }
      );
    }

    const existingArtist = await prisma.artist.findUnique({
      where: { name },
    });

    if (existingArtist) {
      return NextResponse.json(
        { success: false, message: "Artist already exists" },
        { status: 400 }
      );
    }

    const artist = await prisma.artist.create({
      data: {
        name,
        nameEn,
        image,
      },
    });

    // Invalidate artists cache
    cache.invalidate("artists:");

    return NextResponse.json({ success: true, data: artist });
  } catch (error) {
    console.error("Error creating artist:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create artist" },
      { status: 500 }
    );
  }
}
