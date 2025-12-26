import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminTable from "@/components/AdminTable";

export default async function GenresPage({
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

  const [genres, genresCount] = await Promise.all([
    prisma.genre.findMany({
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.genre.count(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
        <h2 className="text-xl font-semibold">Genres Library</h2>
        <Button
          asChild
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <Link href="/panel/new/genre">
            <Plus className="mr-2 h-4 w-4" /> Add New Genre
          </Link>
        </Button>
      </div>
      <div className="glass rounded-lg border border-white/10 overflow-hidden">
        <AdminTable
          type="genres"
          userRole={userRole}
          data={genres}
          pageCount={Math.ceil(genresCount / pageSize)}
          pageIndex={page - 1}
        />
      </div>
    </div>
  );
}
