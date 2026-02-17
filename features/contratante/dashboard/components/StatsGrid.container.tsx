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
    },
    {
      label: 'Obras Atrasadas',
      value: data.obrasAtrasadas,
      icon: RiAlertLine,
      iconBgColor: 'bg-red-50 text-red-600',
      badge: { label: 'Atenção', variant: 'red' },
    },
  ];

  return <StatsGrid stats={stats} />;
}
