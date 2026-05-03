'use client';

import { useRouter } from 'next/navigation';
import {
  RiToolsLine,
  RiCheckboxCircleLine,
  RiLineChartLine,
  RiWalletLine,
  RiBuilding2Line,
  RiAlertLine,
} from 'react-icons/ri';
import { buildObrasHealthUrl } from '@features/shared/health';
import { StatsGrid } from './StatsGrid';
import { EmptyState } from './EmptyState';
import { formatCompactCurrency } from '../utils';
import type { StatsGridContainerProps, StatsCardData } from '../types';

export function StatsGridContainer({ data, healthSummary }: StatsGridContainerProps) {
  const router = useRouter();

  if (!data || (data.obrasAtivas === 0 && data.obrasConcluidas === 0)) {
    return (
      <EmptyState
        icon={RiBuilding2Line}
        title="Nenhuma obra cadastrada"
        description="Comece cadastrando sua primeira obra para acompanhar o progresso"
        action={{
          label: 'Cadastrar Primeira Obra',
          onClick: () => router.push('/empreiteiro/minhas-obras'),
        }}
      />
    );
  }

  const stats: StatsCardData[] = [
    {
      label: 'Obras Ativas',
      value: data.obrasAtivas,
      icon: RiToolsLine,
      iconBgColor: 'bg-primary/10 text-primary',
      badge:
        data.obrasAtivasDelta > 0
          ? { label: `+${data.obrasAtivasDelta} este período`, variant: 'success' }
          : undefined,
      href: '/empreiteiro/minhas-obras?status=em_execucao',
      testId: 'kpi-obras-ativas',
    },
    {
      label: 'Obras Concluídas',
      value: data.obrasConcluidas,
      icon: RiCheckboxCircleLine,
      iconBgColor: 'bg-success/10 text-success',
      badge: { label: data.obrasConcluidasPeriodo, variant: 'neutral' },
      href: '/empreiteiro/minhas-obras?status=finalizada',
      testId: 'kpi-obras-concluidas',
    },
    {
      label: 'Valor Recebido',
      value: formatCompactCurrency(data.valorRecebido),
      icon: RiLineChartLine,
      iconBgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
      badge:
        data.valorRecebidoDelta > 0
          ? { label: `+${data.valorRecebidoDelta}%`, variant: 'success' }
          : undefined,
      href: '/empreiteiro/pagamentos',
      testId: 'kpi-valor-recebido',
    },
    {
      label: 'Valor Gasto',
      value: formatCompactCurrency(data.valorGasto),
      icon: RiWalletLine,
      iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
      badge: { label: data.valorGastoPeriodo, variant: 'amber' },
      testId: 'kpi-valor-gasto',
    },
  ];

  if (healthSummary) {
    stats.push({
      label: 'Obras em Risco',
      value: healthSummary.risco,
      icon: RiAlertLine,
      iconBgColor: 'bg-red-50 text-red-600 dark:bg-red-900/20',
      badge: { label: 'Atenção', variant: 'red' },
      href: buildObrasHealthUrl('/empreiteiro/minhas-obras', 'risco'),
      testId: 'kpi-obras-em-risco',
    });
  }

  return <StatsGrid stats={stats} />;
}
