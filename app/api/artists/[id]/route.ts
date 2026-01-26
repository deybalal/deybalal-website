import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Decode the ID in case it's passed
    //  as a name (backward compatibility or URL encoding)
    const { id } = await params;

    const idOrName = decodeURIComponent(id);

    // Optimized: Single query instead of two separate queries
    const artist = await prisma.artist.findFirst({
      where: {
        OR: [{ id: idOrName }, { name: idOrName }],
      },
      include: {
        songs: {
          orderBy: { index: "asc" },
        },
        albums: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!artist) {
      return NextResponse.json(
        { success: false, message: "خواننده پیدا نشد!" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: artist });
  } catch {
    return NextResponse.json(
      { success: false, message: "خطا در دریافت مشخصات خواننده!" },
      { status: 500 }
    );
  }
}

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

    // Check if artist exists
    const existingArtist = await prisma.artist.findUnique({
      where: { id },
    });

    if (!existingArtist) {
      return NextResponse.json(
        { success: false, message: "خواننده پیدا نشد!" },
        { status: 404 }
      );
    }

    // Update the artist
    const updatedArtist = await prisma.artist.update({
      where: { id },
      data: {
        name: body.name,
        nameEn: body.nameEn,
        image: body.image,
        isVerified:
          body.isVerified !== undefined
            ? userRole === "moderator" || userRole === "administrator"
              ? body.isVerified
              : existingArtist.isVerified
            : existingArtist.isVerified,
      },
    });

    return NextResponse.json({ success: true, data: updatedArtist });
  } catch (error) {
    console.error("Error updating artist:", error);
    return NextResponse.json(
      { success: false, message: "خطا در ویرایش خواننده" },
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

    if (userRole !== "administrator") {
      return NextResponse.json(
        {
          success: false,
          message: "فقط مدیریت پلتفرم میتواند خواننده ها را حذف کند!",
        },
        { status: 403 }
      );
    }

    await prisma.artist.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "خواننده حذف شد!",
    });
  } catch (error) {
    console.error("Error deleting artist:", error);
    return NextResponse.json(
      { success: false, message: "خطا در حذف خواننده" },
      { status: 500 }
    );
  }
}
