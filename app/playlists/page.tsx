"use client";

import { useEffect, useState } from "react";
import { Playlist } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { ListMusic, Loader2, Music } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatTime } from "@/lib/utils";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white neon-text">Playlists</h1>
        <Link
          href="/panel/new/playlist"
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md transition-colors"
        >
          Create New
        </Link>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {playlists.map((playlist) => (
            <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
              <Card className="group relative overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="aspect-square w-full mb-4 rounded-md bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500 relative overflow-hidden">
                    {playlist.coverArt ? (
                      <Image
                        src={playlist.coverArt}
                        alt={playlist.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <ListMusic size={48} className="text-white opacity-50" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold truncate text-lg">
                      {playlist.name}
                    </h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-gray-400 text-sm truncate">
                        {playlist.songs?.length || 0} songs
                      </p>
                      {playlist.duration > 0 && (
                        <p className="text-xs text-gray-500">
                          {formatTime(playlist.duration)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
