import { Song } from "@/types/types";
import { Play, SkipBack, SkipForward, Repeat, Shuffle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

// Mock Data
const mockSong: Song = {
  id: "1",
  title: "Neon Nights",
  artist: "Cyberpunk Collective",
  album: "Future City",
  coverArt: null,
  duration: 210,
  uri: "",
  filename: "song.mp3",
  index: 0,
  year: "2024"
};

export default function SongDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto py-10">
      {/* Art */}
      <div className="w-full max-w-md aspect-square bg-gray-800 rounded-2xl shadow-2xl mb-10 neon-box relative overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Info */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 neon-text">{mockSong.title}</h1>
        <p className="text-xl text-gray-400">{mockSong.artist}</p>
        <p className="text-sm text-gray-500 mt-1">{mockSong.album} • {mockSong.year}</p>
      </div>

      {/* Progress */}
      <div className="w-full mb-8 px-4">
        <Slider defaultValue={[33]} max={100} step={1} className="mb-2" />
        <div className="flex justify-between text-sm text-gray-400">
          <span>1:15</span>
          <span>3:30</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8">
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-transparent scale-125">
          <Shuffle size={24} />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-transparent scale-125">
          <SkipBack size={32} />
        </Button>
        <Button 
          size="icon"
          className="w-20 h-20 rounded-full bg-accent text-accent-foreground hover:scale-105 transition-transform neon-box hover:bg-accent/90 flex items-center justify-center"
        >
          <Play size={40} fill="currentColor" className="ml-2" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-transparent scale-125">
          <SkipForward size={32} />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-transparent scale-125">
          <Repeat size={24} />
        </Button>
      </div>
      
      <div className="mt-10">
         <Button variant="outline" className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            <Heart size={20} />
            Add to Favorites
         </Button>
      </div>
    </div>
  );
}
