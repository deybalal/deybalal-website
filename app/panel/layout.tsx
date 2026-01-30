import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";
import { prisma } from "@/lib/prisma";
import AdminPanelLayout from "@/components/AdminPanelLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "حساب کاربری",
    template: "%s | حساب کاربری",
  },
  description: "حساب کاربری در پلتفرم دی بلال",
};

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/login");
  }

  const userRole = (session?.user as { role?: string })?.role;

  const isAdminOrMod = userRole === "administrator" || userRole === "moderator";
  const userId = session.user.id;

  const [
    songsCount,
    artistsCount,
    albumsCount,
    playlistsCount,
    usersCount,
    commentsCount,
    suggestionsCount,
  ] = await Promise.all([
    prisma.song.count({
      where: isAdminOrMod ? {} : { userId },
    }),
    prisma.artist.count({
      where: isAdminOrMod ? {} : { userId },
    }),
    prisma.album.count({
      where: isAdminOrMod ? {} : { userId },
    }),
    prisma.playlist.count({
      where: isAdminOrMod ? {} : { userId },
    }),
    isAdminOrMod ? prisma.user.count() : Promise.resolve(0),
    isAdminOrMod
      ? prisma.comment.count()
      : prisma.comment.count({ where: { userId } }),
    isAdminOrMod
      ? prisma.lyricsSuggestion.count()
      : prisma.lyricsSuggestion.count({ where: { userId } }),
  ]);

  return (
    <AdminPanelLayout
      userRole={userRole}
      stats={{
        songsCount,
        artistsCount,
        albumsCount,
        playlistsCount,
        usersCount,
        commentsCount,
        suggestionsCount,
      }}
    >
      {children}
    </AdminPanelLayout>
  );
}
