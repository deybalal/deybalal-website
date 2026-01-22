"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Genre } from "@prisma/client";
import Link from "next/link";

interface GenreCardProps {
  genre: Genre & { _count?: { songs: number } };
  color?: string;
}

const GenreCard = ({ genre, color = "bg-purple-500" }: GenreCardProps) => {
  return (
    <Link href={`/genres/${genre.slug}`} className="block group w-full">
      <Card className="relative overflow-hidden h-32 border-0 transition-all duration-300 hover:scale-105 hover:shadow-xl group-hover:shadow-purple-500/20">
        <div
          className={`absolute inset-0 ${color} opacity-80 group-hover:opacity-100 transition-opacity`}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />

        <CardContent className="relative h-full flex flex-col justify-end p-6">
          <h3 className="text-2xl font-bold text-white mb-1 group-hover:translate-s-1 transition-transform">
            {genre.name}
          </h3>
          {genre._count && (
            <p className="text-white/80 text-sm font-medium">
              {genre._count.songs} Songs
            </p>
          )}
        </CardContent>

        {/* Decorative Circle */}
        <div className="absolute -top-4 -end-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
      </Card>
    </Link>
  );
};

export default GenreCard;
