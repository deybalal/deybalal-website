import SongList from "@/components/SongList";
import { Song } from "@/types/types";
import { Heart } from "lucide-react";

// Mock Data
const mockSongs: Song[] = Array(15).fill({
  id: "1",
  title: "Neon Nights",
  artist: "Cyberpunk Collective",
  album: "Future City",
  coverArt: null,
  duration: 210,
  uri: "",
  filename: "song.mp3",
  index: 0
});

export default function FavoritesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-end">
        <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-2xl neon-box shrink-0 bg-gradient-to-br from-pink-600 to-purple-700 flex items-center justify-center">
           <Heart size={80} className="text-white fill-white" />
        </div>
        <div className="flex flex-col gap-2 pb-2">
          <span className="text-accent uppercase tracking-widest text-sm font-bold">Collection</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white neon-text">Liked Songs</h1>
          <div className="flex items-center gap-2 text-gray-300 mt-2">
            <span>{mockSongs.length} songs</span>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <SongList songs={mockSongs} />
    </div>
  );
}
