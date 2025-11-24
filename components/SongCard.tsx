'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Song } from "@/types/types";
import { Play } from "lucide-react";
import Image from "next/image";
import { usePlayerStore } from "@/hooks/usePlayerStore";

interface SongCardProps {
  song: Song;
}

const SongCard = ({ song }: SongCardProps) => {
  const { setSong } = usePlayerStore();

  return (
    <Card 
      className="group relative overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 cursor-pointer"
      onClick={() => setSong(song)}
    >
      <CardContent className="p-0 flex items-center">
        <div className="relative w-16 h-16 shrink-0">
          {song.coverArt ? (
            <Image 
              src={song.coverArt} 
              alt={song.title || "Song"} 
              fill 
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-xs text-gray-500">No Art</span>
            </div>
          )}
          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play fill="white" className="text-white w-6 h-6" />
          </div>
        </div>
        <div className="p-3 overflow-hidden">
          <h3 className="text-white font-medium truncate">{song.title || "Unknown Title"}</h3>
          <p className="text-gray-400 text-sm truncate">{song.artist || "Unknown Artist"}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SongCard;
