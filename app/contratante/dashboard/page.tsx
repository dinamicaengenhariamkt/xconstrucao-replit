'use client';

import { useState } from 'react';
import { WelcomeSection } from '@features/contratante/dashboard/components/WelcomeSection';
import { DashboardPeriodSelector } from '@features/contratante/dashboard/components/DashboardPeriodSelector';
import { StatsGridContainer } from '@features/contratante/dashboard/components/StatsGrid.container';
import { EvolutionChart } from '@features/contratante/dashboard/components/EvolutionChart';
import { PhaseDistributionChart } from '@features/contratante/dashboard/components/PhaseDistributionChart';
import { RecentActivitiesCard } from '@features/contratante/dashboard/components/RecentActivitiesCard';
import { PendenciasCard } from '@features/contratante/dashboard/components/PendenciasCard';
import { ValoresContratados } from '@features/contratante/dashboard/components/ValoresContratados';
import { DashboardSkeleton } from '@features/contratante/dashboard/components/DashboardSkeleton';
import { useContratanteDashboard } from '@features/contratante/dashboard/hooks/use-dashboard';
import { useAtividadesRecentes, toAtividadeDisplay, formatRelativeBr } from '@features/atividades/hooks/use-atividades';
import type { ContratanteActivity, ActivityColor } from '@features/contratante/dashboard/types';
import { HealthSummary, buildObrasHealthUrl } from '@features/shared/health';
import { AdSidebarSlot } from '@features/shared/anuncios/components/AdSidebarSlot';
import type { DashboardPeriodo } from '@features/contratante/dashboard/types';

export default function ContratanteDashboardPage() {
  const [periodo, setPeriodo] = useState<DashboardPeriodo>('30dias');
  const { data: dashboard, isLoading } = useContratanteDashboard(periodo);
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

  if (isLoading || !dashboard) {
    return <DashboardSkeleton />;
  }

  const { stats, evolution, fases, valoresContratados, pendencias, healthSummary } = dashboard;
  const totalObras = fases.reduce((sum, f) => sum + f.value, 0);

  return (
    <div className="space-y-10 p-10">
      <WelcomeSection />

      <DashboardPeriodSelector value={periodo} onChange={setPeriodo} />

      <StatsGridContainer data={stats} />

      <AdSidebarSlot zoneId="banner-dashboard-contratante" />

      <HealthSummary
        summary={healthSummary}
        title="Saúde das suas obras"
        hrefFor={(status) => buildObrasHealthUrl('/contratante/minhas-obras', status)}
        luminous
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EvolutionChart data={evolution} luminous />
        <PhaseDistributionChart data={fases} totalObras={totalObras} luminous />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RecentActivitiesCard activities={activities} luminous />
        <PendenciasCard pendencias={pendencias} luminous />
        <ValoresContratados data={valoresContratados} luminous />
      </div>
    </div>
  );
}
