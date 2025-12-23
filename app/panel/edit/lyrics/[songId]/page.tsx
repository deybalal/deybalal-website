import LyricsEditor from "@/components/admin/LyricsEditor";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface EditLyricsPageProps {
  params: Promise<{ songId: string }>;
}

export default async function EditLyricsPage({ params }: EditLyricsPageProps) {
  const { songId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/login");
  }

  const userRole = (session?.user as { role?: string })?.role;

  return (
    <div className="w-full mt-16 pb-8">
      <div className="flex flex-col items-center w-full pb-32">
        <h1 className="text-3xl font-bold text-foreground neon-text mb-5">
          Edit Lyrics
        </h1>
        <div className="bg-card p-6 rounded-lg border border-border w-full max-w-4xl">
          <LyricsEditor songId={songId} userRole={userRole || "user"} />
        </div>
      </div>
    </div>
  );
}
