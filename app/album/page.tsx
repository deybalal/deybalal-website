import AlbumCard from "@/components/AlbumCard";
import { Album } from "@/types/types";

const mockAlbums: Album[] = Array(12).fill({
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

export default function AlbumPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-white neon-text">Albums</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {mockAlbums.map((album, i) => (
          <AlbumCard key={i} album={{...album, id: i.toString()}} />
        ))}
      </div>
    </div>
  );
}
