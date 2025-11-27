import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rename, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

const songSchema = z.object({
  title: z.string().min(1),
  titleEn: z.string().optional(),
  artist: z.string().min(2, "You must enter artist name!"),
  artistEn: z.string().optional(),
  albumId: z.string().optional(),
  albumName: z.string().optional(),
  uri: z.string().optional(),
  coverArt: z.string().optional(),
  duration: z.number().min(0).optional(),
  filename: z.string().optional(),
  lyrics: z.string().optional(),
  syncedLyrics: z.string().optional(),
  slug: z.string().optional(),
  tempCoverArt: z.string().optional(),
});

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = songSchema.parse(body);

    const slug =
      validatedData.slug ||
      slugify(`${validatedData.artist}-${validatedData.title}`);

    let finalCoverArt = validatedData.coverArt;

    // Handle temporary cover art
    if (validatedData.tempCoverArt) {
      const coverDir = path.join(process.cwd(), "public/assets/cover");
      const tempPath = path.join(coverDir, validatedData.tempCoverArt);

      if (existsSync(tempPath)) {
        if (
          validatedData.coverArt &&
          validatedData.coverArt.includes(validatedData.tempCoverArt)
        ) {
          // User kept the extracted cover art -> Rename it
          // validatedData.filename should be the MP3 filename (e.g. "song.mp3")
          // We want "song.jpg"
          const mp3Filename =
            validatedData.filename || `song-${Date.now()}.mp3`;
          const baseName =
            mp3Filename.substring(0, mp3Filename.lastIndexOf(".")) ||
            mp3Filename;
          const ext = path.extname(validatedData.tempCoverArt);
          const newFilename = `${baseName}${ext}`;
          const newPath = path.join(coverDir, newFilename);

          try {
            await rename(tempPath, newPath);
            finalCoverArt = `/assets/cover/${newFilename}`;
          } catch (err) {
            console.error("Failed to rename cover art:", err);
          }
        } else {
          // User changed the cover art -> Delete the temp file
          try {
            await unlink(tempPath);
          } catch (err) {
            console.error("Failed to delete temp cover art:", err);
          }
        }
      }
    }

    const song = await prisma.song.create({
      data: {
        title: validatedData.title,
        titleEn: validatedData.titleEn || "",
        artist: validatedData.artist || "",
        artistEn: validatedData.artistEn || "",
        albumId: validatedData.albumId || undefined,
        albumName: validatedData.albumName,
        uri:
          validatedData.uri ||
          (validatedData.filename
            ? `/assets/mp3/${validatedData.filename}`
            : ""),
        coverArt: finalCoverArt,
        duration: validatedData.duration || 0,
        filename: validatedData.filename,
        lyrics: validatedData.lyrics,
        syncedLyrics: validatedData.syncedLyrics,
        slug: slug,
      },
    });

    return NextResponse.json({ success: true, data: song });
  } catch (error) {
    console.error("Error creating song:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create song" },
      { status: 500 }
    );
  }
}
