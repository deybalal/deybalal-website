import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Decode the ID in case it's passed as a name (backward compatibility or URL encoding)
    const idOrName = decodeURIComponent(params.id);

    // Try to find by ID first, then by Name
    let artist = await prisma.artist.findUnique({
      where: { id: idOrName },
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
      artist = await prisma.artist.findUnique({
        where: { name: idOrName },
        include: {
          songs: {
            orderBy: { index: "asc" },
          },
          albums: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }

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
