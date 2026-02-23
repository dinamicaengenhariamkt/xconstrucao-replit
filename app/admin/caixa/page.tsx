'use client';

import { useState } from 'react';
import { useCaixaKpis, useIndicadoresEconomicos, useCaixaChartData, useMovimentacoes } from '@features/admin/caixa/hooks/use-caixa';
import { CaixaSkeleton } from '@features/admin/caixa/components/CaixaSkeleton';
import { WelcomeSection } from '@features/admin/caixa/components/WelcomeSection';
import { KpiGridContainer } from '@features/admin/caixa/components/KpiGrid.container';
import { IndicadoresEconomicosSection } from '@features/admin/caixa/components/IndicadoresEconomicosSection';
import { CaixaChart } from '@features/admin/caixa/components/CaixaChart';
import { FluxoResumo } from '@features/admin/caixa/components/FluxoResumo';
import { MovimentacoesTable } from '@features/admin/caixa/components/MovimentacoesTable';
import type { CaixaPeriodo } from '@features/admin/caixa/types';

export default function AdminCaixaPage() {
  const [periodo, setPeriodo] = useState<CaixaPeriodo>('30dias');

  const { isLoading: isLoadingKpis } = useCaixaKpis();
  const { isLoading: isLoadingIndicadores } = useIndicadoresEconomicos();
  const { isLoading: isLoadingChart } = useCaixaChartData();
  const { isLoading: isLoadingMovs } = useMovimentacoes();

  const isLoading =
    isLoadingKpis || isLoadingIndicadores || isLoadingChart || isLoadingMovs;

  if (isLoading) {
    return <CaixaSkeleton />;
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <WelcomeSection periodo={periodo} onPeriodoChange={setPeriodo} />
      <KpiGridContainer />
      <IndicadoresEconomicosSection />
      <CaixaChart />
      <FluxoResumo />
      <MovimentacoesTable />
    </div>
  );
}
