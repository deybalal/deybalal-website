"use client";

import { Song } from "@/types/types";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { formatTime } from "@/lib/utils";
import Image from "next/image";

interface SongListProps {
  songs: Song[];
  onRemove?: (songId: string) => void;
}

import { Trash2, MoreHorizontal, Play } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SongList = ({ songs, onRemove }: SongListProps) => {
  const { setQueue } = usePlayerStore();

  return (
    <div className="space-y-2">
      {songs.map((song, i) => (
        <div
          key={i}
          className="flex items-center p-3 rounded-md hover:bg-foreground/5 group transition-colors cursor-pointer"
          onClick={() => setQueue(songs, i)}
        >
          <span className="w-8 text-center text-gray-500 group-hover:text-destructive transition-transform duration-1000">
            {i + 1}
          </span>
          <div className="relative w-10 h-10 bg-gray-800 me-4 rounded overflow-hidden shrink-0">
            {song.coverArt && (
              <Image
                src={song.coverArt}
                alt={song.title || "Song"}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-foreground font-medium truncate">
              {song.title}
            </h4>
            <p className="text-gray-400 text-sm truncate">{song.artist}</p>
          </div>
          <span className="text-gray-500 text-sm ms-4">
            {formatTime(song.duration)}
          </span>
          {onRemove && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ms-2 text-muted-foreground hover:text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setQueue(songs, i);
                  }}
                >
                  <Play className="me-2 h-4 w-4" />
                  Play
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(song.id);
                  }}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  Remove from Playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  );
};

export default SongList;
