"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ListPlus, Loader2, Music } from "lucide-react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Playlist } from "@/types/types";

interface AddToPlaylistDialogProps {
  songId: string;
  trigger?: React.ReactNode;
}

export default function AddToPlaylistDialog({
  songId,
  trigger,
}: AddToPlaylistDialogProps) {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPlaylists();
    }
  }, [open]);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/playlists");
      const data = await res.json();
      if (data.success) {
        setPlaylists(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch playlists", error);
      toast.error("Failed to load playlists");
    } finally {
      setLoading(false);
    }
  };

  const addToPlaylist = async (playlistId: string) => {
    setAddingId(playlistId);
    try {
      const res = await fetch(`/api/playlists/${playlistId}/add-song`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Added to playlist");
        setOpen(false);
      } else {
        toast.error(result.message || "Failed to add to playlist");
      }
    } catch (error) {
      console.error("Failed to add to playlist", error);
      toast.error("Failed to add to playlist");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="border-accent text-accent-foreground hover:bg-accent hover:text-white/30 cursor-pointer"
          >
            <ListPlus size={33} className="size-full" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No playlists found. Create one first!
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => addToPlaylist(playlist.id)}
                    disabled={addingId === playlist.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors group text-left"
                  >
                    <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {playlist.coverArt ? (
                        <Image
                          src={playlist.coverArt}
                          alt={playlist.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Music className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate group-hover:text-accent transition-colors">
                        {playlist.name}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {playlist.songs?.length || 0} songs
                      </p>
                    </div>
                    {addingId === playlist.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
