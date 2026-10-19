import { NextResponse } from "next/server";
import { mkdir, readFile } from "fs/promises";
import path from "path";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { sanitizeFilename } from "@/lib/input-sanitizer";
import {
  validateFileType,
  validateFileSize,
  FILE_SIZE_LIMITS,
} from "@/lib/validators";
import axios from "axios";
import { applyWatermark } from "@/lib/image-utils";

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
    const uploadDir = path.join(process.cwd(), "public/assets/cover");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Ignore if exists
    }

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { url, artist = "", title = "" } = body;

      if (!url || typeof url !== "string") {
        return NextResponse.json(
          { success: false, message: "آدرس اینترنتی (URL) کاور نامعتبر است." },
          { status: 400 }
        );
      }

      const trimmedUrl = url.trim();
      if (
        !trimmedUrl.startsWith("http://") &&
        !trimmedUrl.startsWith("https://") &&
        !trimmedUrl.startsWith("/")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "آدرس URL باید با http:// یا https:// یا مسیر نسبی / آغاز شود.",
          },
          { status: 400 }
        );
      }

      let buffer: Buffer;
      if (
        trimmedUrl.startsWith("http://") ||
        trimmedUrl.startsWith("https://")
      ) {
        try {
          const response = await axios.get(trimmedUrl, {
            responseType: "arraybuffer",
            timeout: 30000,
            maxContentLength: FILE_SIZE_LIMITS.IMAGE_MAX,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });

          buffer = Buffer.from(response.data);
        } catch (err) {
          console.error(
            "Error downloading image from URL:",
            (err as Error)?.message || err
          );
          return NextResponse.json(
            {
              success: false,
              message:
                (err as { response: { status: number } })?.response?.status ===
                404
                  ? "فایل تصویر در آدرس وارد شده یافت نشد (خطای ۴۰۴)."
                  : "خطا در دریافت تصویر از آدرس اینترنتی.",
            },
            { status: 400 }
          );
        }
      } else if (trimmedUrl.startsWith("/")) {
        try {
          const localPath = path.join(process.cwd(), "public", trimmedUrl);
          buffer = await readFile(localPath);
        } catch (err) {
          console.error("Error reading local image:", err);
          return NextResponse.json(
            { success: false, message: "فایل تصویر در سرور یافت نشد." },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "آدرس URL نامعتبر است.",
          },
          { status: 400 }
        );
      }

      // Validate image format using canvas
      try {
        const { loadImage } = await import("canvas");
        await loadImage(buffer);
      } catch {
        return NextResponse.json(
          { success: false, message: "فایل دریافت شده یک تصویر معتبر نیست." },
          { status: 400 }
        );
      }

      // Generate temp filename and output path
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const filename = `temp_${timestamp}_${randomStr}.jpg`;
      const outputPath = path.join(uploadDir, filename);

      // Apply watermark from lib/image-utils.ts
      const watermarkSuccess = await applyWatermark(
        buffer,
        outputPath,
        artist,
        title
      );

      if (!watermarkSuccess) {
        return NextResponse.json(
          { success: false, message: "خطا در اعمال واترمارک روی تصویر." },
          { status: 500 }
        );
      }

      const publicPath = `/assets/cover/${filename}`;

      return NextResponse.json({
        success: true,
        data: {
          filePath: publicPath,
          filename: filename,
        },
      });
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const artist = (formData.get("artist") as string) || "";
      const title = (formData.get("title") as string) || "";

      if (!file) {
        return NextResponse.json(
          { success: false, message: "هیچ فایلی انتخاب نشده!" },
          { status: 400 }
        );
      }

      const sizeValidation = validateFileSize(
        file.size,
        FILE_SIZE_LIMITS.IMAGE_MAX
      );
      if (!sizeValidation.valid) {
        return NextResponse.json(
          { success: false, message: sizeValidation.message },
          { status: 400 }
        );
      }

      const chunks = [];
      const reader = file.stream().getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const buffer = Buffer.concat(chunks);

      // Validate file type
      const typeValidation = await validateFileType(buffer, [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ]);

      if (!typeValidation.valid) {
        return NextResponse.json(
          { success: false, message: "فایل آپلود شده یک عکس معتبر نیست!" },
          { status: 400 }
        );
      }

      const skipWatermark = formData.get("skipWatermark") === "true";

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const safeFilename = sanitizeFilename(file.name).replace(/\.[^/.]+$/, "");
      const filename = `temp_${timestamp}_${safeFilename}_${randomStr}.jpg`;
      const filepath = path.join(uploadDir, filename);

      let watermarkSuccess = true;
      if (!skipWatermark) {
        watermarkSuccess = await applyWatermark(
          buffer,
          filepath,
          artist,
          title
        );
      } else {
        const fs = await import("fs/promises");
        await fs.writeFile(filepath, buffer);
      }

      if (!watermarkSuccess) {
        return NextResponse.json(
          { success: false, message: "خطا در اعمال واترمارک روی تصویر." },
          { status: 500 }
        );
      }

      const publicPath = `/assets/cover/${filename}`;

      return NextResponse.json({
        success: true,
        data: {
          filePath: publicPath,
          filename: filename,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, message: "فرمت درخواست نامعتبر است" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { success: false, message: "خطا در پردازش عکس!" },
      { status: 500 }
    );
  }
}
