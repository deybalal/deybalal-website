import SongForm from "@/components/admin/SongForm";

interface EditSongPageProps {
  params: Promise<{ songId: string }>;
}

export default async function EditSongPage({ params }: EditSongPageProps) {
  const { songId } = await params;

  return (
    <div className="w-full mt-16 pb-8">
      <div className="flex flex-col items-center w-full pb-32">
        <h1 className="text-3xl font-bold text-foreground neon-text mb-5">
          Edit Song
        </h1>
        <div className="bg-card p-6 rounded-lg border border-border md:w-xl xl:w-3xl">
          <SongForm songId={songId} mode="edit" />
        </div>
      </div>
    </div>
  );
}
