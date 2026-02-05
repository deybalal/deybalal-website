import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  noStore();
  try {
    const { id } = await context.params;

    const song = await prisma.song.findUnique({
      where: { id },
      include: { artists: true, crew: true, genres: true },
    });

    if (!song) {
      return NextResponse.json(
        { success: false, message: "آهنگ پیدا نشد!" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: song });
  } catch (error) {
    console.error("Error fetching song:", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت آهنگ!" },
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
        { success: false, message: "شما مجاز به انجام این کار نیستید!" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role;

    if (userRole !== "administrator" && userRole !== "moderator") {
      return NextResponse.json(
        { success: false, message: "خطای دسترسی! فقط مدیران میتوانند!." },
        { status: 401 }
      );
    }
    // Check if song exists
    const existingSong = await prisma.song.findUnique({
      where: { id },
      include: { artists: true, crew: true },
    });

    if (!existingSong) {
      return NextResponse.json(
        { success: false, message: "آهنگ پیدا نشد!" },
        { status: 404 }
      );
    }

    // Fetch artistEn from database if artistIds are provided but artistEn is not
    let artistEn = body.artistEn;
    if (artistEn === undefined && body.artistIds && body.artistIds.length > 0) {
      const artists = await prisma.artist.findMany({
        where: { id: { in: body.artistIds } },
        select: { nameEn: true },
      });
      artistEn = artists
        .map((a) => a.nameEn)
        .filter(Boolean)
        .join(", ");
    }

    // Update the song
    const updatedSong = await prisma.song.update({
      where: { id },
      data: {
        title: body.title,
        titleEn: body.titleEn ?? existingSong.titleEn ?? null,
        artist: body.artist,
        artistEn: artistEn ?? existingSong.artistEn ?? null,
        ...(body.artistIds && {
          artists: {
            set: [], // Disconnect all existing
            connect: body.artistIds?.map((id: string) => ({ id })) || [], // Connect new ones
          },
        }),
        ...(body.albumId && {
          albumId:
            (body.albumId ? body.albumId : null) ??
            existingSong.albumId ??
            null,
        }),
        ...(body.albumName && {
          albumName: body.albumName ?? existingSong.albumName ?? null,
        }),
        ...(body.coverArt && {
          coverArt: body.coverArt ?? existingSong.coverArt ?? null,
        }),
        ...(body.useArtistImage &&
          (body.artistIds || existingSong.artists.length > 0) && {
            coverArt: await (async () => {
              const artistId =
                body.artistIds?.[0] || existingSong.artists[0].id;
              const artist = await prisma.artist.findUnique({
                where: { id: artistId },
                select: { image: true },
              });
              return artist?.image || "/images/cover.png";
            })(),
          }),
        ...(body.year && {
          year: body.year ?? existingSong.year ?? null,
        }),
        ...(body.duration && {
          duration: body.duration ?? existingSong.duration ?? null,
        }),
        ...(body.lyrics && {
          lyrics: body.lyrics ?? existingSong.lyrics ?? null,
        }),
        ...(body.syncedLyrics && {
          syncedLyrics: body.syncedLyrics ?? existingSong.syncedLyrics ?? null,
        }),
        isActive:
          body.isActive !== undefined
            ? userRole === "moderator" || userRole === "administrator"
              ? body.isActive
              : existingSong.isActive
            : existingSong.isActive,
        isFeatured:
          body.isFeatured !== undefined
            ? userRole === "administrator"
              ? body.isFeatured
              : existingSong.isFeatured
            : existingSong.isFeatured,
        ...(body.crew && {
          crew: {
            deleteMany: {},
            create: body.crew,
          },
        }),
        ...(body.genreIds && {
          genres: {
            set: [],
            connect: body.genreIds.map((id: string) => ({ id })),
          },
        }),
      },
    });

    // Handle rejection notification (if isDisabled is set to true)
    if (
      (userRole === "moderator" || userRole === "administrator") &&
      body.isDisabled === true &&
      !existingSong.isDisabled
    ) {
      await createNotification({
        userId: existingSong.userId,
        type: "SONG_REJECTED",
        title: "آهنگ رد شد",
        message: `آهنگ ارسالی شما "${updatedSong.title}" به دلیل زیر رد شد: ${
          body.disabledDescription || "دلیلی ذکر نشده است."
        }`,
        link: `/panel/songs`,
      });
    }

    return NextResponse.json({ success: true, data: updatedSong });
  } catch (error) {
    console.error("Error updating song:", error);
    return NextResponse.json(
      { success: false, message: "خطا در بروزرسانی آهنگ!" },
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
        { success: false, message: "شما مجاز به انجام این کار نیستید!" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role;

    if (userRole !== "administrator" && userRole !== "moderator") {
      return NextResponse.json(
        { success: false, message: "خطای دسترسی! فقط مدیران میتوانند!." },
        { status: 401 }
      );
    }

    const song = await prisma.song.findUnique({
      where: { id },
    });

    if (!song) {
      return NextResponse.json(
        { success: false, message: "آهنگ پیدا نشد!" },
        { status: 404 }
      );
    }

    if (userRole === "administrator") {
      await prisma.song.delete({
        where: { id },
      });

      const songLinks = Object.values(song.links || {}).map((item) => item.url);

      if (song.coverArt) {
        if (!song.coverArt.includes("cover.png")) {
          songLinks.push(song.coverArt);
        }
      }

      if (song.ogg) {
        songLinks.push(song.ogg);
      }

      for (const link of songLinks) {
        const filePath = path.join(process.cwd(), "public", link);
        if (existsSync(filePath)) {
          console.log("Deleting file: ", filePath);

          await unlink(filePath);
        }
      }
    } else {
      // Delete the song from database
      await prisma.song.update({
        where: { id },
        data: {
          isDisabled: true,
          disabledDescription: "آهنگ حذف شد",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "آهنگ با موفقیت حذف شد.",
    });
  } catch (error) {
    console.error("Error deleting song:", error);
    return NextResponse.json(
      { success: false, message: "خطا در حذف آهنگ!" },
      { status: 500 }
    );
  }
}
