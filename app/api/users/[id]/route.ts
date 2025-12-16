import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userIndex = parseInt(id);

    if (isNaN(userIndex)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: { userIndex },
      select: {
        id: true,
        name: true,
        image: true,
        isPrivate: true,
        userIndex: true,
        playlists: {
          where: {
            isFavorite: false,
          },
          select: {
            id: true,
            name: true,
            coverArt: true,
            description: true,
            _count: {
              select: { songs: true },
            },
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check privacy
    if (targetUser.isPrivate) {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      // Allow if it's the user themselves
      if (session?.user?.id !== targetUser.id) {
        return NextResponse.json(
          { success: false, message: "This profile is private" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: targetUser,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
