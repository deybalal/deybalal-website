"use client";

import { useState } from "react";
import { Playlist } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  ListMusic,
  MoreHorizontal,
  Link as LinkIcon,
  Trash2,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PlaylistGridProps {
  initialPlaylists: Playlist[];
}

export default function PlaylistGrid({ initialPlaylists }: PlaylistGridProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists);
  const router = useRouter();

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (result.success) {
        toast.success("Playlist deleted successfully");
        setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
        router.refresh(); // Refresh server data
      } else {
        toast.error(result.message || "Failed to delete playlist");
      }
    } catch (error) {
      console.error("Failed to delete playlist", error);
      toast.error("Failed to delete playlist");
    }
  };

  const handleCopyLink = (playlistId: string) => {
    const url = `${window.location.origin}/playlists/${playlistId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  if (playlists.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground size-full min-h-[40dvh] flex justify-center items-center flex-col">
        <ListMusic className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p className="text-xl">No playlists found</p>
        <p className="text-sm mt-2">
          Create your first playlist to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {playlists.map((playlist) => (
        <div key={playlist.id} className="relative group">
          <Link href={`/playlists/${playlist.id}`}>
            <Card className="w-48 md:w-64 pb-4 relative overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-4 pb-2">
                <div className="aspect-square w-full mb-4 rounded-md bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500 relative overflow-hidden">
                  {playlist.coverArt ? (
                    <Image
                      src={playlist.coverArt}
                      alt={playlist.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <ListMusic size={96} className="text-white opacity-50" />
                  )}
                  {/* Favorites Badge */}
                  {playlist.isFavorite && (
                    <div className="absolute top-2 left-2 bg-yellow-500/90 backdrop-blur-sm rounded-full p-1.5">
                      <Star size={16} className="text-white fill-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-foreground font-bold truncate text-lg">
                    {playlist.name}
                  </h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-muted-foreground text-sm truncate">
                      {playlist.songs?.length || 0} songs
                    </p>
                  </div>
                  {playlist.duration > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formatTime(playlist.duration)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Three dots menu - visible on mobile, on hover for desktop */}
          <div className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    handleCopyLink(playlist.id);
                  }}
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Copy Link
                </DropdownMenuItem>
                {!playlist.isFavorite && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 p-2 w-full cursor-pointer transition-opacity text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Playlist
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Delete Playlist</DialogTitle>
                        <DialogDescription>
                          This cannot be undone!
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4">
                        Are you sure you want to delete this Playlist?
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                          onClick={() => handleDeletePlaylist(playlist.id)}
                          className="bg-red-600 hover:bg-red-400 hover:text-foreground cursor-pointer"
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}
