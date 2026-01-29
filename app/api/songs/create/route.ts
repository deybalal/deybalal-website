import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rename, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { parseFile } from "music-metadata";

export const dynamic = "force-dynamic";

const songSchema = z.object({
  title: z.string().min(1),
  titleEn: z.string().optional(),
  artist: z.string().min(2, "وارد کردن نام خواننده اجباری است!"),
  artistEn: z.string().optional(),
  artistIds: z.array(z.string()).optional(), // Artist IDs for database relation
  albumId: z.string().optional(),
  albumName: z.string().optional(),
  uri: z.string().optional(),
  links: z.record(z.string(), z.any()).optional(),
  coverArt: z.string().optional(),
  year: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  filename: z.string().optional(),
  lyrics: z.string().optional(),
  syncedLyrics: z.string().optional(),
  slug: z.string().optional(),
  tempCoverArt: z.string().optional(),
  crew: z
    .array(
      z.object({
        role: z.string().min(1),
        name: z.string().min(1),
      })
    )
    .optional(),
  genreIds: z.array(z.string()).optional(),
  useArtistImage: z.boolean().optional(),
});

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

    const body = await request.json();
    const validatedData = songSchema.parse(body);

    // Artist Restriction Check
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isUserAnArtist: true, artistId: true },
    });

    if (user?.isUserAnArtist && user.artistId) {
      // If user is an artist, they can only create songs where they are the singer
      if (
        !validatedData.artistIds ||
        !validatedData.artistIds.includes(user.artistId)
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "به عنوان یک خواننده ی تایید شده، فقط میتوانید آهنگ های خودتان را ارسال کنید!",
          },
          { status: 403 }
        );
      }
    }

    // Fetch artistEn from database if not provided
    let artistEn = validatedData.artistEn || "";
    if (
      !artistEn &&
      validatedData.artistIds &&
      validatedData.artistIds.length > 0
    ) {
      const artists = await prisma.artist.findMany({
        where: { id: { in: validatedData.artistIds } },
        select: { nameEn: true },
      });
      artistEn = artists
        .map((a) => a.nameEn)
        .filter(Boolean)
        .join(", ");
    }

    // Fetch duration from file if not provided
    let duration = validatedData.duration || 0;
    if (!duration && validatedData.filename) {
      const filePath = path.join(
        process.cwd(),
        "public/assets/mp3",
        validatedData.filename
      );
      if (existsSync(filePath)) {
        try {
          const metadata = await parseFile(filePath);
          duration = Math.round(metadata.format.duration || 0);
        } catch (err) {
          console.error("Failed to parse duration on creation:", err);
        }
      }
    }

    const slug =
      validatedData.slug ||
      slugify(
        `${artistEn ? artistEn : validatedData.artist}-${
          validatedData.titleEn ? validatedData.titleEn : validatedData.title
        }`
      );

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

    if (!finalCoverArt) {
      if (
        validatedData.useArtistImage &&
        validatedData.artistIds &&
        validatedData.artistIds.length > 0
      ) {
        const artist = await prisma.artist.findUnique({
          where: { id: validatedData.artistIds[0] },
          select: { image: true },
        });
        if (artist?.image) {
          finalCoverArt = artist.image;
        } else {
          finalCoverArt = "/images/cover.png";
        }
      }
    }

    if (!finalCoverArt) {
      finalCoverArt = "/images/cover.png";
    }

    const song = await prisma.song.create({
      data: {
        title: validatedData.title,
        titleEn: validatedData.titleEn || "",
        artist: validatedData.artist || "",
        artistEn: artistEn || "",
        artists: {
          connect: validatedData.artistIds?.map((id) => ({ id })) || [],
        },
        albumId: validatedData.albumId || undefined,
        albumName: validatedData.albumName,
        uri:
          validatedData.uri ||
          (validatedData.filename
            ? `/assets/mp3/${validatedData.filename}`
            : ""),
        links: validatedData.links || undefined,
        coverArt: finalCoverArt,
        year: validatedData.year || 0,
        duration: duration,
        filename: validatedData.filename,
        lyrics: validatedData.lyrics,
        syncedLyrics: validatedData.syncedLyrics,
        slug: slug,
        userId: session.user.id,
        contributors: {
          create: [
            {
              userId: session.user.id,
              type: "add",
              percentage: 100,
            },
            ...(validatedData.lyrics
              ? [
                  {
                    userId: session.user.id,
                    type: "lyrics",
                    percentage: 100,
                  },
                ]
              : []),
            ...(validatedData.syncedLyrics
              ? [
                  {
                    userId: session.user.id,
                    type: "sync",
                    percentage: 100,
                  },
                ]
              : []),
          ],
        },
        crew: {
          create: validatedData.crew || [],
        },
        genres: {
          connect: validatedData.genreIds?.map((id) => ({ id })) || [],
        },
      },
    });
    return NextResponse.json({ success: true, data: song });
  } catch (error) {
    console.error("Error creating song:", error);
    return NextResponse.json(
      { success: false, message: "خطا در ارسال آهنگ جدید" },
      { status: 500 }
    );
  }
}
