"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { Song, Artist, Album, Playlist } from "@prisma/client";
import { Song as PlayerSong } from "@/types/types";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { authClient } from "@/lib/auth-client";
import { toast } from "react-hot-toast";
import { useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const SongActionsCell = ({ row }: { row: Row<Song> }) => {
  const song = row.original;
  const { setSong } = usePlayerStore();
  const { data: session } = authClient.useSession();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const userRole = (session?.user as { role?: string })?.role;
  const canApprove = userRole === "moderator" || userRole === "administrator";

  const toggleActive = async () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/songs/${song.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !song.isActive,
          }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success(
            `Song ${song.isActive ? "deactivated" : "approved"} successfully`
          );
          router.refresh();
        } else {
          toast.error(result.message || "Failed to update song status");
        }
      } catch (error) {
        console.error("Error updating song status:", error);
        toast.error("An error occurred while updating song status");
      }
    });
  };

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
          <Link href={`/panel/edit/lyrics/${song.id}`} className="w-full">
            Edit Lyrics
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={`/panel/edit/sync/${song.id}`} className="w-full">
            Sync Lyrics
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={`/panel/edit/synced/${song.id}`} className="w-full">
            Edit Synced Lyrics
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {canApprove && (
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={toggleActive}
            disabled={isPending}
          >
            {song.isActive ? "Deactivate Song" : "Approve Song"}
          </DropdownMenuItem>
        )}
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

export const songColumns: ColumnDef<Song>[] = [
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
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return (
        <div className="flex items-center gap-2">
          {isActive ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-sm font-medium">
            {isActive ? "Active" : "Pending"}
          </span>
        </div>
      );
    },
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
    cell: ({ row }) => <SongActionsCell row={row} />,
  },
];

export const artistColumns: ColumnDef<Artist>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "nameEn",
    header: "English Name",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </div>
      );
    },
  },
];

export const albumColumns: ColumnDef<Album>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "artistName",
    header: "Artist",
  },
  {
    accessorKey: "releaseDate",
    header: "Release Year",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </div>
      );
    },
  },
];

export const playlistColumns: ColumnDef<Playlist>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "isFavorite",
    header: "Favorite",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("isFavorite") ? "Yes" : "No"}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {new Date(row.getValue("createdAt")).toLocaleDateString()}
        </div>
      );
    },
  },
];

// Keep for backward compatibility if needed, but we should switch to songColumns
export const columns = songColumns;
