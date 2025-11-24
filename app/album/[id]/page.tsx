import SongList from "@/components/SongList";
import { Album, Song } from "@/types/types";
import Image from "next/image";

// Mock Data
const mockAlbum: Album = {
  id: "1",
  name: "Future City",
  artistName: "Cyberpunk Collective",
  artistId: "1",
  songs: [],
  coverArt: "",
  releaseDate: Date.now(),
  duration: 0,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

const mockSongs: Song[] = Array(8).fill({
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

export default function AlbumDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-end">
        <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-2xl neon-box shrink-0">
           <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-gray-500 text-2xl">No Art</span>
            </div>
        </div>
        <div className="flex flex-col gap-2 pb-2">
          <span className="text-accent uppercase tracking-widest text-sm font-bold">Album</span>
          <h1 className="text-5xl md:text-7xl font-bold text-white neon-text">{mockAlbum.name}</h1>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="font-medium text-white hover:underline cursor-pointer">{mockAlbum.artistName}</span>
            <span>•</span>
            <span>2024</span>
            <span>•</span>
            <span>{mockSongs.length} songs</span>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <SongList songs={mockSongs} />
    </div>
  );
}
