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
import { ExportBanner } from '@features/admin/financeiro/components/ExportBanner';
import { DashboardSkeleton } from '@features/admin/financeiro/components/DashboardSkeleton';
import { mockStatsByPeriodo } from '@features/admin/financeiro/mocks/dashboard-stats.mock';
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

export default function AdminFinanceiroPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState<PeriodoSeletor>('30dias');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);

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

      {/* Bloco 3: Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PaymentsEvolutionChart data={getPaymentEvolutionByPeriodo(periodo)} />
        <StatusDistributionChart data={mockStatusDistributionData} totalObras={42} />
      </div>

      {/* Bloco 4: Tabela - Obras com atenção financeira */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Obras com atenção financeira
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
          Obras que requerem acompanhamento de pagamentos ou medições
        </p>
        <ObrasAtencaoTable obras={mockObrasAtencao} />
      </div>

      {/* Bloco 5: Mini tabelas lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TopClientesTable clientes={mockTopClientes} />
        <TopEmpreiteirasTable empreiteiras={mockTopEmpreiteiras} />
      </div>

      {/* Bloco 6: Resumo de receitas */}
      <ReceitasPlataformaTable receitas={mockReceitasPlataforma} total={mockTotalReceitas} />

      {/* Bloco 7: Export Banner */}
      <ExportBanner />
    </div>
  );
}
