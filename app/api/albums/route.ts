import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { getAssetUrl, resolveSongLinks } from "@/lib/utils";

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

    const transformedAlbums = albums.map((album) => ({
      ...album,
      coverArt: getAssetUrl(album.coverArt),
      songs: album.songs.map((s) => ({
        ...s,
        coverArt: getAssetUrl(s.coverArt),
        uri: getAssetUrl(s.uri),
        links: resolveSongLinks(s.links as any),
      })),
    }));

    return NextResponse.json({ success: true, data: transformedAlbums });
  } catch (error) {
    console.error((error as Error).message);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت آلبوم ها" },
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
        { success: false, message: "هنوز هیچ آلبومی وجود نداره!" },
        { status: 400 }
      );
    }
    const transformedAlbums = albums.map((album) => ({
      ...album,
      coverArt: getAssetUrl(album.coverArt),
      songs: album.songs.map((s) => ({
        ...s,
        coverArt: getAssetUrl(s.coverArt),
        uri: getAssetUrl(s.uri),
        links: resolveSongLinks(s.links as any),
      })),
    }));

    return NextResponse.json({ success: true, data: transformedAlbums });
  } catch (error) {
    console.error((error as Error).message);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت آلبوم ها" },
      { status: 500 }
    );
  }
}
