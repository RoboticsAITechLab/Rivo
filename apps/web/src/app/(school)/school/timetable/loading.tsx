import { Skeleton } from '@/components/ui/skeleton';

export default function TimetableLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>

      {/* Control / View Switcher Bar */}
      <div className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-40 rounded-lg" />
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>
      </div>

      {/* Weekly Grid Skeleton */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/40 p-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-20 mx-auto" />
          ))}
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, row) => (
            <div key={row} className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, col) => (
                <Skeleton key={col} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
