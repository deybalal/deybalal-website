import GenreForm from "@/components/admin/GenreForm";

export default function NewGenrePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Genre</h1>
        <p className="text-muted-foreground">
          Create a new genre to categorize songs and albums.
        </p>
      </div>
      <GenreForm />
    </div>
  );
}
