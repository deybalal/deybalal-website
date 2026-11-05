import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unlink, stat } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { createNotification, notifyFollowers } from "@/lib/notifications";
import { exec } from "child_process";
import { promisify } from "util";
import { slugify } from "@/lib/utils";
import { parseFile } from "music-metadata";
import { FTPService } from "@/lib/ftp";

const execAsync = promisify(exec);

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

function getRelativePath(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null;
  const baseUrl = process.env.NEXT_PUBLIC_FTP_BASE_URL || "";
  if (urlOrPath.startsWith(baseUrl)) {
    return urlOrPath.substring(baseUrl.length);
  }
  return urlOrPath;
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

    const sourceFilename = song.filename;
    if (!sourceFilename) {
      return NextResponse.json(
        { success: false, message: "فایل آهنگ یافت نشد!" },
        { status: 400 }
      );
    }

    // Use public/assets sub-folders for local processing
    const localMp3Dir = path.join(process.cwd(), "public/assets/mp3");
    const localOggDir = path.join(process.cwd(), "public/assets/ogg");
    const localCoverDir = path.join(process.cwd(), "public/assets/cover");

    if (!existsSync(localMp3Dir)) mkdirSync(localMp3Dir, { recursive: true });
    if (!existsSync(localOggDir)) mkdirSync(localOggDir, { recursive: true });
    if (!existsSync(localCoverDir))
      mkdirSync(localCoverDir, { recursive: true });

    const localSourcePath = path.join(
      localMp3Dir,
      `source_${Date.now()}_${sourceFilename}`
    );
    const remoteSourcePath = `/assets/mp3/${sourceFilename}`;

    // Download from FTP to local temp for processing
    try {
      await FTPService.downloadToFile(remoteSourcePath, localSourcePath);
    } catch (downloadError) {
      console.error("FTP Download Error:", downloadError);
      return NextResponse.json(
        { success: false, message: "خطا در دریافت فایل از سرویس ابری" },
        { status: 500 }
      );
    }

    // Prepare filenames and paths
    const artistSlug = slugify(song.artistEn || song.artist || "artist");
    const titleSlug = slugify(song.titleEn || song.title || "song");
    const baseFilename = `${artistSlug}-${titleSlug}`;

    let finalBaseName = baseFilename;
    // Note: Existence check on FTP is harder, but we can try to find if file exists or just use unique names
    // For now, keep the counter logic but it might need to check FTP
    finalBaseName = `${baseFilename}-${Date.now().toString().slice(-4)}`;

    const filenameCoverArt = `${finalBaseName}.jpg`;
    const filenameOgg = `${song.id}.ogg`;
    const filename64 = `${finalBaseName}-64.mp3`;
    const filename128 = `${finalBaseName}-128.mp3`;
    const filename320 = `${finalBaseName}-320.mp3`;

    const pathOgg = path.join(localOggDir, filenameOgg);
    const path64 = path.join(localMp3Dir, filename64);
    const path128 = path.join(localMp3Dir, filename128);
    const path320 = path.join(localMp3Dir, filename320);

    // Track local files for cleanup
    filesToCleanup.push(localSourcePath, pathOgg, path64, path128, path320);

    // Cover art handling (if it's already on FTP)
    const remoteCoverPath = song.coverArt;
    let localCoverPath: string | null = null;

    // Convert full URL string to relative path if needed
    const relativeCoverPath = getRelativePath(remoteCoverPath);

    if (
      relativeCoverPath &&
      (relativeCoverPath.startsWith("/") ||
        relativeCoverPath.startsWith("http"))
    ) {
      localCoverPath = path.join(localCoverDir, `temp_cover_${Date.now()}.jpg`);
      try {
        await FTPService.downloadToFile(relativeCoverPath, localCoverPath);
        filesToCleanup.push(localCoverPath);
      } catch (e) {
        console.error(
          "Failed to download cover for FFMPEG embedding:",
          e,
          "Path:",
          relativeCoverPath
        );
        localCoverPath = null;
      }
    }
    const hasCover = localCoverPath && existsSync(localCoverPath);

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
      ? `-i "${localCoverPath}" -map 0:a -map 1:v -c:v copy -id3v2_version 3 -metadata:s:v title="Album cover" -metadata:s:v comment="Cover (front)"`
      : "-map 0:a";

    const startingPoint =
      (song.duration / 2 + 30 > song.duration ? 0 : song.duration / 2) || 0;

    // FFMPEG Processing
    try {
      // Generate OGG Preview
      await execAsync(
        `ffmpeg -i "${localSourcePath}" -ss ${startingPoint} -t 30 -c:a libvorbis -b:a 64k -y "${pathOgg}"`
      );

      // Generate 64kbps
      await execAsync(
        `ffmpeg -i "${localSourcePath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 64k -y "${path64}"`
      );

      // Generate 128kbps
      await execAsync(
        `ffmpeg -i "${localSourcePath}" ${coverArgs} -map_metadata -1 ${metadataArgs} -b:a 128k -y "${path128}"`
      );

      // Generate 320kbps
      await execAsync(
        `ffmpeg -i "${localSourcePath}" ${coverArgs} -map_metadata -1 ${metadataArgs}  -b:a 320k -y "${path320}"`
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
    const duration = (await parseFile(localSourcePath)).format.duration;

    // Upload processed files back to FTP
    try {
      await FTPService.uploadFile(pathOgg, `/assets/ogg/${filenameOgg}`);
      await FTPService.uploadFile(path64, `/assets/mp3/${filename64}`);
      await FTPService.uploadFile(path128, `/assets/mp3/${filename128}`);
      await FTPService.uploadFile(path320, `/assets/mp3/${filename320}`);
    } catch (uploadError) {
      console.error("FTP Upload Error (processed files):", uploadError);
      return NextResponse.json(
        {
          success: false,
          message: "خطا در آپلود فایل‌های پردازش شده به سرور ابری",
        },
        { status: 500 }
      );
    }

    // 5. Update database and activate song
    const updatedSong = await prisma.song.update({
      where: { id },
      data: {
        isActive: true,
        filename: filename128,
        duration: duration || song.duration,
        uri: `${process.env.NEXT_PUBLIC_FTP_BASE_URL}/assets/mp3/${filename128}`,
        ogg: `${process.env.NEXT_PUBLIC_FTP_BASE_URL}/assets/ogg/${filenameOgg}`,
        coverArt: hasCover
          ? `${process.env.NEXT_PUBLIC_FTP_BASE_URL}/assets/cover/${filenameCoverArt}`
          : "",
        links: {
          "64": {
            url: `${process.env.NEXT_PUBLIC_FTP_BASE_URL}/assets/mp3/${filename64}`,
            size: formatFileSize(stats64.size),
            bytes: stats64.size,
          },
          "128": {
            url: `${process.env.NEXT_PUBLIC_FTP_BASE_URL}/assets/mp3/${filename128}`,
            size: formatFileSize(stats128.size),
            bytes: stats128.size,
          },
          "320": {
            url: `${process.env.NEXT_PUBLIC_FTP_BASE_URL}/assets/mp3/${filename320}`,
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

    // 7. Cleanup
    // Delete source file from FTP
    await FTPService.deleteFile(remoteSourcePath);

    // Handle cover art finalization on FTP
    if (hasCover && remoteCoverPath) {
      const finalRemoteCoverPath = `/assets/cover/${filenameCoverArt}`;
      const sourceRelativePath = getRelativePath(remoteCoverPath);
      if (sourceRelativePath) {
        await FTPService.renameFile(sourceRelativePath, finalRemoteCoverPath);
      }
    }

    // Local cleanup
    for (const f of filesToCleanup) {
      if (existsSync(f)) await unlink(f).catch(() => {});
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
