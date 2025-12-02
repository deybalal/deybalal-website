"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { Song } from "@prisma/client";
import { Song as PlayerSong } from "@/types/types";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlayerStore } from "@/hooks/usePlayerStore";

const ActionsCell = ({ row }: { row: Row<Song> }) => {
  const song = row.original;
  const { setSong } = usePlayerStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Link href={`/panel/edit/${song.id}`} className="w-full">
            Edit Song
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={`/panel/lyrics/${song.id}`} className="w-full">
            Edit Lyrics
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => setSong(song as unknown as PlayerSong)}
        >
          Play Song
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={`/song/${song.id}`} className="w-full">
            Show Song Page
          </Link>
        </DropdownMenuItem>
        {song.artistId && (
          <DropdownMenuItem>
            <Link href={`/artist/${song.artistId}`} className="w-full">
              Show Artist
            </Link>
          </DropdownMenuItem>
        )}
        {song.albumId && (
          <DropdownMenuItem>
            <Link href={`/album/${song.albumId}`} className="w-full">
              Show Album
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<Song>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "artist",
    header: "Artist",
  },
  {
    accessorKey: "albumName",
    header: "Album",
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const duration = parseFloat(row.getValue("duration"));
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return (
        <div className="font-medium">{`${minutes}:${seconds
          .toString()
          .padStart(2, "0")}`}</div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
