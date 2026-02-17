'use client';

import { motion } from 'framer-motion';
import {
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiWalletLine,
  RiLineChartLine,
  RiAlertLine,
  RiErrorWarningLine,
} from 'react-icons/ri';
import { StatsCard } from './StatsCard';
import type { AdminFinanceiroDashboardStats } from '../types';
import { formatCurrency, formatPercentage } from '../utils';

interface StatsGridProps {
  data: AdminFinanceiroDashboardStats;
}

export function StatsGrid({ data }: StatsGridProps) {
  const stats = [
    {
      label: 'Volume contratado',
      value: formatCurrency(data.volumeContratado),
      icon: RiMoneyDollarCircleLine,
      iconBgColor: 'bg-primary/10 text-primary',
      badge: { label: 'Contratos ativos', variant: 'primary' as const },
    },
    {
      label: 'Total pago a empreiteiras',
      value: formatCurrency(data.totalPagoEmpreiteiras),
      icon: RiCheckboxCircleLine,
      iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
      badge: {
        label: `${((data.totalPagoEmpreiteiras / data.volumeContratado) * 100).toFixed(1)}% do total`,
        variant: 'success' as const,
      },
    },
    {
      label: 'Saldo a pagar',
      value: formatCurrency(data.saldoPagar),
      icon: RiWalletLine,
      iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
      badge: {
        label: `${((data.saldoPagar / data.volumeContratado) * 100).toFixed(1)}% restante`,
        variant: 'warning' as const,
      },
    },
    {
      label: 'Taxas da plataforma',
      value: formatCurrency(data.taxasPlataforma),
      icon: RiLineChartLine,
      iconBgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
      badge: { label: 'Receita XCon', variant: 'info' as const },
    },
    {
      label: 'Obras com risco financeiro',
      value: `${data.obrasRiscoFinanceiro} obras`,
      icon: RiAlertLine,
      iconBgColor: 'bg-red-50 text-red-600 dark:bg-red-900/20',
      badge: { label: 'Atenção', variant: 'error' as const },
    },
    {
      label: 'Inadimplência',
      value: formatPercentage(data.inadimplencia),
      icon: RiErrorWarningLine,
      iconBgColor: 'bg-red-50 text-red-600 dark:bg-red-900/20',
      badge: { label: 'Sobre contratado', variant: 'error' as const },
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.08 },
        },
      }}
      initial="hidden"
      animate="show"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <StatsCard {...stat} />
        </motion.div>
      ))}
    </motion.div>
  );
}
