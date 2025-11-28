import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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
    return NextResponse.json({ success: true, data: artists });
  } catch (error) {
    console.error("Error fetching artists:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch artists" },
      { status: 500 }
    );
  }
}
