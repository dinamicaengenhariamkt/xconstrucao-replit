'use client';

import { useState, useEffect } from 'react';
import { WelcomeSection } from '@features/admin/financeiro/components/WelcomeSection';
import { StatsGridContainer } from '@features/admin/financeiro/components/StatsGrid.container';
import { PaymentsEvolutionChart } from '@features/admin/financeiro/components/PaymentsEvolutionChart';
import { StatusDistributionChart } from '@features/admin/financeiro/components/StatusDistributionChart';
import { ObrasAtencaoTable } from '@features/admin/financeiro/components/ObrasAtencaoTable';
import { TopClientesTable } from '@features/admin/financeiro/components/TopClientesTable';
import { TopEmpreiteirasTable } from '@features/admin/financeiro/components/TopEmpreiteirasTable';
import { ReceitasPlataformaTable } from '@features/admin/financeiro/components/ReceitasPlataformaTable';
import { DashboardSkeleton } from '@features/admin/financeiro/components/DashboardSkeleton';
import { AdoptionMetricsSection } from '@features/admin/financeiro/components/AdoptionMetricsSection';
import { useDashboardStats } from '@features/admin/financeiro/hooks/use-dashboard-stats';
import {
  useObrasAtencao,
  useTopClientes,
  useTopEmpreiteiras,
  useReceitasPlataforma,
  useAdoptionMetrics,
  usePortfolioSummary,
  usePaymentEvolution,
  useStatusDistribution,
} from '@features/admin/financeiro/hooks/use-dashboard-tables';
import type { PeriodoSeletor, DateRange } from '@features/admin/financeiro/types';
import { HealthSummary, buildObrasHealthUrl } from '@features/shared/health';
import { ProfitSummary } from '@features/shared/profit';

const EMPTY_HEALTH = { saudavel: 0, atencao: 0, risco: 0, total: 0 };
const EMPTY_PROFIT = {
  metrics: { receitaTotal: 0, custoTotal: 0, lucroEstimado: 0, margem: 0 },
  trend: [],
  totalObras: 0,
};

export default function AdminFinanceiroPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoSeletor>('30dias');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  // Dados REAIS do dashboard financeiro (J09/J18).
  const { data: dashboardStats } = useDashboardStats();
  const { data: obrasAtencao } = useObrasAtencao();
  const { data: topClientes } = useTopClientes();
  const { data: topEmpreiteiras } = useTopEmpreiteiras();
  const { data: receitasData } = useReceitasPlataforma();
  const { data: adoptionMetrics } = useAdoptionMetrics();
  const { data: portfolioSummary } = usePortfolioSummary();
  const { data: paymentEvolution } = usePaymentEvolution(periodo);
  const { data: statusDistribution } = useStatusDistribution();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  function handlePeriodoChange(p: PeriodoSeletor) {
    if (p !== 'personalizado') setCustomRange(undefined);
    setPeriodo(p);
  }

  if (isLoading || !dashboardStats) {
    return <DashboardSkeleton />;
  }

  const healthSummary = portfolioSummary?.health ?? EMPTY_HEALTH;
  const profitSummary = portfolioSummary?.profit ?? EMPTY_PROFIT;
  const statusData = statusDistribution ?? [];
  const totalObrasStatus = statusData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* Bloco 1: Header + Seletor de período */}
      <WelcomeSection
        periodo={periodo}
        onPeriodoChange={handlePeriodoChange}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      {/* Bloco 2: KPI Cards — dados reais (J09/J18) */}
      <StatsGridContainer data={dashboardStats} />

      {/* Bloco 2.4: Saúde da plataforma (adoção, conversão, churn) — real (J18) */}
      {adoptionMetrics && <AdoptionMetricsSection metrics={adoptionMetrics} luminous />}

      {/* Bloco 2.45: Satisfação (NPS/CSAT) OCULTO — sem fonte de dados real.
          Reativar quando houver sistema de surveys. Ver docs/jornadas/20-satisfacao-nps-csat.md. */}

      {/* Bloco 2.5: Saúde do portfólio + Lucro consolidado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <HealthSummary
          summary={healthSummary}
          hrefFor={(status) => buildObrasHealthUrl('/admin/obras', status)}
          luminous
        />
        <ProfitSummary summary={profitSummary} luminous />
      </div>

      {/* Bloco 3: Gráficos — dados reais (J18) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PaymentsEvolutionChart data={paymentEvolution ?? []} luminous />
        <StatusDistributionChart data={statusData} totalObras={totalObrasStatus} luminous />
      </div>

      {/* Bloco 4: Tabela - Obras com atenção financeira */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Obras com atenção financeira
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
          Obras que requerem acompanhamento de pagamentos ou medições
        </p>
        <ObrasAtencaoTable obras={obrasAtencao ?? []} luminous />
      </div>

      {/* Bloco 5: Mini tabelas lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TopClientesTable clientes={topClientes ?? []} luminous />
        <TopEmpreiteirasTable empreiteiras={topEmpreiteiras ?? []} luminous />
      </div>

      {/* Bloco 6: Resumo de receitas (real — J18) */}
      <ReceitasPlataformaTable receitas={receitasData?.receitas ?? []} total={receitasData?.total ?? 0} luminous />

    </div>
  );
}
