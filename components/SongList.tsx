'use client';

import { Song } from "@/types/types";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { formatTime } from "@/lib/utils";
import Image from "next/image";

interface SongListProps {
  songs: Song[];
}

const SongList = ({ songs }: SongListProps) => {
  const { setQueue } = usePlayerStore();

  return (
    <div className="space-y-2">
      {songs.map((song, i) => (
        <div 
          key={i} 
          className="flex items-center p-3 rounded-md hover:bg-white/5 group transition-colors cursor-pointer"
          onClick={() => setQueue(songs, i)}
        >
          <span className="w-8 text-center text-gray-500 group-hover:text-white">{i + 1}</span>
          <div className="relative w-10 h-10 bg-gray-800 mr-4 rounded overflow-hidden shrink-0">
             {song.coverArt && <Image src={song.coverArt} alt={song.title || "Song"} fill className="object-cover" />}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-white font-medium truncate">{song.title}</h4>
            <p className="text-gray-400 text-sm truncate">{song.artist}</p>
          </div>
          <span className="text-gray-500 text-sm ml-4">{formatTime(song.duration)}</span>
        </div>
      ))}
    </div>
  );
};

export default SongList;
