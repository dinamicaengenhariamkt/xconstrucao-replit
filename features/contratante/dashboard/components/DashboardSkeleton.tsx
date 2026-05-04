import { Skeleton } from '@shared/components/ui/skeleton';
import { DashboardSkeleton as SharedDashboardSkeleton } from '@features/shared/components/DashboardSkeleton';

export function DashboardSkeleton() {
  return (
    <SharedDashboardSkeleton kpiCount={5} kpiVariant="simple" hasCharts>
      {/* Info cards (RecentActivities, Pendencias, ValoresContratados) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>

      {/* Banner */}
      <Skeleton className="h-28 rounded-2xl" />
    </SharedDashboardSkeleton>
  );
}
