import { Playlist } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { ListMusic } from "lucide-react";

const mockPlaylists: Playlist[] = Array(8).fill({
  id: "1",
  name: "Chill Vibes",
  songs: [],
  songsLength: 20,
  duration: 0,
  createdAt: Date.now(),
  updatedAt: Date.now()
});

export default function PlaylistsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-white neon-text">Playlists</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {mockPlaylists.map((playlist, i) => (
          <Card key={i} className="group relative overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <CardContent className="p-4">
              <div className="aspect-square w-full mb-4 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500">
                 <ListMusic size={48} className="text-white opacity-50" />
              </div>
              <div>
                <h3 className="text-white font-bold truncate text-lg">{playlist.name}</h3>
                <p className="text-gray-400 text-sm truncate">{playlist.songsLength} songs</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
