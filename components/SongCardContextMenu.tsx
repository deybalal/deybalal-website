"use client";

import { usePlayerStore } from "@/hooks/usePlayerStore";
import { ListPlus, PlayCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface SongCardContextMenuProps {
  songId: string;
  title: string;
  titleEn: string | null;
  uri: string;
  filename: string;
  index: number;
  duration: number;
  coverArt: string | null;
  artist: string;
  album: string | null;
  playCount: number;
  albumId: string | null;
  year: string;
  links: Record<number, { url: string; size: string; bytes: number }> | null;
  children: React.ReactNode;
}

export default function SongCardContextMenu({
  songId,
  title,
  titleEn,
  uri,
  filename,
  index,
  duration,
  coverArt,
  artist,
  album,
  playCount,
  albumId,
  year,
  links,
  children,
}: SongCardContextMenuProps) {
  const { setSong, addToQueue, playNext } = usePlayerStore();

  const song = {
    id: songId,
    title: title as string | undefined,
    titleEn: titleEn as string | undefined,
    uri,
    filename,
    index,
    duration,
    coverArt,
    artist,
    album,
    playCount,
    albumId,
    year: year as string | null,
    links,
    artists: [],
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            setSong(song);
            toast.success("در حال پخش...");
          }}
        >
          <PlayCircle className="w-4 h-4 me-2" />
          پخش
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            playNext(song);
            toast.success("بعدی پخش می شود");
          }}
        >
          <PlayCircle className="w-4 h-4 me-2" />
          پخش بعدی
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            addToQueue(song);
            toast.success("به صف اضافه شد");
          }}
        >
          <ListPlus className="w-4 h-4 me-2" />
          افزودن به صف
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
