'use client';

import { motion } from 'framer-motion';
import {
  RiBuilding2Line,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiAlertLine,
} from 'react-icons/ri';
import { StatsCard } from './StatsCard';
import { ContratanteDashboardStats } from '../types';

interface StatsGridProps {
  data: ContratanteDashboardStats;
}

export function StatsGrid({ data }: StatsGridProps) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.1 },
        },
      }}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
        <StatsCard
          label="Obras Ativas"
          value={data.obrasAtivas}
          icon={RiBuilding2Line}
          iconBgColor="bg-primary/10 text-primary"
          badge={{ label: `+${data.obrasAtivasDelta} este mês`, variant: 'success' }}
        />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
        <StatsCard
          label="Percentual Previsto"
          value={`${data.percentualPrevisto}%`}
          icon={RiTimeLine}
          iconBgColor="bg-blue-50 text-blue-600"
          badge={{ label: 'Meta', variant: 'blue' }}
        />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
        <StatsCard
          label="Percentual Concluído"
          value={`${data.percentualConcluido}%`}
          icon={RiCheckboxCircleLine}
          iconBgColor="bg-[#22846D]/10 text-[#22846D]"
          badge={{ label: `${data.desvioPercentual}% do prev.`, variant: 'amber' }}
        />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
        <StatsCard
          label="Obras Atrasadas"
          value={data.obrasAtrasadas}
          icon={RiAlertLine}
          iconBgColor="bg-red-50 text-red-600"
          badge={{ label: 'Atenção', variant: 'red' }}
        />
      </motion.div>
    </motion.div>
  );
}
