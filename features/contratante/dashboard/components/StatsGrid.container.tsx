'use client';

import {
  RiBuilding2Line,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiAlertLine,
} from 'react-icons/ri';
import { StatsGrid } from './StatsGrid';
import type { StatsGridContainerProps, StatsCardData } from '../types';

export function StatsGridContainer({ data }: StatsGridContainerProps) {
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
