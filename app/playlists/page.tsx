"use client";

import { useEffect, useState } from "react";
import { Playlist } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  ListMusic,
  Loader2,
  LoaderPinwheel,
  MoreHorizontal,
  Link as LinkIcon,
  Trash2,
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

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch("/api/playlists");
      const data = await res.json();
      if (data.success) {
        setPlaylists(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch playlists", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async (
    playlistId: string,
    playlistName: string
  ) => {
    if (!confirm(`Are you sure you want to delete "${playlistName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (result.success) {
        toast.success("Playlist deleted successfully");
        fetchPlaylists(); // Refresh the list
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

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center">
        <p className=" animate-spin">
          <LoaderPinwheel size={60} />
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white neon-text">Playlists</h1>
        <Button asChild variant="outline">
          <Link
            href="/panel/new/playlist"
            className=" text-foreground px-4 py-2 rounded-md transition-colors"
          >
            Create New
          </Link>
        </Button>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ListMusic className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">No playlists found</p>
          <p className="text-sm mt-2">
            Create your first playlist to get started!
          </p>
        </div>
      ) : (
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
                        <ListMusic
                          size={96}
                          className="text-white opacity-50"
                        />
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
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeletePlaylist(playlist.id, playlist.name);
                      }}
                      className="text-red-500 focus:text-red-500"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove Playlist
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
