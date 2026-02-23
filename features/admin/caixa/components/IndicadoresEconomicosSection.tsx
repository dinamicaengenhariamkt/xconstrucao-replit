'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RiLineChartLine, RiCalendarLine } from 'react-icons/ri';
import { IndicadorCard } from './IndicadorCard';
import { ImpactoFinanceiroPanel } from './ImpactoFinanceiroPanel';
import { PeriodoSelector } from './PeriodoSelector';
import { useIndicadoresEconomicos, useCaixaKpis } from '../hooks/use-caixa';
import type { CaixaPeriodoMacro, PeriodoOption } from '../types';
import { ANIMATION_CONFIG } from '@features/admin/financeiro/constants';

const PERIODO_OPTIONS: PeriodoOption<CaixaPeriodoMacro>[] = [
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: '90dias', label: '90 dias' },
  { value: 'anoAtual', label: 'Ano atual' },
  { value: 'personalizado', label: 'Personalizado', icon: RiCalendarLine },
  { value: 'futuro', label: 'Futuro' },
];

export function IndicadoresEconomicosSection() {
  const [periodo, setPeriodo] = useState<CaixaPeriodoMacro>('30dias');
  const { data: indicadores } = useIndicadoresEconomicos();
  const { data: kpis } = useCaixaKpis();

  if (!indicadores) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
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
        <PeriodoSelector
          options={PERIODO_OPTIONS}
          value={periodo}
          onChange={setPeriodo}
        />
      </div>

      {/* Economic Index Cards */}
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

      {/* Impact Framework Panel */}
      <ImpactoFinanceiroPanel
        saldoAtual={kpis?.saldoDisponivel}
        periodo={periodo}
        onPeriodoChange={setPeriodo}
      />
    </div>
  );
}
