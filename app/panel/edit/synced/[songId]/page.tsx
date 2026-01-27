import SyncedLyricsEditor from "@/components/admin/SyncedLyricsEditor";

interface EditSyncedLyricsPageProps {
  params: Promise<{ songId: string }>;
}

export default async function EditSyncedLyricsPage({
  params,
}: EditSyncedLyricsPageProps) {
  const { songId } = await params;

  return (
    <div className="w-full mt-16 pb-8">
      <div className="flex flex-col items-center w-full pb-32">
        <h1 className="text-3xl font-bold text-foreground neon-text mb-5">
          ویرایش متن آهنگ همگام سازی شده (سینک شده)
        </h1>
        <div className="bg-card p-6 rounded-lg border border-border w-full max-w-4xl">
          <SyncedLyricsEditor songId={songId} />
        </div>
      </div>
    </div>
  );
}
