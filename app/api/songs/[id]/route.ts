import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  noStore();
  try {
    const { id } = await context.params;

    const song = await prisma.song.findUnique({
      where: { id },
    });

    if (!song) {
      return NextResponse.json(
        { success: false, message: "Song not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: song });
  } catch (error) {
    console.error("Error fetching song:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch song" },
      { status: 500 }
    );
  }
}
