export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-48 animate-pulse rounded-full bg-sky-100" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-[28px] bg-white/70" />
        <div className="h-72 animate-pulse rounded-[28px] bg-white/70" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-40 animate-pulse rounded-[28px] bg-white/70" />
        <div className="h-40 animate-pulse rounded-[28px] bg-white/70" />
        <div className="h-40 animate-pulse rounded-[28px] bg-white/70" />
      </div>
    </div>
  );
}
