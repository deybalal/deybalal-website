"use client";

import { useState, useTransition, useEffect } from "react";
import { Search, X, Music, Disc, Mic2, ListMusic } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { search, type SearchResults } from "@/actions/search"; // Removed
import Link from "next/link";
import Image from "next/image";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isPending, startTransition] = useTransition();
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 1000);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search
  useEffect(() => {
    if (debouncedQuery.trim() === "") {
      setResults(null);
      return;
    }

    startTransition(async () => {
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
      }
    });
  }, [debouncedQuery]);

  const handleClose = () => {
    setQuery("");
    setResults(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[850px] bg-zinc-950/95 backdrop-blur-2xl border-white/10 p-0 gap-0 overflow-hidden shadow-2xl text-white">
        <VisuallyHidden>
          <DialogTitle>Search</DialogTitle>
        </VisuallyHidden>

        {/* Search Header */}
        <div className="flex items-center px-6 py-6 border-b border-white/10 bg-white/5">
          <Search className="w-6 h-6 text-zinc-400 mr-4" />
          <Input
            placeholder="What do you want to listen to?"
            className="flex-1 p-2 border-none bg-transparent focus-visible:ring-0 text-xl placeholder:text-zinc-500 h-auto font-medium tracking-tight"
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
              className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          )}
        </div>

        {/* Results Area */}
        <ScrollArea className="h-[65vh]">
          <div className="p-6">
            {isPending ? (
              <div className="flex flex-col items-center justify-center h-60 text-zinc-500 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-white/10 mb-4" />
                <div className="h-4 w-32 bg-white/10 rounded" />
              </div>
            ) : query.trim() !== "" &&
              (!results ||
                (results.songs.length === 0 &&
                  results.artists.length === 0 &&
                  results.albums.length === 0 &&
                  results.playlists.length === 0)) ? (
              <div className="flex flex-col items-center justify-center h-60 text-zinc-400">
                <p className="text-lg font-medium">
                  No results found for &quot;{query}&quot;
                </p>
                <p className="text-sm text-zinc-500 mt-2">
                  Please make sure your words are spelled correctly, or use
                  fewer or different keywords.
                </p>
              </div>
            ) : !results ? (
              <div className="flex flex-col items-center justify-center h-80 text-zinc-500 gap-6">
                <div className="p-6 rounded-full bg-white/5 ring-1 ring-white/10">
                  <Search className="w-10 h-10 opacity-40" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-white mb-1">
                    Play what you love
                  </p>
                  <p className="text-sm">
                    Search for songs, artists, albums, and playlists
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-10 pb-8">
                {/* Songs Section */}
                {results.songs.length > 0 && (
                  <section>
                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
                      Songs
                    </h3>
                    <div className="space-y-1">
                      {results.songs.map((song) => (
                        <Link
                          key={song.id}
                          href={`/song/${song.id}`}
                          onClick={handleClose}
                          className="flex items-center p-2 rounded-md hover:bg-white/10 transition-colors group group/item"
                        >
                          <div className="relative w-12 h-12 rounded overflow-hidden mr-4 shadow-md bg-zinc-800 flex-shrink-0">
                            {song.coverArt ? (
                              <Image
                                src={song.coverArt}
                                alt={song.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="w-5 h-5 text-zinc-500" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                              <Music className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate text-base group-hover/item:text-accent transition-colors">
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
                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
                      Artists
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                      {results.artists.map((artist) => (
                        <Link
                          key={artist.name}
                          href={`/artist/${encodeURIComponent(artist.name)}`}
                          onClick={handleClose}
                          className="group flex flex-col items-center p-4 rounded-lg hover:bg-white/5 transition-all duration-300"
                        >
                          <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 shadow-lg group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300 bg-zinc-800">
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
                          <div className="text-white font-bold truncate w-full text-center text-lg group-hover:text-accent transition-colors">
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
                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
                      Albums
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                      {results.albums.map((album) => (
                        <Link
                          key={album.id}
                          href={`/album/${album.id}`}
                          onClick={handleClose}
                          className="group p-4 rounded-lg bg-zinc-900/50 hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="relative w-full aspect-square rounded-md overflow-hidden mb-4 shadow-lg group-hover:shadow-xl transition-all bg-zinc-800">
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
                          <div className="text-white font-bold truncate text-base group-hover:text-accent transition-colors">
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
                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
                      Playlists
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                      {results.playlists.map((playlist) => (
                        <Link
                          key={playlist.id}
                          href={`/playlist/${playlist.id}`}
                          onClick={handleClose}
                          className="group p-4 rounded-lg bg-zinc-900/50 hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="relative w-full aspect-square rounded-md overflow-hidden mb-4 shadow-lg group-hover:shadow-xl transition-all bg-zinc-800">
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
                          <div className="text-white font-bold truncate text-base group-hover:text-accent transition-colors">
                            {playlist.name}
                          </div>
                          <div className="text-sm text-zinc-400 mt-1">
                            By {playlist.name}{" "}
                            {/* Placeholder for playlist owner if we had it */}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
