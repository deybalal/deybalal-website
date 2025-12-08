"use client";

import { useState, useTransition, useEffect } from "react";
import { Search, X, Music, Disc, Mic2, ListMusic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import Image from "next/image";

interface SearchInterfaceProps {
  onClose?: () => void;
  isPage?: boolean;
}

type SearchResults = {
  songs: {
    id: string;
    title: string;
    artist: string;
    coverArt: string | null;
    slug: string;
  }[];
  artists: {
    name: string;
    image: string | null;
  }[];
  albums: {
    id: string;
    name: string;
    artistName: string;
    coverArt: string | null;
  }[];
  playlists: {
    id: string;
    name: string;
    coverArt: string | null;
  }[];
};

export default function SearchInterface({
  onClose,
  isPage = false,
}: SearchInterfaceProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isPending, startTransition] = useTransition();
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search
  useEffect(() => {
    if (debouncedQuery.trim() === "") {
      setResults(null);
      return;
    }

    startTransition(async () => {
      setIsLoading(true);

      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: debouncedQuery }),
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        } else {
          console.error("Search failed");
          setResults(null);
        }
      } catch (error) {
        console.error("Search error", error);
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    });
  }, [debouncedQuery]);

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex flex-col h-full w-full text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Search Header */}
      <div className="flex flex-col items-center py-8 sm:py-12 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-transparent bg-clip-text bg-linear-to-r from-white to-zinc-400 tracking-tight">
          Search
        </h1>
        <div className="w-full max-w-3xl relative group">
          <div className="absolute -inset-0.5 bg-linear-to-r from-indigo-500 to-purple-600 rounded-full opacity-30 group-hover:opacity-75 blur transition duration-500"></div>
          <div className="relative flex items-center bg-zinc-900/90 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
            <Search className="w-6 h-6 text-zinc-400 ml-6" />
            <Input
              placeholder="Songs, artists, albums..."
              className="flex-1 py-6 px-4 border-none bg-transparent! focus-visible:ring-0 text-lg sm:text-xl placeholder:text-zinc-500 font-medium tracking-tight h-14 sm:h-16"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults(null);
                }}
                className="mr-4 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="pb-24">
            {query.trim() !== "" &&
            (isPending || isLoading || query !== debouncedQuery) ? (
              <div className="space-y-12 animate-pulse max-w-6xl mx-auto">
                {/* Songs Skeleton */}
                <section>
                  <div className="h-8 w-32 bg-white/10 rounded mb-6" />
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center p-3 rounded-xl bg-white/5"
                      >
                        <div className="w-14 h-14 rounded-lg bg-white/10 mr-4" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-48 bg-white/10 rounded" />
                          <div className="h-3 w-32 bg-white/10 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Artists Skeleton */}
                <section>
                  <div className="h-8 w-32 bg-white/10 rounded mb-6" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full bg-white/10 mb-4" />
                        <div className="h-4 w-24 bg-white/10 rounded" />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : query.trim() !== "" &&
              results &&
              results.songs.length === 0 &&
              results.artists.length === 0 &&
              results.albums.length === 0 &&
              results.playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-zinc-400 animate-in fade-in zoom-in duration-300">
                <p className="text-xl font-medium text-white mb-2">
                  No results found for &quot;{query}&quot;
                </p>
                <p className="text-zinc-500">
                  Try searching for something else.
                </p>
              </div>
            ) : !results || query.trim() === "" ? (
              <div className="flex flex-col items-center justify-center h-80 text-zinc-500 gap-6 animate-in fade-in duration-500">
                <div className="p-8 rounded-full bg-white/5 ring-1 ring-white/10 shadow-2xl">
                  <Search className="w-12 h-12 opacity-40" />
                </div>
                <div className="text-center">
                  <p className="text-xl font-medium text-white mb-2">
                    Play what you love
                  </p>
                  <p className="text-base max-w-md mx-auto">
                    Search for songs, artists, albums, and playlists to start
                    listening.
                  </p>
                </div>
              </div>
            ) : results ? (
              <div className="space-y-12 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Songs Section */}
                {results.songs.length > 0 && (
                  <section>
                    <h3 className="text-2xl font-bold text-white mb-6 tracking-tight flex items-center">
                      <Music className="w-6 h-6 mr-3 text-indigo-400" />
                      Songs
                    </h3>
                    <div className="space-y-2">
                      {results.songs.map((song) => (
                        <Link
                          key={song.id}
                          href={`/song/${song.id}`}
                          onClick={handleLinkClick}
                          className="flex items-center p-3 rounded-xl hover:bg-white/10 transition-all duration-200 group border border-transparent hover:border-white/5"
                        >
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden mr-4 shadow-lg bg-zinc-800 shrink-0 group-hover:scale-105 transition-transform duration-300">
                            {song.coverArt ? (
                              <Image
                                src={song.coverArt}
                                alt={song.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="w-6 h-6 text-zinc-500" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                              <Music className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate text-lg group-hover:text-indigo-400 transition-colors">
                              {song.title}
                            </div>
                            <div className="text-sm text-zinc-400 truncate">
                              {song.artist}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Artists Section */}
                {results.artists.length > 0 && (
                  <section>
                    <h3 className="text-2xl font-bold text-white mb-6 tracking-tight flex items-center">
                      <Mic2 className="w-6 h-6 mr-3 text-purple-400" />
                      Artists
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {results.artists.map((artist) => (
                        <Link
                          key={artist.name}
                          href={`/artist/${encodeURIComponent(artist.name)}`}
                          onClick={handleLinkClick}
                          className="group flex flex-col items-center p-4 rounded-2xl hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-white/5"
                        >
                          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden mb-4 shadow-xl group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300 bg-zinc-800 ring-2 ring-transparent group-hover:ring-purple-500/50">
                            {artist.image ? (
                              <Image
                                src={artist.image}
                                alt={artist.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Mic2 className="w-12 h-12 text-zinc-500" />
                              </div>
                            )}
                          </div>
                          <div className="text-white font-bold truncate w-full text-center text-lg group-hover:text-purple-400 transition-colors">
                            {artist.name}
                          </div>
                          <div className="text-sm text-zinc-400 mt-1">
                            Artist
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Albums Section */}
                {results.albums.length > 0 && (
                  <section>
                    <h3 className="text-2xl font-bold text-white mb-6 tracking-tight flex items-center">
                      <Disc className="w-6 h-6 mr-3 text-pink-400" />
                      Albums
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {results.albums.map((album) => (
                        <Link
                          key={album.id}
                          href={`/album/${album.id}`}
                          onClick={handleLinkClick}
                          className="group p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                          <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 shadow-lg group-hover:shadow-2xl transition-all bg-zinc-800">
                            {album.coverArt ? (
                              <Image
                                src={album.coverArt}
                                alt={album.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Disc className="w-12 h-12 text-zinc-500" />
                              </div>
                            )}
                          </div>
                          <div className="text-white font-bold truncate text-base group-hover:text-pink-400 transition-colors">
                            {album.name}
                          </div>
                          <div className="text-sm text-zinc-400 truncate mt-1">
                            {album.artistName}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Playlists Section */}
                {results.playlists.length > 0 && (
                  <section>
                    <h3 className="text-2xl font-bold text-white mb-6 tracking-tight flex items-center">
                      <ListMusic className="w-6 h-6 mr-3 text-emerald-400" />
                      Playlists
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {results.playlists.map((playlist) => (
                        <Link
                          key={playlist.id}
                          href={`/playlist/${playlist.id}`}
                          onClick={handleLinkClick}
                          className="group p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                          <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 shadow-lg group-hover:shadow-2xl transition-all bg-zinc-800">
                            {playlist.coverArt ? (
                              <Image
                                src={playlist.coverArt}
                                alt={playlist.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ListMusic className="w-12 h-12 text-zinc-500" />
                              </div>
                            )}
                          </div>
                          <div className="text-white font-bold truncate text-base group-hover:text-emerald-400 transition-colors">
                            {playlist.name}
                          </div>
                          <div className="text-sm text-zinc-400 mt-1">
                            By {playlist.name}{" "}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
