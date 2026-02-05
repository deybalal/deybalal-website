import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unlink, stat, rename } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createNotification, notifyFollowers } from "@/lib/notifications";
import { exec } from "child_process";
import { promisify } from "util";
import { slugify } from "@/lib/utils";
import { parseFile } from "music-metadata";

const execAsync = promisify(exec);

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const filesToCleanup: string[] = [];

  try {
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
    const song = await prisma.song.findUnique({
      where: { id },
      include: { artists: true, crew: true },
    });

    if (!song) {
      return NextResponse.json(
        { success: false, message: "آهنگ پیدا نشد!" },
        { status: 404 }
      );
    }

    if (song.isActive) {
      return NextResponse.json(
        { success: false, message: "این آهنگ قبلاً تایید شده است." },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public/assets/mp3");
    const uploadDirOgg = path.join(process.cwd(), "public/assets/ogg");
    const sourceFilename = song.filename;

    if (!sourceFilename) {
      return NextResponse.json(
        { success: false, message: "فایل آهنگ یافت نشد!" },
        { status: 400 }
      );
    }

    const sourcePath = path.join(uploadDir, sourceFilename);
    if (!existsSync(sourcePath)) {
      return NextResponse.json(
        { success: false, message: "فایل منبع در سرور یافت نشد!" },
        { status: 400 }
      );
    }

    // Prepare filenames and paths
    const artistSlug = slugify(song.artistEn || song.artist || "artist");
    const titleSlug = slugify(song.titleEn || song.title || "song");
    const baseFilename = `${artistSlug}-${titleSlug}`;

    let finalBaseName = baseFilename;
    let counter = 1;
    while (
      existsSync(path.join(uploadDir, `${finalBaseName}-128.mp3`)) ||
      existsSync(path.join(uploadDir, `${finalBaseName}-320.mp3`))
    ) {
      finalBaseName = `${baseFilename}${counter}`;
      counter++;
    }

    const filenameCoverArt = `${finalBaseName}.jpg`;
    const filenameOgg = `${song.id}.ogg`;
    const filename64 = `${finalBaseName}-64.mp3`;
    const filename128 = `${finalBaseName}-128.mp3`;
    const filename320 = `${finalBaseName}-320.mp3`;

    const pathOgg = path.join(uploadDirOgg, filenameOgg);
    const path64 = path.join(uploadDir, filename64);
    const path128 = path.join(uploadDir, filename128);
    const path320 = path.join(uploadDir, filename320);

    // Track files for cleanup if something fails
    filesToCleanup.push(pathOgg, path64, path128, path320);

    const coverPath = song.coverArt
      ? path.join(process.cwd(), "public", song.coverArt)
      : null;
    const hasCover = coverPath && existsSync(coverPath);

    const metadataArgs = [
      `-metadata title="${song.title.replace(/"/g, '\\"')}"`,
      `-metadata comment="${process.env.BETTER_AUTH_URL}"`,
      `-metadata artist="${song.artist.replace(/"/g, '\\"')}"`,
      `-metadata album_artist="${song.artist.replace(/"/g, '\\"')}"`,
      song.albumName
        ? `-metadata album="${song.albumName.replace(/"/g, '\\"')}"`
        : "",
      song.year ? `-metadata date="${song.year}"` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const coverArgs = hasCover
      ? `-i "${coverPath}" -map 0:a -map 1:v -c:v copy -id3v2_version 3 -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (front)"`
      : "-map 0:a";

    const startingPoint =
      (song.duration / 2 + 30 > song.duration ? 0 : song.duration / 2) || 0;

    // FFMPEG Processing
    try {
      // Generate OGG Preview
      await execAsync(
        `ffmpeg -i "${sourcePath}" -ss ${startingPoint} -t 30 -c:a libvorbis -b:a 64k -y "${pathOgg}"`
      );

      // Generate 64kbps
      await execAsync(
        `ffmpeg -i "${sourcePath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 64k -y "${path64}"`
      );

      // Generate 128kbps
      await execAsync(
        `ffmpeg -i "${sourcePath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 128k -y "${path128}"`
      );

      // Generate 320kbps
      await execAsync(
        `ffmpeg -i "${sourcePath}" ${coverArgs} -map_metadata -1 ${metadataArgs}  -b:a 320k -y "${path320}"`
      );
    } catch (ffmpegError) {
      console.error("FFMPEG Processing Error:", ffmpegError);
      // Cleanup files on failure
      for (const f of filesToCleanup) {
        if (existsSync(f)) await unlink(f).catch(() => {});
      }
      return NextResponse.json(
        {
          success: false,
          message: "خطا در پردازش فایل‌های صوتی! آهنگ تایید نشد.",
        },
        { status: 500 }
      );
    }

    // Get file sizes for metadata
    const stats64 = await stat(path64);
    const stats128 = await stat(path128);
    const stats320 = await stat(path320);
    const duration = (await parseFile(sourcePath)).format.duration;

    // 5. Update database and activate song
    const updatedSong = await prisma.song.update({
      where: { id },
      data: {
        isActive: true,
        filename: filename128,
        duration: duration || song.duration,
        uri: `/assets/mp3/${filename128}`,
        ogg: `/assets/ogg/${filenameOgg}`,
        coverArt: hasCover ? `/assets/cover/${filenameCoverArt}` : "",
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

    // 6. Notifications
    try {
      // Notify the user who submitted the song
      await createNotification({
        userId: song.userId,
        type: "SONG_APPROVED",
        title: "آهنگ تایید شد!",
        message: `آهنگ ارسالی شما "${updatedSong.title}" تایید شد! هم اکنون میتوانید از شنیدن این آهنگ لذت ببرید!`,
        link: `/song/${updatedSong.id}`,
      });

      // Notify followers of each artist
      const artistIds = song.artists.map((a) => a.id);
      if (artistIds && artistIds.length > 0) {
        for (const artistId of artistIds) {
          await notifyFollowers({
            artistId,
            type: "NEW_RELEASE",
            title: "آهنگ جدید منتشر شد!",
            message: `${updatedSong.artist} آهنگ جدیدی منتشر کرد: ${updatedSong.title}`,
            link: `/song/${updatedSong.id}`,
          });
        }
      }
    } catch (notifError) {
      console.error("Notification Error (non-critical):", notifError);
      // We don't fail the whole request because notifications are secondary to the song being live
    }

    // 7. Cleanup source file
    await unlink(sourcePath).catch((e) =>
      console.error("Failed to delete source file:", e)
    );

    if (hasCover) {
      if (existsSync(coverPath)) {
        rename(
          coverPath,
          path.join(process.cwd(), "public/assets/cover", filenameCoverArt)
        );
      }
    }

    return NextResponse.json({ success: true, data: updatedSong });
  } catch (error) {
    console.error("General Error in Song Approval:", error);
    return NextResponse.json(
      { success: false, message: "خطا در تایید آهنگ!" },
      { status: 500 }
    );
  }
}
