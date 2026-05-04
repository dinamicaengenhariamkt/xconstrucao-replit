import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { DashboardSkeleton as SharedDashboardSkeleton } from '@features/shared/components/DashboardSkeleton';

export function DashboardSkeleton() {
  return (
    <SharedDashboardSkeleton
      kpiCount={6}
      kpiCols={3}
      kpiVariant="detailed"
      welcomeWithAction
      hasCharts
    >
      {/* Tabela full-width "Obras com atenção" */}
      <div>
        <Skeleton className="h-6 w-56 mb-2" />
        <Skeleton className="h-4 w-80 mb-4" />
        <Card>
          <CardContent className="p-0">
            <Skeleton className="h-[320px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Tabelas side-by-side (Top Clientes / Top Empreiteiras) */}
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
    </SharedDashboardSkeleton>
  );
}
