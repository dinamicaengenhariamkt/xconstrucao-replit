'use client';

import {
  RiBankLine,
  RiArrowRightUpLine,
  RiArrowRightDownLine,
  RiArrowUpDownLine,
  RiLineChartLine,
  RiTimerLine,
} from 'react-icons/ri';
import { StatsGrid } from '@features/admin/financeiro/components/StatsGrid';
import { formatCurrency } from '@features/admin/financeiro/utils';
import { useCaixaKpis } from '../hooks/use-caixa';
import type { CaixaPeriodo } from '../types';

interface KpiGridContainerProps {
  periodo: CaixaPeriodo;
}

export function KpiGridContainer({ periodo }: KpiGridContainerProps) {
  const { data: kpis } = useCaixaKpis(periodo);

  if (!kpis) return null;

  const stats = [
    {
      label: 'Saldo disponível',
      value: formatCurrency(kpis.saldoDisponivel),
      icon: RiBankLine,
      iconBgColor: 'bg-primary/10 text-primary',
      badge: { label: `Atualizado ${kpis.saldoAtualizadoEm}`, variant: 'primary' as const },
    },
    {
      label: 'Entradas no período',
      value: formatCurrency(kpis.entradasPeriodo),
      icon: RiArrowRightUpLine,
      iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
      badge: { label: kpis.entradasVariacao, variant: 'success' as const },
    },
    {
      label: 'Saídas no período',
      value: formatCurrency(kpis.saidasPeriodo),
      icon: RiArrowRightDownLine,
      iconBgColor: 'bg-red-500/10 text-red-600',
      badge: { label: kpis.saidasVariacao, variant: 'error' as const },
    },
    {
      label: 'Resultado do período',
      value: `+ ${formatCurrency(kpis.resultadoPeriodo)}`,
      icon: RiArrowUpDownLine,
      iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
      badge: { label: kpis.resultadoLabel, variant: 'success' as const },
    },
    {
      label: 'Saldo projetado',
      value: formatCurrency(kpis.saldoProjetado),
      icon: RiLineChartLine,
      iconBgColor: 'bg-blue-500/10 text-blue-600',
      badge: { label: kpis.saldoProjetadoLabel, variant: 'info' as const },
    },
    {
      label: 'Dias de caixa',
      value: `${kpis.diasCaixa} dias`,
      icon: RiTimerLine,
      iconBgColor: 'bg-amber-500/10 text-amber-500',
      badge: { label: kpis.diasCaixaLabel, variant: 'warning' as const },
    },
  ];

  // Ativa o efeito luminoso em todos os KPIs do caixa admin.
  const luminousStats = stats.map((s) => ({ ...s, luminous: true }));

  return <StatsGrid stats={luminousStats} />;
}
