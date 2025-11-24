'use client';

import { useEffect, useState } from 'react';
import AlbumCard from "@/components/AlbumCard";
import SongCard from "@/components/SongCard";
import { Album, Song } from "@/types/types";

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Songs
        const songsRes = await fetch('/api/songs');
        if (songsRes.ok) {
          const result = await songsRes.json();
          if (result.success) {
            setSongs(result.data);
          }
        }

        // Fetch Albums (User changed this to POST)
        const albumsRes = await fetch('/api/albums', { method: 'POST' });
        if (albumsRes.ok) {
          const result = await albumsRes.json();
          if (result.success) {
            setAlbums(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-secondary flex items-center px-10 shadow-2xl neon-box">
        <div className="z-10">
          <h1 className="text-5xl font-bold text-white mb-2 neon-text">Welcome Back</h1>
          <p className="text-gray-200 text-lg">Discover the sound of the future.</p>
        </div>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
      </section>

      {/* Trending Songs */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="w-2 h-8 bg-accent mr-3 rounded-full shadow-[0_0_10px_var(--accent)]"></span>
          Trending Songs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {songs.length > 0 ? (
            songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))
          ) : (
            <p className="text-gray-500 col-span-full">No songs found. Add some in the Admin Panel!</p>
          )}
        </div>
      </section>

      {/* New Releases */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="w-2 h-8 bg-purple-500 mr-3 rounded-full shadow-[0_0_10px_purple]"></span>
          New Albums
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {albums.length > 0 ? (
            albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))
          ) : (
            <p className="text-gray-500 col-span-full">No albums found. Add some in the Admin Panel!</p>
          )}
        </div>
      </section>
    </div>
  );
}
