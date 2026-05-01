'use client';

import { motion } from 'framer-motion';
import { RiLineChartLine } from 'react-icons/ri';
import { IndicadorCard } from './IndicadorCard';
import { ImpactoFinanceiroPanel } from './ImpactoFinanceiroPanel';
import { useIndicadoresEconomicos, useCaixaKpis } from '../hooks/use-caixa';
import type { CaixaPeriodo } from '../types';
import { ANIMATION_CONFIG } from '@features/admin/financeiro/constants';

interface IndicadoresEconomicosSectionProps {
  periodo: CaixaPeriodo;
}

export function IndicadoresEconomicosSection({ periodo }: IndicadoresEconomicosSectionProps) {
  const { data: indicadores } = useIndicadoresEconomicos();
  const { data: kpis } = useCaixaKpis(periodo);

  if (!indicadores) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg">
          <RiLineChartLine className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight uppercase">
            Visão Macroeconômica do Caixa
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Acompanhe os principais indicadores econômicos que impactam o caixa e as operações da plataforma.
          </p>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: ANIMATION_CONFIG.stagger.children },
          },
        }}
        initial="hidden"
        animate="show"
      >
        {indicadores.map((indicador) => (
          <motion.div
            key={indicador.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <IndicadorCard indicador={indicador} />
          </motion.div>
        ))}
      </motion.div>

      <ImpactoFinanceiroPanel saldoAtual={kpis?.saldoDisponivel} />
    </div>
  );
}
