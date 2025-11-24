'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Album } from "@/types/types";
import { Play } from "lucide-react";
import Image from "next/image";
import { usePlayerStore } from "@/hooks/usePlayerStore";

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
          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
            <div 
              className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-black shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300 hover:scale-110"
              onClick={handlePlay}
            >
              <Play fill="currentColor" className="ml-1 w-6 h-6" />
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-white font-bold truncate text-lg">{album.name}</h3>
          <p className="text-gray-400 text-sm truncate">{album.artistName}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlbumCard;
