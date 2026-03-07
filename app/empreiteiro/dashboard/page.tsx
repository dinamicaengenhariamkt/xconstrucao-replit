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

export default function EmpreiteiroDashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: financialData, isLoading: financialLoading } = useFinancialData();
  const { data: activitiesData, isLoading: activitiesLoading } = useRecentActivities();

  if (statsLoading || financialLoading || activitiesLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-10 p-10">
      <WelcomeSection />

      <StatsGridContainer data={statsData!} />

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
