import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import * as mm from "music-metadata";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { logSuspiciousUpload } from "@/lib/logger";
import { sanitizeFilename } from "@/lib/input-sanitizer";
import {
  validateFileType,
  validateFileSize,
  FILE_SIZE_LIMITS,
} from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "ابتدا وارد حساب کاربری شوید.",
        },
        { status: 401 }
      );
    }
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "هیچ فایلی انتخاب نشده!" },
        { status: 400 }
      );
    }

    // Validate file size (23MB max)
    const sizeValidation = validateFileSize(
      file.size,
      FILE_SIZE_LIMITS.AUDIO_MAX
    );
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { success: false, message: sizeValidation.message },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(file.name);

    if (!sanitizedFilename.toLowerCase().endsWith(".mp3")) {
      return NextResponse.json(
        { success: false, message: "فقط فایل های mp3 اجازه ی آپلود دارند!" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate file type using magic numbers
    const typeValidation = await validateFileType(buffer, ["audio/mpeg"]);
    if (!typeValidation.valid) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
      logSuspiciousUpload(
        session.user.id,
        file.name,
        `Invalid file type: ${typeValidation.detectedType || "unknown"}`,
        ip
      );

      return NextResponse.json(
        { success: false, message: "فایل آپلود شده یک فایل MP3 معتبر نیست!" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public/assets/mp3");

    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Ignore if exists
    }

    // Create a temporary filename
    const tempFilename = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}.mp3`;
    const filepath = path.join(uploadDir, tempFilename);

    await writeFile(filepath, buffer);

    // Parse metadata
    let metadata;
    let coverArtPath = "";
    let tempCoverArtPath = "";

    try {
      metadata = await mm.parseBuffer(buffer, file.type || "audio/mpeg");

      const picture = metadata.common.picture?.[0];
      if (picture) {
        const coverDir = path.join(process.cwd(), "public/assets/cover");
        try {
          await mkdir(coverDir, { recursive: true });
        } catch {
          // Ignore
        }

        const ext = picture.format === "image/jpeg" ? "jpg" : "png";
        const tempCoverFilename = `temp_${tempFilename}.${ext}`;
        const tempCoverFilepath = path.join(coverDir, tempCoverFilename);

        await writeFile(tempCoverFilepath, picture.data);
        coverArtPath = `/assets/cover/${tempCoverFilename}`;
        tempCoverArtPath = tempCoverFilename; // Just the filename for easier handling
      }
    } catch (error) {
      console.error("Error parsing metadata:", error);
      // Continue even if metadata parsing fails, but warn
    }

    const publicPath = `/assets/mp3/${tempFilename}`;

    return NextResponse.json({
      success: true,
      data: {
        filePath: publicPath,
        filename: tempFilename,
        coverArt: coverArtPath,
        tempCoverArt: tempCoverArtPath,
        metadata: {
          title: metadata?.common.title || "",
          artist: metadata?.common.artist || "",
          album: metadata?.common.album || "",
          year: metadata?.common.year || undefined,
          duration: metadata?.format.duration || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, message: "خطا در آپلود آهنگ" },
      { status: 500 }
    );
  }
}
