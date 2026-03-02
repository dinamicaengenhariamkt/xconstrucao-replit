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
import type { CaixaPeriodo, DateRange } from '@features/admin/caixa/types';

export default function AdminCaixaPage() {
  const [periodo, setPeriodo] = useState<CaixaPeriodo>('30dias');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

  function handlePeriodoChange(p: CaixaPeriodo) {
    if (p !== 'personalizado') setCustomRange(undefined);
    setPeriodo(p);
  }

  const { isLoading: isLoadingKpis } = useCaixaKpis(periodo);
  const { isLoading: isLoadingIndicadores } = useIndicadoresEconomicos();
  const { isLoading: isLoadingChart } = useCaixaChartData(periodo);
  const { isLoading: isLoadingMovs } = useMovimentacoes(periodo, customRange);

  const isLoading =
    isLoadingKpis || isLoadingIndicadores || isLoadingChart || isLoadingMovs;

  if (isLoading) {
    return <CaixaSkeleton />;
  }

  return (
    <div className="p-6 md:p-10 space-y-8">
      <WelcomeSection
        periodo={periodo}
        onPeriodoChange={handlePeriodoChange}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />
      <KpiGridContainer periodo={periodo} />
      <IndicadoresEconomicosSection />
      <CaixaChart periodo={periodo} />
      <FluxoResumo periodo={periodo} />
      <MovimentacoesTable periodo={periodo} customRange={customRange} />
    </div>
  );
}
