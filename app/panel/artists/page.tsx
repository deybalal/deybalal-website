import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminTable from "@/components/AdminTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artists",
};

export default async function ArtistsPage({
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

  const [artists, artistsCount] = await Promise.all([
    prisma.artist.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.artist.count(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
        <h2 className="text-xl font-semibold">مدیریت خواننده ها</h2>
        <Button
          asChild
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <Link href="/panel/new/artist">
            <Plus className="mr-2 h-4 w-4" /> افزودن خواننده جدید
          </Link>
        </Button>
      </div>
      <div className="glass rounded-lg border border-white/10 overflow-hidden">
        <AdminTable
          type="artists"
          userRole={userRole}
          data={artists}
          pageCount={Math.ceil(artistsCount / pageSize)}
          pageIndex={page - 1}
        />
      </div>
    </div>
  );
}
