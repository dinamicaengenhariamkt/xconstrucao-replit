import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <Skeleton className="h-11 w-11 rounded-lg" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-9 w-36" />
      </CardContent>
    </Card>
  );
}

export function CaixaSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-11 w-80 rounded-xl" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Macro Section Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-11 w-96 rounded-xl" />
      </div>

      {/* Economic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-11 w-11 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Impact Panel */}
      <Card>
        <CardContent className="p-8 space-y-6">
          <Skeleton className="h-6 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>

      {/* Flow Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
