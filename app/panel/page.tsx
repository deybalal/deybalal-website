import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AdminPanelClient from "@/components/AdminPanelClient";

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = (session?.user as { role?: string })?.role;
  const params = await searchParams;

  const songsPage = Number(params.songsPage) || 1;
  const artistsPage = Number(params.artistsPage) || 1;
  const albumsPage = Number(params.albumsPage) || 1;
  const playlistsPage = Number(params.playlistsPage) || 1;
  const usersPage = Number(params.usersPage) || 1;
  const commentsPage = Number(params.commentsPage) || 1;

  const pageSize = 20;

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
    comments,
    commentsCount,
  ] = await Promise.all([
    prisma.song.findMany({
      orderBy: { createdAt: "desc" },
      skip: (songsPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.artist.findMany({
      orderBy: { createdAt: "desc" },
      skip: (artistsPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      skip: (albumsPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.playlist.findMany({
      orderBy: { createdAt: "desc" },
      skip: (playlistsPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (usersPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.song.count(),
    prisma.artist.count(),
    prisma.album.count(),
    prisma.playlist.count(),
    prisma.user.count(),
    prisma.comment.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
      skip: (commentsPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.comment.count(),
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
      comments={comments}
      commentsCount={commentsCount}
      pageSize={pageSize}
      currentPage={{
        songs: songsPage,
        artists: artistsPage,
        albums: albumsPage,
        playlists: playlistsPage,
        users: usersPage,
        comments: commentsPage,
      }}
    />
  );
}
