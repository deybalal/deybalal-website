import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const user = session?.user
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { isUserAnArtist: true, artistId: true },
        })
      : null;

    const where: Prisma.AlbumWhereInput = { isActive: true };
    if (user?.isUserAnArtist && user.artistId) {
      where.artistId = user.artistId;
    }

    const albums = await prisma.album.findMany({
      where,
      include: { songs: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: albums });
  } catch (error) {
    console.error((error as Error).message);
    return NextResponse.json(
      { success: false, message: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const user = session?.user
      ? await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { isUserAnArtist: true, artistId: true },
        })
      : null;

    const where: Prisma.AlbumWhereInput = { isActive: true };
    if (user?.isUserAnArtist && user.artistId) {
      where.artistId = user.artistId;
    }

    const albums = await prisma.album.findMany({
      where,
      include: { songs: true },
      orderBy: { createdAt: "desc" },
    });

    if (!albums) {
      return NextResponse.json(
        { success: false, message: "No albums exist yet!" },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: true, data: albums });
  } catch (error) {
    console.error((error as Error).message);
    return NextResponse.json(
      { success: false, message: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}
