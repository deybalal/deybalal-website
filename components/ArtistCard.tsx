"use client";
import { Artist } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

interface ArtistCardProps {
  artist: Artist;
}

const ArtistCard = ({ artist }: ArtistCardProps) => {
  return (
    <Link href={`/artist/${artist.id}`} className="block group w-full">
      <div className="flex flex-col items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all duration-300">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300 border-2 border-transparent group-hover:border-purple-500/50">
          {artist.image ? (
            <Image
              src={artist.image}
              alt={artist.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">
                {artist.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="text-center">
          <h3 className="text-foreground font-bold truncate text-lg group-hover:text-purple-400 transition-colors">
            {artist.name}
          </h3>
          <p className="text-gray-400 text-sm">خواننده</p>
        </div>
      </div>
    </Link>
  );
};

export default ArtistCard;
