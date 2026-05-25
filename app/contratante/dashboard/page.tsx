'use client';

import { useState, useEffect } from 'react';
import { WelcomeSection } from '@features/contratante/dashboard/components/WelcomeSection';
import { DashboardPeriodSelector } from '@features/contratante/dashboard/components/DashboardPeriodSelector';
import { StatsGridContainer } from '@features/contratante/dashboard/components/StatsGrid.container';
import { EvolutionChart } from '@features/contratante/dashboard/components/EvolutionChart';
import { PhaseDistributionChart } from '@features/contratante/dashboard/components/PhaseDistributionChart';
import { RecentActivitiesCard } from '@features/contratante/dashboard/components/RecentActivitiesCard';
import { PendenciasCard } from '@features/contratante/dashboard/components/PendenciasCard';
import { ValoresContratados } from '@features/contratante/dashboard/components/ValoresContratados';
import { DashboardSkeleton } from '@features/contratante/dashboard/components/DashboardSkeleton';
import {
  mockDashboardStatsByPeriodo,
  mockEvolutionDataByPeriodo,
} from '@features/contratante/dashboard/mocks/dashboard-stats.mock';
import {
  mockPhaseData,
  mockValoresContratados,
} from '@features/contratante/dashboard/mocks/evolution-data.mock';
import { mockPendencias } from '@features/contratante/dashboard/mocks/activities.mock';
import { useObrasContratante } from '@features/contratante/minhas-obras/hooks/use-minhas-obras';
import { useAtividadesRecentes, toAtividadeDisplay, formatRelativeBr } from '@features/atividades/hooks/use-atividades';
import type { ContratanteActivity, ActivityColor } from '@features/contratante/dashboard/types';
import { HealthSummary, getMockHealthSummary, buildObrasHealthUrl } from '@features/shared/health';
import type { DashboardPeriodo } from '@features/contratante/dashboard/types';

export default function ContratanteDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState<DashboardPeriodo>('30dias');
  const { data: obrasPayload } = useObrasContratante({ pageSize: 100 });
  const obras = obrasPayload?.rows;
  const { data: atividadesPage } = useAtividadesRecentes(10);

  const COLOR_FALLBACK: Record<string, ActivityColor> = {
    success: 'success', info: 'info', warning: 'warning', purple: 'purple', amber: 'warning', primary: 'info',
  };
  const ICON_ALLOWED: Record<string, ContratanteActivity['icon']> = {
    check: 'check', upload: 'upload', edit: 'edit', payment: 'payment', alert: 'edit',
  };
  const activities: ContratanteActivity[] = (atividadesPage?.items ?? []).slice(0, 5).map((item) => {
    const d = toAtividadeDisplay(item, 'contratante');
    return {
      id: d.id,
      icon: ICON_ALLOWED[d.icon] ?? 'edit',
      color: COLOR_FALLBACK[d.color] ?? 'info',
      title: d.titulo,
      obraId: d.obraId ?? '',
      obraNome: d.obraNome ?? '—',
      timestamp: formatRelativeBr(d.createdAt),
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = mockDashboardStatsByPeriodo[periodo];
  const evolution = mockEvolutionDataByPeriodo[periodo];
  const healthSummary = getMockHealthSummary((obras ?? []).map((o) => o.id));

  return (
    <div className="space-y-10 p-10">
      <WelcomeSection />

      <DashboardPeriodSelector value={periodo} onChange={setPeriodo} />

      <StatsGridContainer data={stats} />

      <HealthSummary
        summary={healthSummary}
        title="Saúde das suas obras"
        hrefFor={(status) => buildObrasHealthUrl('/contratante/minhas-obras', status)}
        luminous
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EvolutionChart data={evolution} luminous />
        <PhaseDistributionChart data={mockPhaseData} totalObras={12} luminous />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RecentActivitiesCard activities={activities} luminous />
        <PendenciasCard pendencias={mockPendencias} luminous />
        <ValoresContratados data={mockValoresContratados} luminous />
      </div>
    </div>
  );
}
