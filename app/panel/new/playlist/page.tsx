import PlaylistForm from "@/components/admin/PlaylistForm";

export default function NewPlaylistPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-foreground neon-text">
        Add New Playlist
      </h1>
      <div className="bg-card p-6 rounded-lg border border-border">
        <PlaylistForm />
      </div>
    </div>
  );
}
