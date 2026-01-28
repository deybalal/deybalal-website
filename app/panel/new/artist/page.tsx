import ArtistForm from "@/components/admin/ArtistForm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function NewArtistPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-foreground neon-text">
        افزودن خواننده جدید
      </h1>
      <div className="bg-card p-6 rounded-lg border border-border">
        <ArtistForm />
      </div>
    </div>
  );
}
