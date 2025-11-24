import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SongForm from "@/components/admin/SongForm";
import AlbumForm from "@/components/admin/AlbumForm";
import PlaylistForm from "@/components/admin/PlaylistForm";

export default function PanelPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white neon-text">Admin Panel</h1>
      <p className="text-gray-400">Manage your music library content.</p>

      <Tabs defaultValue="songs" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-gray-800">
          <TabsTrigger value="songs">Songs</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
        </TabsList>
        <TabsContent value="songs" className="mt-6">
          <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Add New Song</h2>
            <SongForm />
          </div>
        </TabsContent>
        <TabsContent value="albums" className="mt-6">
          <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Add New Album</h2>
            <AlbumForm />
          </div>
        </TabsContent>
        <TabsContent value="playlists" className="mt-6">
          <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Add New Playlist</h2>
            <PlaylistForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}