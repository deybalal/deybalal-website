"use client";

import { usePlayerStore } from "@/hooks/usePlayerStore";
import { ArrowBigUpIcon, ListPlus, Mic2, PlayCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Artist } from "@/types/types";
import AddToPlaylistDialog from "./AddToPlaylistDialog";

interface SongCardContextMenuProps {
  songId: string;
  artists: Artist[];
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
  artists,
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

  const router = useRouter();

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
      <ContextMenuContent className="rtl">
        <ContextMenuItem>
          <Link
            href={`/song/${songId}`}
            className="flex items-center flex-row hover:scale-105"
          >
            <ArrowBigUpIcon className="w-4 h-4 me-2" />
            نمایش آهنگ
          </Link>
        </ContextMenuItem>
        <ContextMenuItem className="cursor-pointer hover:scale-105">
          <Link
            href={`/artist/${artists[0].id}`}
            className="flex items-center flex-row hover:scale-105"
          >
            <Mic2 className="w-4 h-4 me-2" />
            نمایش خواننده
          </Link>
        </ContextMenuItem>
        {albumId && (
          <ContextMenuItem className="cursor-pointer hover:scale-105">
            <Link
              href={`/album/${albumId}`}
              className="flex items-center flex-row hover:scale-105"
            >
              <Mic2 className="w-4 h-4 me-2" />
              نمایش آلبوم
            </Link>
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          className="cursor-pointer hover:scale-105"
          onClick={() => {
            setSong(song);
            toast.success("در حال پخش...");
          }}
        >
          <PlayCircle className="w-4 h-4 me-2" />
          پخش
        </ContextMenuItem>
        <ContextMenuItem
          className="cursor-pointer hover:scale-105"
          onClick={() => {
            playNext(song);
            toast.success("بعدی پخش می شود");
          }}
        >
          <PlayCircle className="w-4 h-4 me-2" />
          پخش بعدی
        </ContextMenuItem>
        <ContextMenuItem
          className="cursor-pointer hover:scale-105"
          onClick={() => {
            addToQueue(song);
            toast.success("به صف اضافه شد");
          }}
        >
          <ListPlus className="w-4 h-4 me-2" />
          افزودن به صف
        </ContextMenuItem>
        <ContextMenuItem asChild className="cursor-pointer hover:scale-105">
          <AddToPlaylistDialog
            songId={song.id}
            trigger={
              <div className="flex items-center cursor-pointer mr-1 text-base">
                <ListPlus className="w-4 h-4 me-2" />
                اضافه به پلی لیست
              </div>
            }
          />
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
