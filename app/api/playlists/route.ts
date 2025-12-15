import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  noStore();
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          songs: {
            select: {
              id: true,
              title: true,
              coverArt: true,
              duration: true,
              artist: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.playlist.count({
        where: {
          userId: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: playlists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}
