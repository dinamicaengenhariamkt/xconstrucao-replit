'use client';

import { useState, useEffect } from 'react';
import { WelcomeSection } from '@features/contratante/dashboard/components/WelcomeSection';
import { StatsGridContainer } from '@features/contratante/dashboard/components/StatsGrid.container';
import { EvolutionChart } from '@features/contratante/dashboard/components/EvolutionChart';
import { PhaseDistributionChart } from '@features/contratante/dashboard/components/PhaseDistributionChart';
import { RecentActivitiesCard } from '@features/contratante/dashboard/components/RecentActivitiesCard';
import { PendenciasCard } from '@features/contratante/dashboard/components/PendenciasCard';
import { ValoresContratados } from '@features/contratante/dashboard/components/ValoresContratados';
import { ExportBanner } from '@features/contratante/dashboard/components/ExportBanner';
import { DashboardSkeleton } from '@features/contratante/dashboard/components/DashboardSkeleton';
import { mockDashboardStats } from '@features/contratante/dashboard/mocks/dashboard-stats.mock';
import {
  mockEvolutionData,
  mockPhaseData,
  mockValoresContratados,
} from '@features/contratante/dashboard/mocks/evolution-data.mock';
import { mockActivities, mockPendencias } from '@features/contratante/dashboard/mocks/activities.mock';
import { useObrasContratante } from '@features/contratante/minhas-obras/hooks/use-minhas-obras';
import { HealthSummary, getMockHealthSummary, buildObrasHealthUrl } from '@features/shared/health';

export default function ContratanteDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const { data: obras } = useObrasContratante();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const healthSummary = getMockHealthSummary((obras ?? []).map((o) => o.id));

  return (
    <div className="space-y-10 p-10">
      <WelcomeSection />

      <StatsGridContainer data={mockDashboardStats} />

      <HealthSummary
        summary={healthSummary}
        title="Saúde das suas obras"
        hrefFor={(status) => buildObrasHealthUrl('/contratante/minhas-obras', status)}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EvolutionChart data={mockEvolutionData} />
        <PhaseDistributionChart data={mockPhaseData} totalObras={12} />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RecentActivitiesCard activities={mockActivities} />
        <PendenciasCard pendencias={mockPendencias} />
        <ValoresContratados data={mockValoresContratados} />
      </div>

      <ExportBanner />
    </div>
  );
}
