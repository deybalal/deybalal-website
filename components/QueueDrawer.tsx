"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ListMusic, X } from "lucide-react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import Image from "next/image";

export default function QueueDrawer() {
  const { queue, priorityQueue, currentSong, currentIndex, removeFromQueue } =
    usePlayerStore();

  // Calculate "Next from Playlist" (Original Queue)
  const nextFromPlaylist = queue.slice(currentIndex + 1);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-white"
        >
          <ListMusic className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-8/12 sm:w-[400px] overflow-y-auto "
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-left">صف پخش</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Now Playing */}
          {currentSong && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                در حال پخش
              </h3>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/10 border border-accent/20">
                <div className="relative w-12 h-12 rounded overflow-hidden shrink-0">
                  <Image
                    src={
                      currentSong.coverArt || "/images/default-album-art.png"
                    }
                    alt={currentSong.title || "Song"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {currentSong.title}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {currentSong.artist}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Queue (Priority) */}
          {priorityQueue.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                بعدی در صف
              </h3>
              <div className="space-y-2">
                {priorityQueue.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/5 group"
                  >
                    <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                      <Image
                        src={song.coverArt || "/images/default-album-art.png"}
                        alt={song.title || "Song"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">
                        {song.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {song.artist}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-8 w-8"
                      onClick={() => removeFromQueue(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Original Playlist Queue */}
          {nextFromPlaylist.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                بعدی از: پلی لیست
              </h3>
              <div className="space-y-2">
                {nextFromPlaylist.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/5 cursor-pointer"
                  >
                    <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                      <Image
                        src={song.coverArt || "/images/default-album-art.png"}
                        alt={song.title || "Song"}
                        fill
                        className="object-cover opacity-60"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm text-muted-foreground">
                        {song.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {song.artist}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
