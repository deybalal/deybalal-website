import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
        { success: false, message: "Unauthorized" },
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
        { success: false, message: "Comment not found" },
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

    return NextResponse.json({
      success: true,
      message: `Comment ${
        updatedComment.isActive ? "unverified" : "verified"
      } successfully`,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update comment" },
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
        { success: false, message: "Unauthorized" },
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
          message: "You are not authorized to delete this comment!",
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
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
