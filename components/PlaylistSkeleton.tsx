export default function PlaylistSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex gap-8">
        <div className="w-64 h-64 bg-muted rounded-lg" />
        <div className="flex-1 space-y-4">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-16 w-3/4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
