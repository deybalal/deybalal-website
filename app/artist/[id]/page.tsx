import SongList from "@/components/SongList";
import { Artist, Song, Album } from "@/types/types";
import { User } from "lucide-react";
import fs from 'fs';
import path from 'path';
import AlbumCard from "@/components/AlbumCard";

// Load Data
const loadData = () => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'Masoud-Bakhtiari.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error("Error reading data file:", error);
    return [];
  }
};

const rawData = loadData();

const mockArtist: Artist = {
  name: rawData[0]?.artist || "Masoud Bakhtiari",
  image: rawData[0]?.coverArt ? `/${rawData[0].coverArt}` : null,
  songs: []
};

const mockSongs: Song[] = rawData.map((item: any, index: number) => ({
  id: item.source?.id?.toString() || index.toString(),
  title: item.title,
  artist: item.artist,
  album: "Single", // JSON doesn't specify album, assuming singles or collection
  coverArt: item.coverArt ? `/${item.coverArt}` : null,
  duration: item.duration || 0,
  uri: item.links?.music320 || item.links?.music128 || item.links?.music64 || "",
  filename: `${item.title}.mp3`,
  index: index,
  lyrics: item.lyrics,
  syncedLyrics: item.syncedLyrics
}));

const mockAlbums: Album[] = [
  {
    id: "1",
    name: "Masoud Bakhtiari Collection",
    artistName: mockArtist.name,
    artistId: "1",
    coverArt: mockArtist.image || "",
    songs: mockSongs,
    releaseDate: Date.now(),
    duration: mockSongs.reduce((acc, song) => acc + song.duration, 0),
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export default function ArtistDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col items-center md:items-start gap-6">
        <div className="w-48 h-48 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden shadow-2xl neon-box">
           {mockArtist.image ? (
             <img src={mockArtist.image} alt={mockArtist.name} className="w-full h-full object-cover" />
           ) : (
             <User size={64} className="text-gray-500" />
           )}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-bold text-white neon-text mb-4">{mockArtist.name}</h1>
          <p className="text-gray-400 text-lg">1,234,567 Monthly Listeners</p>
        </div>
      </div>

      {/* Popular Songs */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Popular</h2>
        <SongList songs={mockSongs} />
      </section>

      {/* Albums */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Discography</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {mockAlbums.map((album, i) => (
            <AlbumCard key={i} album={{...album, id: i.toString()}} />
          ))}
        </div>
      </section>
    </div>
  );
}
