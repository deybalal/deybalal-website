import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json(
        { success: false, message: "Song ID is required" },
        { status: 400 }
      );
    }

    // Check if playlist exists
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: { songs: true },
    });

    if (!playlist) {
      return NextResponse.json(
        { success: false, message: "Playlist not found" },
        { status: 404 }
      );
    }

    // Check if song is already in playlist
    const songExists = playlist.songs.some((song) => song.id === songId);
    if (songExists) {
      return NextResponse.json(
        { success: false, message: "Song already in playlist" },
        { status: 400 }
      );
    }

    // Get the song details
    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      return NextResponse.json(
        { success: false, message: "Song not found" },
        { status: 404 }
      );
    }

    // Determine new cover art: if playlist has no cover art or no songs, use this song's cover
    // But since we are adding a song, if the playlist currently has no songs, this will be the first one.
    // Or if we want to enforce "cover art of the first song", we should check if the playlist is empty.
    let newCoverArt = playlist.coverArt;
    if (playlist.songs.length === 0 && song.coverArt) {
      newCoverArt = song.coverArt;
    }

    // Calculate new duration
    const newDuration = playlist.duration + (song.duration || 0);

    // Add song to playlist and update metadata
    await prisma.playlist.update({
      where: { id },
      data: {
        songs: {
          connect: { id: songId },
        },
        duration: newDuration,
        coverArt: newCoverArt,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Song added to playlist successfully",
    });
  } catch (error) {
    console.error("Error adding song to playlist:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add song to playlist" },
      { status: 500 }
    );
  }
}
