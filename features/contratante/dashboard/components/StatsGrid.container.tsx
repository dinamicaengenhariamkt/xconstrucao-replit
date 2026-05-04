'use client';

import {
  RiBuilding2Line,
  RiTimeLine,
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
      badge: { label: `+${data.obrasAtivasDelta} este mês`, variant: 'success' },
      href: '/contratante/minhas-obras?status=em_execucao',
      testId: 'kpi-obras-ativas',
    },
    {
      label: 'Percentual Previsto',
      value: `${data.percentualPrevisto}%`,
      icon: RiTimeLine,
      iconBgColor: 'bg-blue-50 text-blue-600',
      badge: { label: 'Meta', variant: 'blue' },
    },
    {
      label: 'Percentual Concluído',
      value: `${data.percentualConcluido}%`,
      icon: RiCheckboxCircleLine,
      iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
      badge: { label: `${data.desvioPercentual}% do prev.`, variant: 'amber' },
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

  return <StatsGrid stats={stats} />;
}
