import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createNotification } from "@/lib/notifications";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "ابتدا وارد حساب کاربری شوید." },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role;

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      return NextResponse.json(
        { success: false, message: "نظر پیدا نشد!" },
        { status: 404 }
      );
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        isActive:
          body.isActive !== undefined
            ? userRole === "moderator" || userRole === "administrator"
              ? body.isActive
              : existingComment.isActive
            : existingComment.isActive,
      },
    });

    // Notify the user if their comment was approved
    if (updatedComment.isActive && !existingComment.isActive) {
      await createNotification({
        userId: existingComment.userId,
        type: "COMMENT_APPROVED",
        title: "نظر تایید شد!",
        message: `نظر شما برای "${existingComment.postTitle}" تایید شد!`,
        link: existingComment.songId
          ? `/song/${existingComment.songId}`
          : `/album/${existingComment.albumId}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `نظر ${updatedComment.isActive ? "رد" : "منتشر"} شد!`,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { success: false, message: "خطا در ویرایش نظر" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "ابتدا وارد حساب کاربری شوید." },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role;

    const findComment = await prisma.comment.findUnique({
      where: { id },
    });

    if (
      userRole !== "administrator" &&
      userRole !== "moderator" &&
      findComment?.userSlug !== session.user.userSlug
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "شما اجازه حذف این نظر را ندارید!",
        },
        { status: 403 }
      );
    }

    await prisma.comment.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "نظر حذف شد!",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { success: false, message: "خطا در حذف نظر!" },
      { status: 500 }
    );
  }
}
