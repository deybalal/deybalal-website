'use client';

import { useEffect, useState } from 'react';
import SongList from "@/components/SongList";
import { Artist, Song, Album } from "@/types/types";
import { User } from "lucide-react";
import AlbumCard from "@/components/AlbumCard";

export default function ArtistDetailPage({ params }: { params: { id: string } }) {
  const [artistName, setArtistName] = useState<string>('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const decodedName = decodeURIComponent(params.id);
        setArtistName(decodedName);

        // Fetch Songs
        const songsRes = await fetch('/api/songs');
        if (songsRes.ok) {
          const result = await songsRes.json();
          if (result.success) {
            const artistSongs = result.data.filter((s: Song) => s.artist === decodedName);
            setSongs(artistSongs);
          }
        }

        // Fetch Albums
        const albumsRes = await fetch('/api/albums', { method: 'POST' });
        if (albumsRes.ok) {
          const result = await albumsRes.json();
          if (result.success) {
            const artistAlbums = result.data.filter((a: Album) => a.artistName === decodedName);
            setAlbums(artistAlbums);
          }
        }
      } catch (error) {
        console.error('Failed to fetch artist data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col items-center md:items-start gap-6">
        <div className="w-48 h-48 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden shadow-2xl neon-box">
           <User size={64} className="text-gray-500" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-bold text-white neon-text mb-4">{artistName}</h1>
          <p className="text-gray-400 text-lg">{songs.length} Songs • {albums.length} Albums</p>
        </div>
      </div>

      {/* Popular Songs */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Songs</h2>
        {songs.length > 0 ? (
          <SongList songs={songs} />
        ) : (
          <p className="text-gray-500">No songs found for this artist.</p>
        )}
      </section>

      {/* Albums */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Discography</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {albums.length > 0 ? (
            albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))
          ) : (
            <p className="text-gray-500 col-span-full">No albums found for this artist.</p>
          )}
        </div>
      </section>
    </div>
  );
}
