'use client';

import { WelcomeSection } from '@features/empreiteiro/dashboard/components/WelcomeSection';
import { StatsGrid } from '@features/empreiteiro/dashboard/components/StatsGrid';
import { FinancialOverview } from '@features/empreiteiro/dashboard/components/FinancialOverview';
import { RecentActivities } from '@features/empreiteiro/dashboard/components/RecentActivities';
import { ExportBanner } from '@features/empreiteiro/dashboard/components/ExportBanner';
import { DashboardSkeleton } from '@features/empreiteiro/dashboard/components/DashboardSkeleton';
import { mockDashboardStats } from '@features/empreiteiro/dashboard/mocks/dashboard-stats.mock';
import { mockFinancialData } from '@features/empreiteiro/dashboard/mocks/financial-data.mock';
import { mockActivities, mockEfficiencyData } from '@features/empreiteiro/dashboard/mocks/activities.mock';
import { ENABLE_MOCK } from '@features/empreiteiro/dashboard/constants';
import { useState, useEffect } from 'react';

export default function EmpreiteiroDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Simula loading inicial
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Por enquanto, sempre usa dados mockados
  // TODO: Quando ENABLE_MOCK=false, buscar dados reais via hooks
  const stats = mockDashboardStats;
  const financial = mockFinancialData;
  const activities = mockActivities;
  const efficiency = mockEfficiencyData;

  return (
    <div className="space-y-10 p-10">
      <WelcomeSection />

      <StatsGrid data={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-stretch">
        <div className="lg:col-span-2">
          <FinancialOverview data={financial} />
        </div>
        <div>
          <RecentActivities activities={activities} efficiency={efficiency} />
        </div>
      </div>

      <ExportBanner />
    </div>
  );
}
