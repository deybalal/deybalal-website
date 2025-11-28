import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const albums = await prisma.album.findMany({
      include: { songs: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: albums });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const albums = await prisma.album.findMany({
      include: { songs: true },
      orderBy: { createdAt: "desc" },
    });

    if (!albums) {
      return NextResponse.json(
        { success: false, message: "No albums exist yet!" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, data: albums });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}
