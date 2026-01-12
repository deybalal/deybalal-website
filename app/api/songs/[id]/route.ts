import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unlink, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createNotification, notifyFollowers } from "@/lib/notifications";
import { exec } from "child_process";
import { promisify } from "util";
import { slugify } from "@/lib/utils";

const execAsync = promisify(exec);

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

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

      // 3. Generate 128 and 320 quality MP3s and cleanup source
      try {
        const uploadDir = path.join(process.cwd(), "public/assets/mp3");
        const uploadDirOgg = path.join(process.cwd(), "public/assets/ogg");
        const sourceFilename = existingSong.filename;

        if (sourceFilename) {
          const sourcePath = path.join(uploadDir, sourceFilename);

          if (existsSync(sourcePath)) {
            // Generate unique base filename
            const artistSlug = slugify(
              updatedSong.artistEn || updatedSong.artist || "artist"
            );
            const titleSlug = slugify(
              updatedSong.titleEn || updatedSong.title || "song"
            );
            const baseFilename = `${artistSlug}-${titleSlug}`;

            let finalBaseName = baseFilename;
            let counter = 1;
            // Ensure the new filenames don't collide with existing ones
            while (
              existsSync(path.join(uploadDir, `${finalBaseName}-128.mp3`)) ||
              existsSync(path.join(uploadDir, `${finalBaseName}-320.mp3`))
            ) {
              finalBaseName = `${baseFilename}${counter}`;
              counter++;
            }

            const filenameOgg = `${updatedSong.id}.ogg`;
            const filename64 = `${finalBaseName}-64.mp3`;
            const filename128 = `${finalBaseName}-128.mp3`;
            const filename320 = `${finalBaseName}-320.mp3`;

            const pathOgg = path.join(uploadDirOgg, filenameOgg);
            const path64 = path.join(uploadDir, filename64);
            const path128 = path.join(uploadDir, filename128);
            const path320 = path.join(uploadDir, filename320);

            const coverPath = updatedSong.coverArt
              ? path.join(process.cwd(), "public", updatedSong.coverArt)
              : null;
            const hasCover = coverPath && existsSync(coverPath);

            const metadataArgs = [
              `-metadata title="${updatedSong.title.replace(/"/g, '\\"')}"`,
              `-metadata artist="${updatedSong.artist.replace(/"/g, '\\"')}"`,
              updatedSong.albumName
                ? `-metadata album="${updatedSong.albumName.replace(
                    /"/g,
                    '\\"'
                  )}"`
                : "",
              updatedSong.year ? `-metadata date="${updatedSong.year}"` : "",
            ]
              .filter(Boolean)
              .join(" ");

            const coverArgs = hasCover
              ? `-i "${coverPath}" -map 0:a -map 1:v -c:v copy -id3v2_version 3 -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (front)"`
              : "-map 0:a";

            const startingPoint =
              (updatedSong.duration / 2 + 30 > updatedSong.duration
                ? 0
                : updatedSong.duration / 2) || 0;

            await execAsync(
              `ffmpeg -i "${sourcePath}" -ss ${startingPoint} -t 30 -c:a libvorbis -b:a 64k "${pathOgg}"`
            );

            // Generate 64kbps
            await execAsync(
              `ffmpeg -i "${sourcePath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -metadata comment="${process.env.BETTER_AUTH_URL}" -b:a 64k -y "${path64}"`
            );

            // Generate 128kbps
            await execAsync(
              `ffmpeg -i "${sourcePath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -metadata comment="${process.env.BETTER_AUTH_URL}" -b:a 128k -y "${path128}"`
            );

            // Generate 320kbps
            await execAsync(
              `ffmpeg -i "${sourcePath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -metadata comment="${process.env.BETTER_AUTH_URL}"  -b:a 320k -y "${path320}"`
            );

            // Get file sizes
            const stats64 = await stat(path64);
            const stats128 = await stat(path128);
            const stats320 = await stat(path320);

            // Update database with new filenames, uri and links
            await prisma.song.update({
              where: { id },
              data: {
                filename: filename128,
                uri: `/assets/mp3/${filename128}`,
                ogg: `/assets/ogg/${filenameOgg}`,
                links: {
                  "64": {
                    url: `/assets/mp3/${filename64}`,
                    size: formatFileSize(stats64.size),
                    bytes: stats64.size,
                  },
                  "128": {
                    url: `/assets/mp3/${filename128}`,
                    size: formatFileSize(stats128.size),
                    bytes: stats128.size,
                  },
                  "320": {
                    url: `/assets/mp3/${filename320}`,
                    size: formatFileSize(stats320.size),
                    bytes: stats320.size,
                  },
                },
              },
            });

            // Delete the original source file (it's no longer needed)
            await unlink(sourcePath);
          }
        }
      } catch (err) {
        console.error("Failed to process MP3 qualities on approval:", err);
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
