// app/favorites/page.tsx
import FavoritesComponent from "@/components/FavoritesComponent";
import PlaylistSkeleton from "@/components/PlaylistSkeleton";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<PlaylistSkeleton />}>
      <FavoritesComponent />
    </Suspense>
  );
}
