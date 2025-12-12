import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "You should Login first!",
        },
        { status: 401 }
      );
    }

    const { songId } = await request.json();

    if (!songId) {
      return NextResponse.json(
        { success: false, message: "Song ID is required" },
        { status: 400 }
      );
    }

    // Get or create favorites playlist
    let favoritesPlaylist = await prisma.playlist.findFirst({
      where: { isFavorite: true },
      include: { songs: true },
    });

    if (!favoritesPlaylist) {
      favoritesPlaylist = await prisma.playlist.create({
        data: {
          name: "Favorites",
          description: "Your favorite songs",
          isFavorite: true,
          duration: 0,
        },
        include: { songs: true },
      });
    }

    // Check if song is already in favorites
    const songExists = favoritesPlaylist.songs.some(
      (song) => song.id === songId
    );
    if (songExists) {
      return NextResponse.json(
        { success: false, message: "Song already in favorites" },
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

    // Determine new cover art: if playlist has no songs, use this song's cover
    let newCoverArt = favoritesPlaylist.coverArt;
    if (favoritesPlaylist.songs.length === 0 && song.coverArt) {
      newCoverArt = song.coverArt;
    }

    // Calculate new duration
    const newDuration = favoritesPlaylist.duration + (song.duration || 0);

    // Add song to favorites and update metadata
    await prisma.playlist.update({
      where: { id: favoritesPlaylist.id },
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
      message: "Song added to favorites successfully",
    });
  } catch (error) {
    console.error("Error adding song to favorites:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add song to favorites" },
      { status: 500 }
    );
  }
}
