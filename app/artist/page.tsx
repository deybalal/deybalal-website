"use client";

import { useEffect, useState } from "react";
import { Artist } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ArtistPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch("/api/artists");
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            setArtists(result.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch artists", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-4xl font-bold text-white neon-text">Artists</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white/5 rounded-lg aspect-square"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-white neon-text">Artists</h1>

      {artists.length === 0 ? (
        <div className="text-gray-400 text-lg">No artists found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {artists.map((artist) => (
            <Link
              href={`/artist/${artist.id}`}
              key={artist.id}
              className="w-64"
            >
              <Card className="group relative overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full bg-gray-800 mb-4 flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-500 neon-box relative">
                    {artist.image ? (
                      <Image
                        src={artist.image}
                        alt={artist.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User size={48} className="text-gray-500" />
                    )}
                  </div>
                  <h3 className="text-foreground font-bold text-lg w-full px-4 min-w-0 h-7">
                    <div className="flex items-center justify-center gap-1 min-w-0">
                      <span
                        className="truncate block max-w-full"
                        title={artist.name}
                      >
                        {artist.name}
                      </span>

                      {artist.isVerified && (
                        <Image
                          src="/images/verified.svg"
                          alt="Verified"
                          width={24}
                          height={24}
                          className="shrink-0 z-10"
                        />
                      )}
                    </div>
                  </h3>

                  <p className="text-gray-400 text-sm">Artist</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
