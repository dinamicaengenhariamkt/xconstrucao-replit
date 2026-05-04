'use client';

import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { cn } from '@shared/lib/utils';
import type { ReactNode } from 'react';

const COLS_CLASS: Record<number, string> = {
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
};

interface DashboardSkeletonProps {
  /** Quantidade de KPI cards a renderizar (e usado como nº de colunas em lg, default `kpiCols ?? kpiCount`). */
  kpiCount?: number;
  /** Override do nº de colunas em lg (útil quando 6 KPIs em 3 colunas, por exemplo). */
  kpiCols?: number;
  /**
   * `simple`: retângulos puros (placeholder bruto).
   * `detailed`: usa Card com header (ícone + badge) e content (label + valor).
   */
  kpiVariant?: 'simple' | 'detailed';
  /** Mostra welcome com placeholder de botão à direita. */
  welcomeWithAction?: boolean;
  /** Mostra grid de 2 charts (lg:grid-cols-2). */
  hasCharts?: boolean;
  /** Padding do container. */
  padding?: 'sm' | 'lg';
  /** Blocos extras renderizados após o tronco comum (info cards, tabelas, banners…). */
  children?: ReactNode;
}

export function DashboardSkeleton({
  kpiCount = 4,
  kpiCols,
  kpiVariant = 'simple',
  welcomeWithAction = false,
  hasCharts = true,
  padding = 'lg',
  children,
}: DashboardSkeletonProps) {
  const cols = kpiCols ?? kpiCount;
  const colsClass = COLS_CLASS[cols] ?? 'lg:grid-cols-4';

  return (
    <div className={cn('space-y-8', padding === 'lg' ? 'p-10' : 'p-6')}>
      {/* Welcome */}
      {welcomeWithAction ? (
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-80" />
          </div>
          <Skeleton className="h-12 w-80 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-5 w-96" />
        </div>
      )}

      {/* KPI Grid */}
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-6', colsClass)}>
        {Array.from({ length: kpiCount }).map((_, i) =>
          kpiVariant === 'detailed' ? (
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
          ) : (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ),
        )}
      </div>

      {/* Charts */}
      {hasCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      )}

      {/* Blocos extras passados pelo consumidor */}
      {children}
    </div>
  );
}
