import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { FTPService } from "@/lib/ftp";
import path from "path";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUniqueSongSlug } from "@/lib/slug";
import { findSimilarSongs } from "@/lib/similarity";

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
    // Note: Since files are on FTP, we skip local duration check here.
    // The client typically sends the duration parsed during upload.

    const slugBase =
      validatedData.slug ||
      `${artistEn ? artistEn : validatedData.artist}-${
        validatedData.titleEn ? validatedData.titleEn : validatedData.title
      }`;

    const slug = await getUniqueSongSlug(slugBase);

    let finalCoverArt = validatedData.coverArt;

    // Handle temporary cover art
    if (validatedData.tempCoverArt) {
      const coverPathPrefix = "/assets/cover/";
      const tempRemotePath = `${coverPathPrefix}${validatedData.tempCoverArt}`;

      // We assume the file exists on FTP as it was just uploaded
      if (
        validatedData.coverArt &&
        validatedData.coverArt.includes(validatedData.tempCoverArt)
      ) {
        // User kept the extracted cover art -> Rename it
        const mp3Filename = validatedData.filename || `song-${Date.now()}.mp3`;
        const baseName =
          mp3Filename.substring(0, mp3Filename.lastIndexOf(".")) || mp3Filename;
        const ext = path.extname(validatedData.tempCoverArt);
        const newFilename = `${baseName}${ext}`;
        const newRemotePath = `${coverPathPrefix}${newFilename}`;

        try {
          await FTPService.renameFile(tempRemotePath, newRemotePath);
          finalCoverArt = `${process.env.NEXT_PUBLIC_FTP_BASE_URL}/assets/cover/${newFilename}`;
        } catch (err) {
          console.error("Failed to rename cover art on FTP:", err);
        }
      } else {
        // User changed the cover art -> Delete the temp file from FTP
        try {
          await FTPService.deleteFile(tempRemotePath);
        } catch (err) {
          console.error("Failed to delete temp cover art on FTP:", err);
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

    const count = await prisma.song.count();

    const song = await prisma.song.create({
      data: {
        index: count,
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
            ? `${process.env.NEXT_PUBLIC_FTP_BASE_URL}/assets/mp3/${validatedData.filename}`
            : ""),
        links: validatedData.links || undefined,
        coverArt: finalCoverArt,
        year: validatedData.year || 0,
        duration: validatedData.duration || 0,
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
        similarSongs: {
          connect: await findSimilarSongs({
            title: validatedData.title,
            artistIds: validatedData.artistIds || [],
            genreIds: validatedData.genreIds || [],
          }),
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
