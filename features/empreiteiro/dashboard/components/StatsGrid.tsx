'use client';

import { motion } from 'framer-motion';
import {
  RiToolsLine,
  RiCheckboxCircleLine,
  RiLineChartLine,
  RiWalletLine,
  RiBuilding2Line,
} from 'react-icons/ri';
import { StatsCard } from './StatsCard';
import { EmptyState } from './EmptyState';
import { formatCompactCurrency } from '../utils';
import type { DashboardStats } from '../types';
import { useRouter } from 'next/navigation';

interface StatsGridProps {
  data: DashboardStats;
}

export function StatsGrid({ data }: StatsGridProps) {
  const router = useRouter();

  // Verifica se não há dados
  if (!data || (data.obrasAtivas === 0 && data.obrasConcluidas === 0)) {
    return (
      <EmptyState
        icon={RiBuilding2Line}
        title="Nenhuma obra cadastrada"
        description="Comece cadastrando sua primeira obra para acompanhar o progresso"
        action={{
          label: "Cadastrar Primeira Obra",
          onClick: () => router.push('/empreiteiro/minhas-obras'),
        }}
      />
    );
  }

  const stats = [
    {
      label: 'Obras Ativas',
      value: data.obrasAtivas,
      icon: RiToolsLine,
      iconBgColor: 'bg-primary/10 text-primary',
      badge:
        data.obrasAtivasDelta > 0
          ? {
              label: `+${data.obrasAtivasDelta} este mês`,
              variant: 'success' as const,
            }
          : undefined,
    },
    {
      label: 'Obras Concluídas',
      value: data.obrasConcluidas,
      icon: RiCheckboxCircleLine,
      iconBgColor: 'bg-success/10 text-success',
      badge: {
        label: data.obrasConcluidasPeriodo,
        variant: 'neutral' as const,
      },
    },
    {
      label: 'Valor Recebido',
      value: formatCompactCurrency(data.valorRecebido),
      icon: RiLineChartLine,
      iconBgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
      badge:
        data.valorRecebidoDelta > 0
          ? {
              label: `+${data.valorRecebidoDelta}%`,
              variant: 'success' as const,
            }
          : undefined,
    },
    {
      label: 'Valor Gasto',
      value: formatCompactCurrency(data.valorGasto),
      icon: RiWalletLine,
      iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
      badge: {
        label: data.valorGastoPeriodo,
        variant: 'neutral' as const,
      },
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      initial="hidden"
      animate="show"
    >
      {stats.map((stat, index) => (
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
