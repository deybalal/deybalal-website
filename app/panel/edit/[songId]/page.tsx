import SongFormEdit from "@/components/admin/SongFormEdit";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface EditSongPageProps {
  params: Promise<{ songId: string }>;
}

export default async function EditSongPage({ params }: EditSongPageProps) {
  const { songId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = (session?.user as { role?: string })?.role;

  if (userRole !== "administrator" && userRole !== "moderator") {
    return (
      <div className="w-full mt-16 pb-8">
        <div className="flex flex-col items-center w-full pb-32">
          <h1 className="text-3xl font-bold text-foreground neon-text mb-5">
            ویرایش آهنگ
          </h1>
          <div className="bg-card text-3xl text-center p-6 rounded-lg border border-border md:w-xl xl:w-3xl">
            فقط ادمین ها میتوانند آهنگ ها را ویرایش کنند!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-16 pb-8">
      <div className="flex flex-col items-center w-full pb-32">
        <h1 className="text-3xl font-bold text-foreground neon-text mb-5">
          ویرایش آهنگ
        </h1>
        <div className="bg-card p-6 rounded-lg border border-border md:w-xl xl:w-3xl">
          <SongFormEdit songId={songId} mode="edit" />
        </div>
      </div>
    </div>
  );
}
