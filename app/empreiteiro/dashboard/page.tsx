'use client';

import { useState } from 'react';
import { WelcomeSection } from '@features/empreiteiro/dashboard/components/WelcomeSection';
import { StatsGridContainer } from '@features/empreiteiro/dashboard/components/StatsGrid.container';
import { FinancialOverview } from '@features/empreiteiro/dashboard/components/FinancialOverview';
import { RecentActivities } from '@features/empreiteiro/dashboard/components/RecentActivities';
import { DashboardSkeleton } from '@features/empreiteiro/dashboard/components/DashboardSkeleton';
import { useDashboardStats } from '@features/empreiteiro/dashboard/hooks/use-dashboard-stats';
import { useFinancialData } from '@features/empreiteiro/dashboard/hooks/use-financial-data';
import { useRecentActivities } from '@features/empreiteiro/dashboard/hooks/use-recent-activities';
import { useMinhasObras } from '@features/empreiteiro/minhas-obras/hooks/use-minhas-obras';
import { DashboardPeriodSelector } from '@features/shared/dashboard/components/DashboardPeriodSelector';
import type { DashboardPeriodo } from '@features/shared/dashboard/types';
import { HealthSummary, getMockHealthSummary, buildObrasHealthUrl } from '@features/shared/health';
import { ProfitSummary, getMockProfitSummary } from '@features/shared/profit';
import { RevealOnScroll } from '@features/shared/components/RevealOnScroll';

export default function EmpreiteiroDashboardPage() {
  const [periodo, setPeriodo] = useState<DashboardPeriodo>('30dias');

  const { data: statsData, isLoading: statsLoading } = useDashboardStats(periodo);
  const { data: financialData, isLoading: financialLoading } = useFinancialData(periodo);
  const { data: activitiesData, isLoading: activitiesLoading } = useRecentActivities(periodo);
  const { data: obras } = useMinhasObras();

  if (statsLoading || financialLoading || activitiesLoading) {
    return <DashboardSkeleton />;
  }

  const obraIds = (obras ?? []).map((o) => o.id);
  const healthSummary = getMockHealthSummary(obraIds);
  const profitSummary = getMockProfitSummary(obraIds);

  return (
    <div className="space-y-10 p-10">
      <WelcomeSection />

      <DashboardPeriodSelector
        value={periodo}
        onChange={setPeriodo}
        description="Período aplicado aos KPIs, fluxo de caixa e atividades recentes."
      />

      <RevealOnScroll delay={0.05}>
        <StatsGridContainer data={statsData!} healthSummary={healthSummary} />
      </RevealOnScroll>

      <RevealOnScroll delay={0.1}>
        <HealthSummary
          summary={healthSummary}
          title="Saúde das suas obras"
          hrefFor={(status) => buildObrasHealthUrl('/empreiteiro/minhas-obras', status)}
          luminous
        />
      </RevealOnScroll>

      <RevealOnScroll delay={0.15}>
        <ProfitSummary
          summary={profitSummary}
          title="Lucro consolidado das suas obras"
          description="Receita, lucro e margem agregados das obras ativas."
          luminous
        />
      </RevealOnScroll>

      <RevealOnScroll delay={0.2}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <FinancialOverview data={financialData!} luminous />
          </div>
          {/* Wrapper relative + child absolute (desktop): RecentActivities herda
              a altura ditada por FinancialOverview e scrolla internamente. */}
          <div className="relative">
            <div className="lg:absolute lg:inset-0">
              <RecentActivities activities={activitiesData!} luminous />
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </div>
  );
}
