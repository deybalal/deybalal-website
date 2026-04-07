// app/favorites/page.tsx
import FavoritesComponent from "@/components/FavoritesComponent";
import PlaylistSkeleton from "@/components/PlaylistSkeleton";
import { Suspense } from "react";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;

  return (
    <Suspense key={currentPage} fallback={<PlaylistSkeleton />}>
      <FavoritesComponent page={currentPage} />
    </Suspense>
  );
}

