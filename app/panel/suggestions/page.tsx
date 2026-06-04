import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AdminTable from "@/components/AdminTable";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "مدیریت متن آهنگ ها",
};

export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = (session?.user as { role?: string })?.role;
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;

  const page = Number(params.page) || 1;
  const pageSize = 20;

  const where = {
    AND: [
      userRole === "administrator" || userRole === "moderator"
        ? {}
        : { userId: session?.user?.id },
      q
        ? {
            song: {
              title: { contains: q },
            },
          }
        : {},
    ],
  };

  const [suggestions, suggestionsCount] = await Promise.all([
    prisma.lyricsSuggestion.findMany({
      where,
      include: {
        song: {
          select: {
            title: true,
            artist: true,
            lyrics: true,
            syncedLyrics: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lyricsSuggestion.count({ where }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
        <h2 className="text-xl font-semibold">
          مدیریت متن آهنگ های ارسالی توسط کاربران
        </h2>
      </div>
      <div className="glass rounded-lg border border-white/10 overflow-hidden">
        <Suspense>
          <AdminTable
            type="suggestions"
            userRole={userRole}
            data={suggestions}
            pageCount={Math.ceil(suggestionsCount / pageSize)}
            pageIndex={page - 1}
          />
        </Suspense>
      </div>
    </div>
  );
}
