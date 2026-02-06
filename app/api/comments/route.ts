import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

import { sanitizeTextContent } from "@/lib/input-sanitizer";
import { validateContentLength, CONTENT_LENGTH_LIMITS } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get("songId");
    const albumId = searchParams.get("albumId");

    if (!songId && !albumId) {
      return NextResponse.json(
        { success: false, message: "آیدی آهنگ یا آلبوم اجباری است!" },
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
        parentId: null, // Only fetch top-level comments
        isDeleted: false,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        isActive: true,
        user: {
          select: {
            name: true,
            image: true,
            userSlug: true,
            instagramHandle: true,
          },
        },
        replies: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            isActive: true,
            user: {
              select: {
                name: true,
                image: true,
                userSlug: true,
                instagramHandle: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc", // Replies usually ordered oldest to newest
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const filterActive = (cm: {
      isActive: boolean;
      user: { userSlug: string };
    }) => {
      if (!cm.isActive) {
        return cm.user.userSlug === session?.user.userSlug;
      }
      return true;
    };

    const filteredComments = comments.filter(filterActive).map((cm) => ({
      ...cm,
      replies: cm.replies.filter(filterActive),
    }));

    return NextResponse.json({ success: true, data: filteredComments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت نظرات" },
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
        { success: false, message: "ابتدا وارد حساب کاربری شوید." },
        { status: 401 }
      );
    }

    const { content, songId, albumId, parentId } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, message: "متن نظر اجباری است!" },
        { status: 400 }
      );
    }

    // Validate content length
    const lengthValidation = validateContentLength(
      content,
      CONTENT_LENGTH_LIMITS.COMMENT_MAX,
      "نظر"
    );
    if (!lengthValidation.valid) {
      return NextResponse.json(
        { success: false, message: lengthValidation.message },
        { status: 400 }
      );
    }

    // Sanitize content to prevent XSS
    const sanitizedContent = sanitizeTextContent(
      content,
      CONTENT_LENGTH_LIMITS.COMMENT_MAX
    );

    if (!songId && !albumId && !parentId) {
      return NextResponse.json(
        {
          success: false,
          message: "آیدی آهنگ یا آلبوم یا آیدی نظر والد اجباری است!",
        },
        { status: 400 }
      );
    }

    let finalSongId = songId;
    let finalAlbumId = albumId;

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { success: false, message: "نظر والد پیدا نشد!" },
          { status: 404 }
        );
      }

      if (parentComment.parentId) {
        return NextResponse.json(
          { success: false, message: "پاسخ به پاسخ امکان پذیر نیست!" },
          { status: 400 }
        );
      }

      finalSongId = parentComment.songId;
      finalAlbumId = parentComment.albumId;
    }

    const songTitle = await prisma.song.findUnique({
      where: { id: finalSongId ? finalSongId : "noId" },
    });

    const albumTitle = await prisma.album.findUnique({
      where: { id: finalAlbumId ? finalAlbumId : "noId" },
    });

    const postTitle = finalSongId
      ? (songTitle?.title as string)
      : (albumTitle?.name as string);

    const comment = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        userId: session.user.id,
        userSlug: session.user.userSlug,
        songId: finalSongId || null,
        albumId: finalAlbumId || null,
        parentId: parentId || null,
        postTitle,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            userSlug: true,
            instagramHandle: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { success: false, message: "خطا در ذخیره نظر" },
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
        { success: false, message: "ابتدا وارد حساب کاربری شوید." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "آیدی نظر اجباری است!" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "نظر پیدا نشد!" },
        { status: 404 }
      );
    }

    // Only the author or an admin can delete a comment
    if (
      comment.userId !== session.user.id &&
      session.user.role !== "administrator"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "فقط مدیریت پلتفرم یا ارسال کننده ی نظر قادر به حذف نظر هستند!",
        },
        { status: 403 }
      );
    }

    await prisma.comment.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true, message: "نظر حذف شد!" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { success: false, message: "خطا در حذف نظر!" },
      { status: 500 }
    );
  }
}
