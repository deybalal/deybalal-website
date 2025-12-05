"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Album } from "@/types/types";
import { Play } from "lucide-react";
import Image from "next/image";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import Link from "next/link";

interface AlbumCardProps {
  album: Album;
}

const AlbumCard = ({ album }: AlbumCardProps) => {
  const { setQueue } = usePlayerStore();

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation if we wrap card in Link later
    if (album.songs && album.songs.length > 0) {
      setQueue(album.songs);
    }
  };

  return (
    <Card className="group relative overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer w-full">
      <CardContent className="p-4">
        <Link href={`/album/${album.id}`} className="">
          <div className="relative aspect-square w-full mb-4 rounded-md overflow-hidden shadow-lg">
            {album.coverArt ? (
              <Image
                src={album.coverArt}
                alt={album.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <span className="text-gray-500">No Art</span>
              </div>
            )}
          </div>
        </Link>
        <div>
          <h3 className="text-foreground font-bold truncate text-lg">
            {album.name}
          </h3>
          <p className="text-gray-400 text-sm truncate">{album.artistName}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlbumCard;
