import { prisma } from "@/lib/prisma";
import GenreForm from "@/components/admin/GenreForm";
import { notFound } from "next/navigation";

export default async function EditGenrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const genre = await prisma.genre.findUnique({
    where: { id },
  });

  if (!genre) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Genre</h1>
        <p className="text-muted-foreground">Edit genre details.</p>
      </div>
      <GenreForm initialData={genre} />
    </div>
  );
}
