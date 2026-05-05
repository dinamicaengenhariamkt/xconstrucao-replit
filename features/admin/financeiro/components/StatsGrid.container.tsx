'use client';

import {
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiWalletLine,
  RiLineChartLine,
  RiAlertLine,
  RiErrorWarningLine,
} from 'react-icons/ri';
import { StatsGrid } from './StatsGrid';
import type { StatsGridContainerProps, StatsCardData } from '../types';
import { formatCurrency, formatPercentage } from '../utils';

export function StatsGridContainer({ data }: StatsGridContainerProps) {
  const stats: StatsCardData[] = [
    {
      label: 'Volume contratado',
      value: formatCurrency(data.volumeContratado),
      icon: RiMoneyDollarCircleLine,
      iconBgColor: 'bg-primary/10 text-primary',
      badge: { label: 'Contratos ativos', variant: 'primary' },
    },
    {
      label: 'Total pago a empreiteiras',
      value: formatCurrency(data.totalPagoEmpreiteiras),
      icon: RiCheckboxCircleLine,
      iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
      badge: {
        label: `${((data.totalPagoEmpreiteiras / data.volumeContratado) * 100).toFixed(1)}% do total`,
        variant: 'success',
      },
    },
    {
      label: 'Saldo a pagar',
      value: formatCurrency(data.saldoPagar),
      icon: RiWalletLine,
      iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
      badge: {
        label: `${((data.saldoPagar / data.volumeContratado) * 100).toFixed(1)}% restante`,
        variant: 'warning',
      },
    },
    {
      label: 'Taxas da plataforma',
      value: formatCurrency(data.taxasPlataforma),
      icon: RiLineChartLine,
      iconBgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
      badge: { label: 'Receita XCon', variant: 'info' },
    },
    {
      label: 'Obras com risco financeiro',
      value: `${data.obrasRiscoFinanceiro} obras`,
      icon: RiAlertLine,
      iconBgColor: 'bg-red-50 text-red-600 dark:bg-red-900/20',
      badge: { label: 'Atenção', variant: 'error' },
    },
    {
      label: 'Inadimplência',
      value: formatPercentage(data.inadimplencia),
      icon: RiErrorWarningLine,
      iconBgColor: 'bg-red-50 text-red-600 dark:bg-red-900/20',
      badge: { label: 'Sobre contratado', variant: 'error' },
    },
  ];

  // Ativa o efeito luminoso em todos os KPIs do financeiro admin.
  const luminousStats = stats.map((s) => ({ ...s, luminous: true }));

  return <StatsGrid stats={luminousStats} />;
}
