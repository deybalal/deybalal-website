import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
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

    // Validate file size (5MB max)
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

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate file type using magic numbers
    const typeValidation = await validateFileType(buffer, [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);

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
        { success: false, message: "فایل آپلود شده یک عکس معتبر نیست!" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public/assets/cover");

    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Ignore if exists
    }

    // Create a temp filename with sanitized name
    const timestamp = Date.now();
    const safeFilename = sanitizeFilename(file.name);
    const filename = `temp_${timestamp}_${safeFilename}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const publicPath = `/assets/cover/${filename}`;

    return NextResponse.json({
      success: true,
      data: {
        filePath: publicPath,
        filename: filename,
      },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { success: false, message: "خطا در آپلود عکس!" },
      { status: 500 }
    );
  }
}
