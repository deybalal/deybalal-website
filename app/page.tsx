"use client";

import { useEffect, useState } from "react";
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
        const songsRes = await fetch("/api/songs");
        if (songsRes.ok) {
          const result = await songsRes.json();
          if (result.success) {
            setSongs(result.data);
          }
        }

        // Fetch Albums (User changed this to POST)
        const albumsRes = await fetch("/api/albums", { method: "POST" });
        if (albumsRes.ok) {
          const result = await albumsRes.json();
          if (result.success) {
            setAlbums(result.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative h-80 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-900 flex items-center px-12 shadow-2xl neon-box group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent dark:from-black/80 dark:via-black/40" />

        <div className="z-10 max-w-2xl space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/20 text-sm font-medium text-gray-900 dark:text-accent">
            Premium Sound Experience
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tight leading-tight">
            Feel the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-accent dark:to-purple-400 font-extrabold">
              Rhythm
            </span>
          </h1>
          <p className="text-gray-200 dark:text-gray-300 text-xl leading-relaxed max-w-lg">
            Immerse yourself in a world of crystal clear audio and curated
            playlists designed for your every mood.
          </p>
        </div>
      </section>

      {/* Trending Songs */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
          <span className="w-2 h-8 bg-accent mr-3 rounded-full shadow-[0_0_10px_var(--accent)]"></span>
          Trending Songs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {songs.length > 0 ? (
            songs.map((song) => <SongCard key={song.id} song={song} />)
          ) : (
            <p className="text-gray-500 col-span-full">
              No songs found. Add some in the Admin Panel!
            </p>
          )}
        </div>
      </section>

      {/* New Releases */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center">
          <span className="w-2 h-8 bg-purple-500 mr-3 rounded-full shadow-[0_0_10px_purple]"></span>
          New Albums
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {albums.length > 0 ? (
            albums.map((album) => <AlbumCard key={album.id} album={album} />)
          ) : (
            <p className="text-gray-500 col-span-full">
              No albums found. Add some in the Admin Panel!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
