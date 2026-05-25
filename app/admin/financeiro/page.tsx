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
import { SatisfactionMetricsSection } from '@features/admin/financeiro/components/SatisfactionMetricsSection';
import { mockStatsByPeriodo } from '@features/admin/financeiro/mocks/dashboard-stats.mock';
import { mockAdoptionMetrics } from '@features/admin/financeiro/mocks/adoption-metrics.mock';
import { mockSatisfactionMetrics } from '@features/admin/financeiro/mocks/satisfaction-metrics.mock';
import {
  getPaymentEvolutionByPeriodo,
  mockStatusDistributionData,
} from '@features/admin/financeiro/mocks/financial-data.mock';
import {
  mockObrasAtencao,
  mockTopClientes,
  mockTopEmpreiteiras,
  mockReceitasPlataforma,
  mockTotalReceitas,
} from '@features/admin/financeiro/mocks/obras.mock';
import type { PeriodoSeletor, DateRange } from '@features/admin/financeiro/types';
import { useAdminObras } from '@features/admin/obras/hooks/use-obras-list';
import { HealthSummary, getMockHealthSummary, buildObrasHealthUrl } from '@features/shared/health';
import { ProfitSummary, getMockProfitSummary } from '@features/shared/profit';

export default function AdminFinanceiroPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoSeletor>('30dias');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const { data: obras } = useAdminObras();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  function handlePeriodoChange(p: PeriodoSeletor) {
    if (p !== 'personalizado') setCustomRange(undefined);
    setPeriodo(p);
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const obraIds = (obras?.rows ?? []).map((o) => o.id);
  const healthSummary = getMockHealthSummary(obraIds);
  const profitSummary = getMockProfitSummary(obraIds);

  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* Bloco 1: Header + Seletor de período */}
      <WelcomeSection
        periodo={periodo}
        onPeriodoChange={handlePeriodoChange}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      {/* Bloco 2: KPI Cards */}
      <StatsGridContainer data={mockStatsByPeriodo[periodo]} />

      {/* Bloco 2.4: Saúde da plataforma (adoção, conversão, churn) */}
      <AdoptionMetricsSection metrics={mockAdoptionMetrics} luminous />

      {/* Bloco 2.45: Satisfação dos usuários (NPS + CSAT) */}
      <SatisfactionMetricsSection metrics={mockSatisfactionMetrics} luminous />

      {/* Bloco 2.5: Saúde do portfólio + Lucro consolidado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <HealthSummary
          summary={healthSummary}
          hrefFor={(status) => buildObrasHealthUrl('/admin/obras', status)}
          luminous
        />
        <ProfitSummary summary={profitSummary} luminous />
      </div>

      {/* Bloco 3: Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PaymentsEvolutionChart data={getPaymentEvolutionByPeriodo(periodo)} luminous />
        <StatusDistributionChart data={mockStatusDistributionData} totalObras={42} luminous />
      </div>

      {/* Bloco 4: Tabela - Obras com atenção financeira */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Obras com atenção financeira
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
          Obras que requerem acompanhamento de pagamentos ou medições
        </p>
        <ObrasAtencaoTable obras={mockObrasAtencao} luminous />
      </div>

      {/* Bloco 5: Mini tabelas lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TopClientesTable clientes={mockTopClientes} luminous />
        <TopEmpreiteirasTable empreiteiras={mockTopEmpreiteiras} luminous />
      </div>

      {/* Bloco 6: Resumo de receitas */}
      <ReceitasPlataformaTable receitas={mockReceitasPlataforma} total={mockTotalReceitas} luminous />

    </div>
  );
}
