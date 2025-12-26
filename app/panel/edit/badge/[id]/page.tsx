import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BadgeForm from "@/components/admin/BadgeForm";

export default async function EditBadgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const badge = await prisma.badge.findUnique({
    where: { id },
  });

  if (!badge) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Badge</h1>
        <p className="text-muted-foreground">Update badge details.</p>
      </div>
      <BadgeForm initialData={badge} />
    </div>
  );
}
