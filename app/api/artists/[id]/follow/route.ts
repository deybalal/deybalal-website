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
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ success: true, isFollowing: false });
    }

    const follow = await prisma.follow.findUnique({
      where: {
        userId_artistId: {
          userId: session.user.id,
          artistId: id,
        },
      },
    });

    return NextResponse.json({ success: true, isFollowing: !!follow });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { success: false, message: "خطایی پیش آمد!" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "ابتدا وارد حساب کاربری شوید." },
        { status: 401 }
      );
    }

    const artistId = id;
    const userId = session.user.id;

    const existingFollow = await prisma.follow.findUnique({
      where: {
        userId_artistId: {
          userId,
          artistId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: {
          id: existingFollow.id,
        },
      });
      return NextResponse.json({ success: true, isFollowing: false });
    } else {
      await prisma.follow.create({
        data: {
          userId,
          artistId,
        },
      });
      return NextResponse.json({ success: true, isFollowing: true });
    }
  } catch (error) {
    console.error("Error toggling follow status:", error);
    return NextResponse.json(
      { success: false, message: "خطایی پیش آمد!" },
      { status: 500 }
    );
  }
}
