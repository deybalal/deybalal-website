import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ArtistForm from "@/components/admin/ArtistForm";
import { Artist, Song } from "@/types/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function EditArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/login");
  }

  const userRole = (session.user as { role?: string }).role;

  if (userRole !== "administrator" && userRole !== "moderator") {
    return redirect("/panel");
  }

  const { id } = await params;

  const artist = await prisma.artist.findUnique({
    where: { id },
    include: {
      songs: true,
    },
  });

  if (!artist) {
    return notFound();
  }

  // Map Prisma artist to our Artist type
  const artistData: Artist = {
    id: artist.id,
    name: artist.name,
    nameEn: artist.nameEn,
    description: artist.description,
    image: artist.image,
    isVerified: artist.isVerified,
    songs: artist.songs.map((song) => ({
      id: song.id,
      title: song.title,
      titleEn: song.titleEn,
      uri: song.uri,
      filename: song.filename || "",
      index: song.index,
      duration: song.duration,
      coverArt: song.coverArt,
      artist: song.artist,
      album: song.albumName,
      albumId: song.albumId,
      links: song.links as Song["links"],
      artists: [], // We don't need full artist objects here for the form
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/panel/artists">
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-foreground neon-text">
            ویرایش خواننده: {artist.name}
          </h1>
        </div>
      </div>

      <div className="glass p-6 rounded-lg border border-white/10 justify-center flex">
        <ArtistForm initialData={artistData} />
      </div>
    </div>
  );
}
