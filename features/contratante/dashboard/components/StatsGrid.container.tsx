'use client';

import {
  RiBuilding2Line,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri';
import { StatsGrid } from './StatsGrid';
import { formatCurrencyCompact } from '@shared/lib/formatters';
import type { StatsGridContainerProps, StatsCardData } from '../types';
import type { StatsCardBadgeVariant } from '@features/shared/components/StatsCard';

function orcamentoBadgeVariant(percent: number): StatsCardBadgeVariant {
  if (percent <= 100) return 'success';
  if (percent <= 110) return 'amber';
  return 'red';
}

export function StatsGridContainer({ data }: StatsGridContainerProps) {
  const orcamentoPercent =
    data.orcamentoTotal > 0
      ? Math.round((data.orcamentoExecutado / data.orcamentoTotal) * 100)
      : 0;

  const stats: StatsCardData[] = [
    {
      label: 'Obras Ativas',
      value: data.obrasAtivas,
      icon: RiBuilding2Line,
      iconBgColor: 'bg-primary/10 text-primary',
      // Só mostra o delta quando há variação real — mesmo padrão do
      // dashboard do empreiteiro. Antes exibia "+0 este mês" sempre (J40 P1 #7).
      badge:
        data.obrasAtivasDelta > 0
          ? { label: `+${data.obrasAtivasDelta} este mês`, variant: 'success' }
          : undefined,
      href: '/contratante/minhas-obras?status=em_execucao',
      testId: 'kpi-obras-ativas',
    },
    // "Percentual Previsto" foi removido: o servidor define
    // `percentualPrevisto = percentualConcluido` (não há cronograma baseline),
    // então o card exibia o MESMO número do "Percentual Concluído" ao lado,
    // rotulado como "Meta" — sugeria uma meta independente que não existe.
    // Reintroduzir quando houver baseline planejado em obra_etapas.
    {
      label: 'Percentual Concluído',
      value: `${data.percentualConcluido}%`,
      icon: RiCheckboxCircleLine,
      iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
      badge:
        data.desvioPercentual !== 0
          ? { label: `${data.desvioPercentual}% do prev.`, variant: 'amber' }
          : undefined,
      href: '/contratante/minhas-obras?status=finalizada',
      testId: 'kpi-percentual-concluido',
    },
    {
      label: 'Orçamento Realizado',
      value: formatCurrencyCompact(data.orcamentoExecutado),
      icon: RiMoneyDollarCircleLine,
      iconBgColor: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20',
      badge: {
        label: `${orcamentoPercent}% do orçado`,
        variant: orcamentoBadgeVariant(orcamentoPercent),
      },
      testId: 'kpi-orcamento-realizado',
    },
    {
      label: 'Obras Atrasadas',
      value: data.obrasAtrasadas,
      icon: RiAlertLine,
      iconBgColor: 'bg-red-50 text-red-600',
      badge: { label: 'Atenção', variant: 'red' },
      href: '/contratante/minhas-obras?status=com_atrasos',
      testId: 'kpi-obras-atrasadas',
    },
  ];

  // Ativa o efeito luminoso em todos os KPIs do dashboard contratante.
  const luminousStats = stats.map((s) => ({ ...s, luminous: true }));

  return <StatsGrid stats={luminousStats} />;
}
