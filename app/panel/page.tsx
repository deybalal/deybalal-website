import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AdminPanelClient from "@/components/AdminPanelClient";

export default async function PanelPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = (session?.user as { role?: string })?.role;

  const [
    songs,
    artists,
    albums,
    playlists,
    users,
    songsCount,
    artistsCount,
    albumsCount,
    playlistsCount,
    usersCount,
  ] = await Promise.all([
    prisma.song.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.artist.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.album.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.playlist.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.song.count(),
    prisma.artist.count(),
    prisma.album.count(),
    prisma.playlist.count(),
    prisma.user.count(),
  ]);

  return (
    <AdminPanelClient
      userRole={userRole}
      songs={songs}
      artists={artists}
      albums={albums}
      playlists={playlists}
      users={users}
      songsCount={songsCount}
      artistsCount={artistsCount}
      albumsCount={albumsCount}
      playlistsCount={playlistsCount}
      usersCount={usersCount}
    />
  );
}
