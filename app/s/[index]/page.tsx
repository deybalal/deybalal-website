import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

interface ShortLinkPageProps {
  params: Promise<{
    index: string;
  }>;
}

export default async function ShortLinkPage({ params }: ShortLinkPageProps) {
  const { index } = await params;

  const songIndex = parseInt(index, 10);

  if (isNaN(songIndex)) {
    return notFound();
  }

  const song = await prisma.song.findUnique({
    where: {
      index: songIndex,
    },
    select: {
      id: true,
    },
  });

  if (!song) {
    return notFound();
  }

  // Redirect to the song page
  return redirect(`/song/${song.id}`);
}
