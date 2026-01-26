import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const { id } = await params;

    const playlist = await prisma.playlist.findUnique({
      where: { id, userId: session?.user.id },
      include: {
        songs: {
          include: {
            artists: true,
            album: true,
          },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        {
          success: false,
          message: "پلی لیست پیدا نشد! یا مجاز به مشاهده نیستید!",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: playlist });
  } catch (error) {
    console.error("Failed to fetch playlist", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت پلی لیست!" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if playlist exists
    const playlist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      return NextResponse.json(
        { success: false, message: "پلی لیست پیدا نشد!" },
        { status: 404 }
      );
    }

    // Check if user owns the playlist
    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "شما مجاز به انجام این کار نیستید!" },
        { status: 403 }
      );
    }

    // Delete the playlist
    await prisma.playlist.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "پلی لیست حذف شد!",
    });
  } catch (error) {
    console.error("Error deleting playlist:", error);
    return NextResponse.json(
      { success: false, message: "خطا در حذف پلی لیست!" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { isPrivate } = body;

    // Check if playlist exists
    const playlist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      return NextResponse.json(
        { success: false, message: "پلی لیست پیدا نشد!" },
        { status: 404 }
      );
    }

    // Check if user owns the playlist
    if (playlist.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "شما مجاز به انجام این کار نیستید!" },
        { status: 403 }
      );
    }

    // Update the playlist
    const updatedPlaylist = await prisma.playlist.update({
      where: { id },
      data: {
        isPrivate,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPlaylist,
      message: "پلی لیست آپدیت شد!",
    });
  } catch (error) {
    console.error("Error updating playlist:", error);
    return NextResponse.json(
      { success: false, message: "خطا در آپدیت پلی لیست!" },
      { status: 500 }
    );
  }
}
