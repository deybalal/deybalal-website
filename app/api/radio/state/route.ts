import { Temporal } from "@js-temporal/polyfill";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  noStore();
  try {
    const now = Temporal.Now.zonedDateTimeISO();

    const playlist = await prisma.radioPlaylist.findFirst({
      // Consider filtering by date if needed:
      // where: { date: new Date(today.toString()) },
      include: {
        tracks: {
          include: {
            song: {
              select: {
                id: true,
                slug: true,
                title: true,
                titleEn: true,
                artist: true,
                artistEn: true,
                coverArt: true,
                uri: true,
                duration: true,
                lyrics: true,
                syncedLyrics: true,
                links: true,
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({
        success: false,
        message: "رادیو خاموش است",
        code: "NO_PLAYLIST",
      });
    }

    const currentServerTime = now.epochMilliseconds;

    // Use the playlist's recorded startTime, but handle it via Temporal
    const playlistStartTime = Temporal.Instant.from(
      playlist.startTime.toISOString()
    ).toZonedDateTimeISO(now.timeZoneId);

    // Alternatively, if the radio should always be relative to local midnight:
    // const dayStart = now.startOfDay();
    // const elapsedTime = Math.floor(now.since(dayStart).total({ unit: 'second' }));

    // For now, let's stick to the stored startTime but calculated via Temporal for precision
    const elapsedTime = Math.floor(
      now.since(playlistStartTime).total({ unit: "second" })
    );

    if (elapsedTime < 0) {
      return NextResponse.json({
        success: false,
        message: "رادیو هنوز شروع نشده است",
        code: "NOT_STARTED_YET",
        startTime: playlist.startTime.toISOString(),
      });
    }

    if (elapsedTime >= playlist.totalDuration) {
      return NextResponse.json({
        success: false,
        message: "رادیو خاموش است",
        code: "PLAYLIST_ENDED",
      });
    }

    // Find the current track
    const currentTrackIndex = playlist.tracks.findIndex(
      (track) =>
        elapsedTime >= track.startOffset &&
        elapsedTime < track.startOffset + track.duration
    );

    if (currentTrackIndex === -1) {
      return NextResponse.json({
        success: false,
        message: "آهنگی در حال پخش نیست",
        code: "NO_ACTIVE_TRACK",
      });
    }

    const currentTrack = playlist.tracks[currentTrackIndex];
    const trackPosition = elapsedTime - currentTrack.startOffset;

    // Next track info
    const nextTrack = playlist.tracks[currentTrackIndex + 1]?.song || null;

    return NextResponse.json({
      success: true,
      data: {
        serverTime: currentServerTime,
        elapsedTime,
        totalDuration: playlist.totalDuration,
        currentTrack: {
          ...currentTrack.song,
          position: trackPosition,
        },
        nextTrack,
        playlistId: playlist.id,
        timeZone: now.timeZoneId,
      },
    });
  } catch (error) {
    console.error("Error fetching radio state:", error);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
}
