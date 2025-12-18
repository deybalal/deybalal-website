import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        songs: {
          orderBy: { index: "asc" },
        },
        artist: true,
      },
    });

    if (!album) {
      return NextResponse.json(
        { success: false, message: "Album not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: album });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to fetch album" },
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
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role;

    // Check if album exists
    const existingAlbum = await prisma.album.findUnique({
      where: { id },
    });

    if (!existingAlbum) {
      return NextResponse.json(
        { success: false, message: "Album not found" },
        { status: 404 }
      );
    }

    // Update the album
    const updatedAlbum = await prisma.album.update({
      where: { id },
      data: {
        name: body.name,
        artistName: body.artistName,
        artistNameEn: body.artistNameEn,
        coverArt: body.coverArt,
        releaseDate: body.releaseDate,
        isActive:
          body.isActive !== undefined
            ? userRole === "moderator" || userRole === "administrator"
              ? body.isActive
              : existingAlbum.isActive
            : existingAlbum.isActive,
        isFeatured:
          body.isFeatured !== undefined
            ? userRole === "administrator"
              ? body.isFeatured
              : existingAlbum.isFeatured
            : existingAlbum.isFeatured,
      },
    });

    return NextResponse.json({ success: true, data: updatedAlbum });
  } catch (error) {
    console.error("Error updating album:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update album" },
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

    if (userRole !== "administrator") {
      return NextResponse.json(
        { success: false, message: "Only administrators can delete albums" },
        { status: 403 }
      );
    }

    await prisma.album.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Album deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting album:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete album" },
      { status: 500 }
    );
  }
}
