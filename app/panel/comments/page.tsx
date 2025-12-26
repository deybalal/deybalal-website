import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AdminTable from "@/components/AdminTable";

export default async function CommentsPage({
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

  const [comments, commentsCount] = await Promise.all([
    prisma.comment.findMany({
      where: {
        OR: [
          userRole === "administrator" || userRole === "moderator"
            ? { isDeleted: false }
            : { userId: session?.user?.id, isDeleted: false },
        ],
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.comment.count(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card/30 p-4 rounded-lg border border-white/5 backdrop-blur-sm">
        <h2 className="text-xl font-semibold">Comments Management</h2>
      </div>
      <div className="glass rounded-lg border border-white/10 overflow-hidden">
        <AdminTable
          type="comments"
          userRole={userRole}
          data={comments}
          pageCount={Math.ceil(commentsCount / pageSize)}
          pageIndex={page - 1}
        />
      </div>
    </div>
  );
}
