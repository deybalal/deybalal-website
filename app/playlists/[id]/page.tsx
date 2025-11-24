'use client';

import { useEffect, useState } from 'react';
import SongList from "@/components/SongList";
import { Playlist } from "@/types/types";
import { ListMusic } from "lucide-react";

export default function PlaylistDetailPage({ params }: { params: { id: string } }) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const res = await fetch('/api/playlists');
        if (res.ok) {
          const result = await res.json();
          // Check if result is array (old format) or object with data (new format if user updated it, but user didn't update GET playlists yet, wait user updated api/playlists/route.ts? No, user updated api/playlists/create/route.ts. The GET route is still returning array directly in my view_file output step 760. Wait, step 760 shows it returns NextResponse.json(playlists). So it is an array. BUT, I should check if the user updated it in step 715. Step 715 shows user updated api/playlists/route.ts to import { prisma } from '@/lib/prisma'. It didn't change the return format. So it returns an array directly. Wait, I should be careful. If I assume it returns {success: true, data: ...} and it returns array, it will break.
          // Let's re-read step 760 carefully.
          // 14:     return NextResponse.json(playlists);
          // It returns the array directly.
          // However, the user updated api/songs/route.ts to return { success: true, data: songs }.
          // And api/albums/route.ts to return { success: true, data: albums }.
          // Did user update api/playlists/route.ts to return { success: true, data: ... }?
          // Step 715 shows only import change.
          // Step 760 shows content. Line 14: return NextResponse.json(playlists);
          // So it returns array directly.
          // BUT, to be safe and consistent, I should probably update api/playlists/route.ts to match the others, OR handle both.
          // Actually, I'll just handle what is there. It returns array.
          // WAIT, I should probably standardize it. But I don't want to touch backend if I don't have to.
          // I will handle it as array for now.
          
          // Actually, looking at step 713, user updated api/songs/route.ts.
          // Step 712, user updated api/albums/route.ts.
          // Step 715, user updated api/playlists/route.ts.
          // In step 715 diff, it shows:
          // -import prisma from '@/lib/prisma';
          // +import { prisma } from '@/lib/prisma';
          // It DOES NOT show changing the return format.
          // So api/playlists returns an array.
          
          setPlaylist((Array.isArray(result) ? result : result.data).find((p: Playlist) => p.id === params.id) || null);
        }
      } catch (error) {
        console.error('Failed to fetch playlist', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [params.id]);

  if (loading) return <div className="text-white">Loading...</div>;
  if (!playlist) return <div className="text-white">Playlist not found</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-end">
        <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-2xl neon-box shrink-0 bg-gradient-to-br from-primary to-accent flex items-center justify-center">
           {playlist.coverArt ? (
             <img src={playlist.coverArt} alt={playlist.name} className="w-full h-full object-cover" />
           ) : (
             <ListMusic size={80} className="text-white opacity-50" />
           )}
        </div>
        <div className="flex flex-col gap-2 pb-2">
          <span className="text-accent uppercase tracking-widest text-sm font-bold">Playlist</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white neon-text">{playlist.name}</h1>
          <p className="text-gray-300 text-lg max-w-2xl">{playlist.description}</p>
          <div className="flex items-center gap-2 text-gray-400 mt-2">
            <span>{playlist.songs?.length || 0} songs</span>
            <span>•</span>
            <span>1 hr 30 min</span>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <SongList songs={playlist.songs || []} />
    </div>
  );
}
