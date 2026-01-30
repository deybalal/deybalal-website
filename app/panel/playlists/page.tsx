import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminTable from "@/components/AdminTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "مدیریت پلی لیست ها",
};

export default async function PlaylistsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = (session?.user as { role?: string })?.role;
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const pageSize = 20;
  const where =
    userRole === "administrator" || userRole === "moderator"
      ? {}
      : { userId: session?.user?.id };

  const [playlists, playlistsCount] = await Promise.all([
    prisma.playlist.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.playlist.count({ where }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
        <h2 className="text-xl font-semibold">مدیریت پلی لیست ها</h2>
        <Button
          asChild
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <Link href="/panel/new/playlist">
            <Plus className="mr-2 h-4 w-4" /> افزودن پلی لیست جدید
          </Link>
        </Button>
      </div>
      <div className="glass rounded-lg border border-white/10 overflow-hidden">
        <AdminTable
          type="playlists"
          userRole={userRole}
          data={playlists}
          pageCount={Math.ceil(playlistsCount / pageSize)}
          pageIndex={page - 1}
        />
      </div>
    </div>
  );
}
