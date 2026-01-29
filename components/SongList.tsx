"use client";

import { Song } from "@/types/types";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { formatTime, formatPlayCount } from "@/lib/utils";
import Image from "next/image";
import {
  Trash2,
  MoreHorizontal,
  Play,
  ListPlus,
  PlayCircle,
  Music,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import AddToPlaylistDialog from "./AddToPlaylistDialog";
import { toast } from "react-hot-toast";

interface SongListProps {
  songs: Song[];
  onRemove?: (songId: string) => void;
  showArtist?: boolean;
  showAlbum?: boolean;
}

const SongList = ({
  songs,
  onRemove,
  showArtist = true,
  showAlbum = true,
}: SongListProps) => {
  const { setQueue, playNext, addToQueue, currentSong, isPlaying } =
    usePlayerStore();

  return (
    <div className="space-y-1">
      {songs.map((song, i) => {
        const isCurrent = currentSong?.id === song.id;
        return (
          <div
            key={song.id + i}
            className="flex items-center p-2 rounded-xl hover:bg-white/5 group transition-all duration-200 cursor-pointer border border-transparent hover:border-white/5"
            onClick={() => setQueue(songs, i)}
          >
            <div className="w-10 flex items-center justify-center shrink-0">
              {isCurrent && isPlaying ? (
                <div className="flex items-center gap-0.5 h-3">
                  <div className="w-0.5 h-full bg-primary animate-bounce animation-duration-[0.6s]" />
                  <div className="w-0.5 h-full bg-primary animate-bounce animation-duration-[0.8s]" />
                  <div className="w-0.5 h-full bg-primary animate-bounce animation-duration-[0.7s]" />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground group-hover:hidden">
                  {i + 1}
                </span>
              )}
              <Play
                size={14}
                className="hidden group-hover:block text-primary fill-primary"
              />
            </div>

            <div className="relative w-12 h-12 bg-white/5 rounded-lg overflow-hidden shrink-0 mx-3 border border-white/5">
              {song.coverArt ? (
                <Image
                  src={song.coverArt}
                  alt={song.title || "Song"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-muted-foreground/50" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4
                className={`text-sm font-semibold truncate ${
                  isCurrent ? "text-primary" : "text-foreground"
                }`}
              >
                {song.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                {showArtist && (
                  <span className="truncate hover:text-foreground transition-colors">
                    {song.artist}
                  </span>
                )}
                {showArtist && showAlbum && song.album && (
                  <span className="shrink-0">•</span>
                )}
                {showAlbum && song.album && (
                  <span className="truncate hover:text-foreground transition-colors">
                    {song.album}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 ms-4">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatTime(song.duration)}
                </span>
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <Play size={10} className="fill-current" />
                  {formatPlayCount(song.playCount)}
                </span>
              </div>

              <div className="flex items-center md:opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-white/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setQueue(songs, i)}>
                      <PlayCircle className="ml-2 h-4 w-4" />
                      پخش
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        playNext(song);
                        toast.success("بعدی پخش می شود");
                      }}
                    >
                      <PlayCircle className="ml-2 h-4 w-4" />
                      پخش بعدی
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        addToQueue(song);
                        toast.success("به صف اضافه شد");
                      }}
                    >
                      <ListPlus className="ml-2 h-4 w-4" />
                      افزودن به صف
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AddToPlaylistDialog
                      songId={song.id}
                      trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <ListPlus className="ml-2 h-4 w-4" />
                          افزودن به پلی لیست
                        </DropdownMenuItem>
                      }
                    />
                    {onRemove && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(song.id);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="ml-2 h-4 w-4" />
                          حذف از پلی لیست
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SongList;
