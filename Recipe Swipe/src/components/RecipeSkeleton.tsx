'use client';

export default function RecipeSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="w-full aspect-[4/3] skeleton-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded skeleton-shimmer" />
        <div className="h-4 w-1/2 rounded skeleton-shimmer" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full skeleton-shimmer" />
          <div className="h-6 w-20 rounded-full skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
