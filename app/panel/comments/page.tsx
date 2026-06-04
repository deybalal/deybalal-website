import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminTable from "@/components/AdminTable";
import { Suspense } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "مدیریت نظرات",
};

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = (session?.user as { role?: string })?.role;
  if (userRole === "user") {
    return redirect("/panel");
  }
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;

  const page = Number(params.page) || 1;
  const pageSize = 20;

  const where = {
    isDeleted: false,
    ...(q
      ? {
          content: { contains: q },
        }
      : {}),
  };

  const [comments, commentsCount] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.comment.count({ where }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
        <h2 className="text-xl font-semibold">مدیریت نظرات</h2>
      </div>
      <div className="glass rounded-lg border border-white/10 overflow-hidden">
        <Suspense>
          <AdminTable
            type="comments"
            userRole={userRole}
            data={comments}
            pageCount={Math.ceil(commentsCount / pageSize)}
            pageIndex={page - 1}
          />
        </Suspense>
      </div>
    </div>
  );
}
