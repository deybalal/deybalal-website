import AlbumCard from "@/components/AlbumCard";
import SongCard from "@/components/SongCard";
import { Album, Song } from "@/types/types";

// Mock Data (Replace with real data fetching later)
const mockSongs: Song[] = Array(5).fill({
  id: "1",
  title: "Neon Nights",
  artist: "Cyberpunk Collective",
  album: "Future City",
  coverArt: "",
  duration: 210,
  uri: "",
  filename: "song.mp3",
  index: 0
});

const mockAlbums: Album[] = Array(4).fill({
  id: "1",
  name: "Future City",
  artistName: "Cyberpunk Collective",
  artistId: "1",
  coverArt: "",
  songs: [],
  releaseDate: Date.now(),
  duration: 0,
  createdAt: Date.now(),
  updatedAt: Date.now()
});

export default function Home() {
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
          {mockSongs.map((song, i) => (
            <SongCard key={i} song={{...song, id: i.toString()}} />
          ))}
        </div>
      </section>

      {/* New Releases */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="w-2 h-8 bg-purple-500 mr-3 rounded-full shadow-[0_0_10px_purple]"></span>
          New Albums
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {mockAlbums.map((album, i) => (
            <AlbumCard key={i} album={{...album, id: i.toString()}} />
          ))}
        </div>
      </section>
    </div>
  );
}
