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
    const userSlug = id;

    if (!userSlug) {
      return NextResponse.json(
        { success: false, message: "یوزر کاربر نامعتبر است!" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: { userSlug },
      select: {
        id: true,
        name: true,
        image: true,
        isPrivate: true,
        userSlug: true,
        playlists: {
          where: {
            isPrivate: false,
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
        { success: false, message: "کاربر پیدا نشد!" },
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
          { success: false, message: "این حساب، خصوصی است!" },
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
      { success: false, message: "خطا در دریافت پروفایل کاربر!" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "شما مجاز به انجام این کار نیستید!" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role;

    if (userRole !== "administrator") {
      return NextResponse.json(
        {
          success: false,
          message: "فقط مدیریت پلتفرم میتواند کاربران را مدیریت کند!",
        },
        { status: 403 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "کاربر پیدا نشد!" },
        { status: 404 }
      );
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: body.role,
        isBanned: body.isBanned,
        isVerified: body.isVerified,
        isUserAnArtist: body.isUserAnArtist,
        artistId: body.artistId,
      },
    });

    if (body.isBanned) {
      await prisma.session.deleteMany({
        where: {
          userId: id,
        },
      });
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, message: "خطا در ویرایش کاربر" },
      { status: 500 }
    );
  }
}
