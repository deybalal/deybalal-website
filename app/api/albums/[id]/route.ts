import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        songs: {
          orderBy: { index: "asc" },
        },
        artist: true,
      },
    });

    if (!album) {
      return NextResponse.json(
        { success: false, message: "Album not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: album });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to fetch album" },
      { status: 500 }
    );
  }
}
