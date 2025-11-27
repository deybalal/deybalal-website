import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import * as mm from "music-metadata";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".mp3")) {
      return NextResponse.json(
        { success: false, message: "Only MP3 files are allowed" },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public/assets/mp3");

    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Ignore if exists
    }

    // Create a unique filename to avoid overwriting
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const filepath = path.join(uploadDir, safeFilename);

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
        const tempCoverFilename = `temp_${safeFilename}.${ext}`;
        const tempCoverFilepath = path.join(coverDir, tempCoverFilename);

        await writeFile(tempCoverFilepath, picture.data);
        coverArtPath = `/assets/cover/${tempCoverFilename}`;
        tempCoverArtPath = tempCoverFilename; // Just the filename for easier handling
      }
    } catch (error) {
      console.error("Error parsing metadata:", error);
      // Continue even if metadata parsing fails, but warn
    }

    const publicPath = `/assets/mp3/${safeFilename}`;

    return NextResponse.json({
      success: true,
      data: {
        filePath: publicPath,
        filename: safeFilename,
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
      { success: false, message: "Failed to upload file" },
      { status: 500 }
    );
  }
}
