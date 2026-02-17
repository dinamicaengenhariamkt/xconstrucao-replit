import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-10">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-12 w-80 rounded-xl" />
      </div>

      {/* Stats grid skeleton - 6 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <Skeleton className="h-11 w-11 rounded-lg" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-36 mb-2" />
              <Skeleton className="h-9 w-44" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-44 mt-1" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <div>
        <Skeleton className="h-6 w-56 mb-2" />
        <Skeleton className="h-4 w-80 mb-4" />
        <Card>
          <CardContent className="p-0">
            <Skeleton className="h-[320px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Side-by-side tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-36 mt-1" />
            </CardHeader>
            <CardContent className="p-0">
              <Skeleton className="h-[260px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
