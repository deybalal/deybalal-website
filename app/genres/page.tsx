import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Genres | Music Player",
  description: "Browse music by genre and mood.",
};

export default async function GenresPage() {
  const genres = await prisma.genre.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { songs: true, albums: true },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Genres & Moods</h1>
        <p className="text-muted-foreground text-lg">
          Explore music by your favorite genres and moods.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {genres.map((genre) => (
          <Link
            key={genre.id}
            href={`/genres/${genre.slug}`}
            className="group relative overflow-hidden rounded-xl aspect-square bg-muted/20 hover:bg-muted/30 transition-colors border border-white/5 hover:border-white/10"
          >
            <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
              <h3 className="text-2xl font-bold text-foreground drop-shadow-sm group-hover:scale-105 transition-transform">
                {genre.name}
              </h3>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                {genre._count.songs} Songs • {genre._count.albums} Albums
              </p>
            </div>
          </Link>
        ))}
      </div>

      {genres.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No genres found. Check back later!
        </div>
      )}
    </div>
  );
}
