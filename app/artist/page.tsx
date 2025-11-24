import { Artist } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

const mockArtists: Artist[] = Array(12).fill({
  name: "Cyberpunk Collective",
  image: null,
  songs: []
});

export default function ArtistPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-white neon-text">Artists</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {mockArtists.map((artist, i) => (
          <Card key={i} className="group relative overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full bg-gray-800 mb-4 flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-500 neon-box">
                 <User size={48} className="text-gray-500" />
              </div>
              <h3 className="text-white font-bold truncate text-lg w-full">{artist.name}</h3>
              <p className="text-gray-400 text-sm">Artist</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
