'use client';

import { WelcomeSection } from '@features/empreiteiro/dashboard/components/WelcomeSection';
import { StatsGridContainer } from '@features/empreiteiro/dashboard/components/StatsGrid.container';
import { FinancialOverview } from '@features/empreiteiro/dashboard/components/FinancialOverview';
import { RecentActivities } from '@features/empreiteiro/dashboard/components/RecentActivities';
import { DashboardSkeleton } from '@features/empreiteiro/dashboard/components/DashboardSkeleton';
import { mockEfficiencyData } from '@features/empreiteiro/dashboard/mocks/activities.mock';
import { useDashboardStats } from '@features/empreiteiro/dashboard/hooks/use-dashboard-stats';
import { useFinancialData } from '@features/empreiteiro/dashboard/hooks/use-financial-data';
import { useRecentActivities } from '@features/empreiteiro/dashboard/hooks/use-recent-activities';
import { useMinhasObras } from '@features/empreiteiro/minhas-obras/hooks/use-minhas-obras';
import { HealthSummary, getMockHealthSummary, buildObrasHealthUrl } from '@features/shared/health';

export default function EmpreiteiroDashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: financialData, isLoading: financialLoading } = useFinancialData();
  const { data: activitiesData, isLoading: activitiesLoading } = useRecentActivities();
  const { data: obras } = useMinhasObras();

  if (statsLoading || financialLoading || activitiesLoading) {
    return <DashboardSkeleton />;
  }

  const healthSummary = getMockHealthSummary((obras ?? []).map((o) => o.id));

  return (
    <div className="space-y-10 p-10">
      <WelcomeSection />

      <StatsGridContainer data={statsData!} />

      <HealthSummary
        summary={healthSummary}
        title="Saúde das suas obras"
        hrefFor={(status) => buildObrasHealthUrl('/empreiteiro/minhas-obras', status)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-stretch">
        <div className="lg:col-span-2">
          <FinancialOverview data={financialData!} />
        </div>
        <div>
          <RecentActivities activities={activitiesData!} efficiency={mockEfficiencyData} />
        </div>
      </div>

    </div>
  );
}
