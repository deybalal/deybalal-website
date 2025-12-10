import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Decode the ID in case it's passed as a name (backward compatibility or URL encoding)
    const idOrName = decodeURIComponent(params.id);

    // Optimized: Single query instead of two separate queries
    const artist = await prisma.artist.findFirst({
      where: {
        OR: [{ id: idOrName }, { name: idOrName }],
      },
      include: {
        songs: {
          orderBy: { index: "asc" },
        },
        albums: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!artist) {
      return NextResponse.json(
        { success: false, message: "Artist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: artist });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to fetch artist" },
      { status: 500 }
    );
  }
}
