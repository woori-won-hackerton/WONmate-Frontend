export function LoadingBlock() {
  return (
    <div className="space-y-4">
      <div className="h-9 w-44 animate-pulse rounded-xl bg-gray-200/80" />
      <div className="h-40 animate-pulse rounded-3xl bg-gray-200/60" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-gray-200/50" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-3xl bg-gray-200/40" />
    </div>
  );
}