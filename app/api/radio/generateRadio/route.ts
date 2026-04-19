import { Temporal } from "@js-temporal/polyfill";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password !== process.env.RADIO_PASSWORD) {
      return NextResponse.json(
        { success: false, message: "رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    // Target date: 00:00:00 local tomorrow
    const now = Temporal.Now.zonedDateTimeISO();
    const tomorrowLocal = now.toPlainDate().add({ days: 1 });
    const tomorrowStart = tomorrowLocal.toZonedDateTime({
      timeZone: now.timeZoneId,
      plainTime: "00:00:00",
    });

    // Convert to standard Date for Prisma
    const tomorrow = new Date(tomorrowStart.epochMilliseconds);

    // Fetch active songs
    const activeSongs = await prisma.song.findMany({
      where: {
        isActive: true,
        isDisabled: false,
      },
      select: {
        id: true,
        duration: true,
      },
    });

    if (activeSongs.length === 0) {
      return NextResponse.json(
        { success: false, message: "هیچ آهنگ فعالی یافت نشد" },
        { status: 400 }
      );
    }

    // Shuffle songs (Fisher-Yates)
    const shuffledSongs = [...activeSongs];
    for (let i = shuffledSongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledSongs[i], shuffledSongs[j]] = [
        shuffledSongs[j],
        shuffledSongs[i],
      ];
    }

    let totalDuration = 0;
    const tracksToCreate = [];

    for (let i = 0; i < shuffledSongs.length; i++) {
      const song = shuffledSongs[i];
      tracksToCreate.push({
        songId: song.id,
        order: i,
        duration: song.duration,
        startOffset: totalDuration,
      });
      totalDuration += song.duration;

      // Stop if we exceed 24 hours (86400 seconds)
      if (totalDuration >= 86400) break;
    }

    // Delete existing playlist for that date if any
    await prisma.radioPlaylist.deleteMany({
      where: { date: tomorrow },
    });

    // Delete all last playlists, except for the last three
    const playlistsToDelete = await prisma.radioPlaylist.findMany({
      orderBy: { date: "desc" },
      skip: 5,
      select: { id: true },
    });

    if (playlistsToDelete.length > 0) {
      for (const playlist of playlistsToDelete) {
        await prisma.radioPlaylist.deleteMany({
          where: {
            id: playlist.id,
          },
        });
      }
    }

    // Create new playlist
    const playlist = await prisma.radioPlaylist.create({
      data: {
        date: tomorrow,
        startTime: tomorrow,
        totalDuration,
        tracks: {
          create: tracksToCreate.map((track) => ({
            songId: track.songId,
            order: track.order,
            duration: track.duration,
            startOffset: track.startOffset,
          })),
        },
      },
      include: {
        tracks: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `لیست پخش رادیو برای تاریخ ${tomorrow.toISOString()} ایجاد شد`,
      data: {
        id: playlist.id,
        date: playlist.date,
        trackCount: playlist.tracks.length,
        totalDuration: playlist.totalDuration,
      },
    });
  } catch (error) {
    console.error("Error generating radio:", error);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
}
