import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role;
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = 20;

    const where =
      userRole === "administrator" || userRole === "moderator"
        ? {}
        : { userId: session.user.id };

    const [suggestions, count] = await Promise.all([
      prisma.lyricsSuggestion.findMany({
        where,
        include: {
          song: {
            select: {
              title: true,
              artist: true,
              lyrics: true,
              syncedLyrics: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lyricsSuggestion.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: suggestions,
      count,
    });
  } catch (error) {
    console.error("Error fetching lyrics suggestions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
