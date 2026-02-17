'use client';

import { useRouter } from 'next/navigation';
import {
  RiToolsLine,
  RiCheckboxCircleLine,
  RiLineChartLine,
  RiWalletLine,
  RiBuilding2Line,
} from 'react-icons/ri';
import { StatsGrid } from './StatsGrid';
import { EmptyState } from './EmptyState';
import { formatCompactCurrency } from '../utils';
import type { StatsGridContainerProps, StatsCardData } from '../types';

export function StatsGridContainer({ data }: StatsGridContainerProps) {
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
          ? { label: `+${data.obrasAtivasDelta} este mês`, variant: 'success' }
          : undefined,
    },
    {
      label: 'Obras Concluídas',
      value: data.obrasConcluidas,
      icon: RiCheckboxCircleLine,
      iconBgColor: 'bg-success/10 text-success',
      badge: { label: data.obrasConcluidasPeriodo, variant: 'neutral' },
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
    },
    {
      label: 'Valor Gasto',
      value: formatCompactCurrency(data.valorGasto),
      icon: RiWalletLine,
      iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
      badge: { label: data.valorGastoPeriodo, variant: 'neutral' },
    },
  ];

  return <StatsGrid stats={stats} />;
}
