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
import { useEmpreiteiroSummary } from '@features/empreiteiro/dashboard/hooks/use-summary';
import { DashboardPeriodSelector } from '@features/shared/dashboard/components/DashboardPeriodSelector';
import type { DashboardPeriodo } from '@features/shared/dashboard/types';
import { HealthSummary, buildObrasHealthUrl } from '@features/shared/health';
import { ProfitSummary } from '@features/shared/profit';
import { AdSidebarSlot } from '@features/shared/anuncios/components/AdSidebarSlot';
import { RevealOnScroll } from '@features/shared/components/RevealOnScroll';

const EMPTY_HEALTH = { saudavel: 0, atencao: 0, risco: 0, total: 0 };
const EMPTY_PROFIT = {
  metrics: { receitaTotal: 0, custoTotal: 0, lucroEstimado: 0, margem: 0 },
  trend: [],
  totalObras: 0,
};

export default function EmpreiteiroDashboardPage() {
  const [periodo, setPeriodo] = useState<DashboardPeriodo>('30dias');

  const { data: statsData, isLoading: statsLoading } = useDashboardStats(periodo);
  const { data: financialData, isLoading: financialLoading } = useFinancialData(periodo);
  const { data: activitiesData, isLoading: activitiesLoading } = useRecentActivities(periodo);
  const { data: summary } = useEmpreiteiroSummary();

  if (statsLoading || financialLoading || activitiesLoading) {
    return <DashboardSkeleton />;
  }

  const healthSummary = summary?.health ?? EMPTY_HEALTH;
  const profitSummary = summary?.profit ?? EMPTY_PROFIT;

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

      <AdSidebarSlot zoneId="banner-dashboard-empreiteiro" />

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
