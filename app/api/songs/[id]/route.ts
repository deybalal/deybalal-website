import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { rename } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createNotification, notifyFollowers } from "@/lib/notifications";

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
        { success: false, message: "Song not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: song });
  } catch (error) {
    console.error("Error fetching song:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch song" },
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

    if (userRole !== "administrator" && userRole !== "moderator") {
      return NextResponse.json(
        { success: false, message: "Unauthorized! Only admins can do that." },
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
        { success: false, message: "Song not found" },
        { status: 404 }
      );
    }

    // Update the song
    const updatedSong = await prisma.song.update({
      where: { id },
      data: {
        title: body.title,
        titleEn: body.titleEn ?? existingSong.titleEn ?? null,
        artist: body.artist,
        artistEn: body.artistEn ?? existingSong.artistEn ?? null,
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

    // Handle notifications and file renaming if song is being activated
    if (
      (userRole === "moderator" || userRole === "administrator") &&
      body.isActive === true &&
      !existingSong.isActive
    ) {
      // 1. Notify the user who submitted the song
      await createNotification({
        userId: existingSong.userId,
        type: "SONG_APPROVED",
        title: "Song Approved!",
        message: `Your song "${updatedSong.title}" has been approved and is now live.`,
        link: `/song/${updatedSong.id}`,
      });

      // 2. Notify followers of each artist
      const artistIds = body.artistIds || existingSong.artists.map((a) => a.id);
      if (artistIds && artistIds.length > 0) {
        for (const artistId of artistIds) {
          await notifyFollowers({
            artistId,
            type: "NEW_RELEASE",
            title: "New Music Released!",
            message: `${updatedSong.artist} just released a new song: ${updatedSong.title}`,
            link: `/song/${updatedSong.id}`,
          });
        }
      }

      // 3. Handle file renaming if it's a temp file
      if (existingSong.filename?.startsWith("temp_")) {
        try {
          const uploadDir = path.join(process.cwd(), "public/assets/mp3");
          const oldPath = path.join(uploadDir, existingSong.filename);

          if (existsSync(oldPath)) {
            // Generate proper filename: singer-songName.mp3
            const artistName = (
              updatedSong.artistEn ||
              updatedSong.artist ||
              "artist"
            )
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-")
              .replace(/-+/g, "-");
            const songName = (
              updatedSong.titleEn ||
              updatedSong.title ||
              "song"
            )
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-")
              .replace(/-+/g, "-");

            const baseFilename = `${artistName}-${songName}`;
            let newFilename = `${baseFilename}.mp3`;
            let newPath = path.join(uploadDir, newFilename);
            let counter = 1;

            while (existsSync(newPath)) {
              newFilename = `${baseFilename}${counter}.mp3`;
              newPath = path.join(uploadDir, newFilename);
              counter++;
            }

            await rename(oldPath, newPath);

            // Update the song record with the new filename and uri
            await prisma.song.update({
              where: { id },
              data: {
                filename: newFilename,
                uri: `/assets/mp3/${newFilename}`,
              },
            });
          }
        } catch (err) {
          console.error("Failed to rename file on approval:", err);
        }
      }
    }

    // Handle rejection notification (if isDisabled is set to true)
    if (
      (userRole === "moderator" || userRole === "administrator") &&
      body.isDisabled === true &&
      !existingSong.isDisabled
    ) {
      await createNotification({
        userId: existingSong.userId,
        type: "SONG_REJECTED",
        title: "Song Submission Update",
        message: `Your song submission "${
          updatedSong.title
        }" was not approved. ${
          body.disabledDescription ? `Reason: ${body.disabledDescription}` : ""
        }`,
      });
    }

    return NextResponse.json({ success: true, data: updatedSong });
  } catch (error) {
    console.error("Error updating song:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update song" },
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
        { success: false, message: "Only administrators can delete songs" },
        { status: 403 }
      );
    }

    await prisma.song.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Song deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting song:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete song" },
      { status: 500 }
    );
  }
}
