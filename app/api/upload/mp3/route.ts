import { NextResponse } from "next/server";
import * as mm from "music-metadata";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { headers } from "next/headers";
import axios from "axios";
import { validateFileSize, FILE_SIZE_LIMITS } from "@/lib/validators";

export const runtime = "nodejs";

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

    const contentType = request.headers.get("content-type") || "";
    let buffer: Buffer;
    let originalFilename = "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { url } = body;

      if (!url || typeof url !== "string") {
        return NextResponse.json(
          { success: false, message: "آدرس اینترنتی (URL) آهنگ نامعتبر است." },
          { status: 400 }
        );
      }

      const trimmedUrl = url.trim();
      if (
        !trimmedUrl.startsWith("http://") &&
        !trimmedUrl.startsWith("https://")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "آدرس URL باید با http:// یا https:// آغاز شود.",
          },
          { status: 400 }
        );
      }

      try {
        const response = await axios.get(trimmedUrl, {
          responseType: "arraybuffer",
          timeout: 300000,
          maxContentLength: FILE_SIZE_LIMITS.AUDIO_MAX,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });

        buffer = Buffer.from(response.data);

        try {
          const urlObj = new URL(trimmedUrl);
          originalFilename =
            path.basename(urlObj.pathname) || "downloaded-song.mp3";
        } catch {
          originalFilename = "downloaded-song.mp3";
        }
      } catch (err) {
        console.error(
          "Error downloading MP3 from URL:",
          (err as Error)?.message || err
        );
        return NextResponse.json(
          {
            success: false,
            message:
              (err as { response: { status: number } })?.response?.status ===
              404
                ? "فایل آهنگ در آدرس وارد شده یافت نشد (خطای ۴۰۴)."
                : "خطا در دانلود آهنگ از آدرس داده شده. لطفا از صحت لینک مستقیم اطمینان حاصل کنید.",
          },
          { status: 400 }
        );
      }
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { success: false, message: "هیچ فایلی انتخاب نشده!" },
          { status: 400 }
        );
      }

      originalFilename = file.name;
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      return NextResponse.json(
        { success: false, message: "فرمت درخواست نامعتبر است" },
        { status: 400 }
      );
    }

    // Validate size
    const sizeValidation = validateFileSize(
      buffer.length,
      FILE_SIZE_LIMITS.AUDIO_MAX
    );
    if (!sizeValidation.valid) {
      return NextResponse.json(
        { success: false, message: sizeValidation.message },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public/assets/mp3");
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
    let metadata: mm.IAudioMetadata | undefined;
    let coverArtPath = "";
    let tempCoverArtPath = "";

    try {
      metadata = await mm.parseBuffer(buffer, "audio/mpeg");

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
        tempCoverArtPath = tempCoverFilename;
      }
    } catch (error) {
      console.error("Error parsing metadata:", error);
    }

    // Fallback title from original filename if metadata title is missing
    let extractedTitle = metadata?.common.title || "";
    if (!extractedTitle && originalFilename) {
      const cleanName = decodeURIComponent(originalFilename)
        .replace(/\.[^/.]+$/, "")
        .replace(/temp_\d+_[a-z0-9]+/i, "")
        .replace(/[-_]/g, " ")
        .trim();
      if (cleanName) {
        extractedTitle = cleanName;
      }
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
          title: extractedTitle,
          artist: metadata?.common.artist || "",
          album: metadata?.common.album || "",
          year: metadata?.common.year || undefined,
          duration: metadata?.format.duration || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error processing MP3:", error);
    return NextResponse.json(
      { success: false, message: "خطا در آپلود یا دانلود آهنگ" },
      { status: 500 }
    );
  }
}
