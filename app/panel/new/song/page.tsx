import SongForm from "@/components/admin/SongForm";

export default function NewSongPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-foreground neon-text">
        Add New Song
      </h1>
      <div className="bg-card p-6 rounded-lg border border-border">
        <SongForm />
      </div>
    </div>
  );
}
