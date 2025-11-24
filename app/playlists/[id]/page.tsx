import SongList from "@/components/SongList";
import { Playlist, Song } from "@/types/types";
import { ListMusic } from "lucide-react";

// Mock Data
const mockPlaylist: Playlist = {
  id: "1",
  name: "Chill Vibes",
  songs: [],
  songsLength: 20,
  duration: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  description: "The best chill beats for coding and relaxing."
};

const mockSongs: Song[] = Array(12).fill({
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

export default function PlaylistDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-end">
        <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-2xl neon-box shrink-0 bg-gradient-to-br from-primary to-accent flex items-center justify-center">
           <ListMusic size={80} className="text-white opacity-50" />
        </div>
        <div className="flex flex-col gap-2 pb-2">
          <span className="text-accent uppercase tracking-widest text-sm font-bold">Playlist</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white neon-text">{mockPlaylist.name}</h1>
          <p className="text-gray-300 text-lg max-w-2xl">{mockPlaylist.description}</p>
          <div className="flex items-center gap-2 text-gray-400 mt-2">
            <span>{mockPlaylist.songsLength} songs</span>
            <span>•</span>
            <span>1 hr 30 min</span>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <SongList songs={mockSongs} />
    </div>
  );
}
