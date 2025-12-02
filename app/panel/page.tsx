import { Button } from "@/components/ui/button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DataTable } from "@/components/data-table";
import { columns } from "./columns";

export default async function PanelPage() {
  const songs = await prisma.song.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground neon-text">
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Manage your music library content.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button>User Area</Button>
        <Button asChild variant="secondary">
          <Link href="/panel/new/song">Add New Song</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/panel/new/artist">Add New Artist</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/panel/new/album">Add New Album</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/panel/new/playlist">Add New Playlist</Link>
        </Button>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          All Songs
        </h2>
        <DataTable columns={columns} data={songs} />
      </div>
    </div>
  );
}
