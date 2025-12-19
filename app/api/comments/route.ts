import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get("songId");
    const albumId = searchParams.get("albumId");

    if (!songId && !albumId) {
      return NextResponse.json(
        { success: false, message: "songId or albumId is required" },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const comments = await prisma.comment.findMany({
      where: {
        songId: songId || undefined,
        albumId: albumId || undefined,
        isDeleted: false,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        isActive: true,
        userId: false,
        user: {
          select: {
            name: true,
            image: true,
            userSlug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const filteredComments = comments.filter((cm) => {
      if (!cm.isActive) {
        if (cm.user.userSlug === session?.user.userSlug) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    });

    return NextResponse.json({ success: true, data: filteredComments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const { content, songId, albumId } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, message: "Content is required" },
        { status: 400 }
      );
    }

    if (!songId && !albumId) {
      return NextResponse.json(
        { success: false, message: "songId or albumId is required" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: session.user.id,
        userSlug: session.user.userSlug,
        songId: songId || null,
        albumId: albumId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            userSlug: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Comment ID is required" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "Comment not found" },
        { status: 404 }
      );
    }

    // Only the author or an admin can delete a comment
    if (
      comment.userId !== session.user.id &&
      session.user.role !== "administrator"
    ) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    await prisma.comment.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
