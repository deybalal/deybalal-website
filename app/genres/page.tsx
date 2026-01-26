import Pagination from "@/components/Pagination";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "سبک ها",
  description: "آهنگ ها یا آلبوم های سبک موردعلاقه ی خود را پیدا کنید.",
};

export default async function GenresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 20;

  const genres = await prisma.genre.findMany({
    orderBy: { name: "asc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      _count: {
        select: { songs: true, albums: true },
      },
    },
  });

  const totalGenres = await prisma.genre.count();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">سبک ها</h1>
        <p className="text-muted-foreground text-lg">
          آهنگ ها یا آلبوم های سبک موردعلاقه ی خود را پیدا کنید.
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
                {genre._count.songs} آهنگ • {genre._count.albums} آلبوم
              </p>
            </div>
          </Link>
        ))}
      </div>

      {genres.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          فعلا هیچ سبکی ساخته نشده !
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(totalGenres / pageSize)}
      />
    </div>
  );
}
