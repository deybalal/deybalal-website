import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  noStore();
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "ابتدا وارد حساب کاربری شوید.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pageSize")) || 20;

    // Try to find existing favorites playlist for this user
    let favoritesPlaylist = await prisma.playlist.findFirst({
      where: {
        isFavorite: true,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { songs: { where: { isActive: true } } },
        },
        songs: {
          where: { isActive: true },
          include: {
            artists: true,
            album: true,
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
        },
      },
    });

    // If no favorites playlist exists, create one
    if (!favoritesPlaylist) {
      favoritesPlaylist = await prisma.playlist.create({
        data: {
          name: "Favorites",
          description: "Your favorite songs",
          isFavorite: true,
          duration: 0,
          userId: session.user.id,
        },
        include: {
          _count: {
            select: { songs: { where: { isActive: true } } },
          },
          songs: {
            where: { isActive: true },
            include: {
              artists: true,
              album: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: favoritesPlaylist });
  } catch (error) {
    console.error("Failed to fetch favorites playlist", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت لیست علاقه مندی ها" },
      { status: 500 }
    );
  }
}
