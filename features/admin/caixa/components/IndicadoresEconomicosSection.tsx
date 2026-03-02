'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RiLineChartLine, RiCalendarLine } from 'react-icons/ri';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { Calendar } from '@shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { IndicadorCard } from './IndicadorCard';
import { ImpactoFinanceiroPanel } from './ImpactoFinanceiroPanel';
import { useIndicadoresEconomicos, useCaixaKpis } from '../hooks/use-caixa';
import type { CaixaPeriodo, CaixaPeriodoMacro, DateRange } from '../types';
import { ANIMATION_CONFIG } from '@features/admin/financeiro/constants';

const PERIODO_OPTIONS: { key: CaixaPeriodoMacro; label: string }[] = [
  { key: '7dias', label: '7 dias' },
  { key: '30dias', label: 'Últimos 30 dias' },
  { key: '90dias', label: '90 dias' },
  { key: 'anoAtual', label: 'Ano atual' },
  { key: 'personalizado', label: 'Personalizado' },
  { key: 'futuro', label: 'Futuro' },
];

function formatRange(range: DateRange | undefined): string {
  if (!range) return 'Personalizado';
  const from = format(range.from, 'dd/MM', { locale: ptBR });
  const to = range.to ? format(range.to, 'dd/MM', { locale: ptBR }) : '...';
  return `${from} – ${to}`;
}

export function IndicadoresEconomicosSection() {
  const [periodo, setPeriodo] = useState<CaixaPeriodoMacro>('30dias');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Coerce CaixaPeriodoMacro → CaixaPeriodo ('futuro' maps to 'anoAtual')
  const caixaPeriodo: CaixaPeriodo = periodo === 'futuro' ? 'anoAtual' : periodo;

  const { data: indicadores } = useIndicadoresEconomicos();
  const { data: kpis } = useCaixaKpis(caixaPeriodo);

  function handleDayPickerSelect(range: DayPickerRange | undefined) {
    if (!range?.from) {
      setCustomRange(undefined);
      return;
    }
    setCustomRange({ from: range.from, to: range.to });
    if (range.from && range.to) {
      setPopoverOpen(false);
    }
  }

  function handlePeriodoClick(key: CaixaPeriodoMacro) {
    if (key !== 'personalizado') setCustomRange(undefined);
    setPeriodo(key);
    if (key === 'personalizado') setPopoverOpen(true);
  }

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

        {/* Period Selector with calendar for personalizado */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex-wrap">
          {PERIODO_OPTIONS.map((p) => {
            const isActive = periodo === p.key;
            const isPersonalizado = p.key === 'personalizado';

            const button = (
              <button
                key={p.key}
                onClick={() => handlePeriodoClick(p.key)}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap
                  ${
                    isActive
                      ? 'bg-primary text-white font-bold shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                  }
                `}
              >
                {isPersonalizado && <RiCalendarLine className="w-3.5 h-3.5 shrink-0" />}
                {isPersonalizado && isActive ? formatRange(customRange) : p.label}
              </button>
            );

            if (!isPersonalizado) return button;

            return (
              <Popover key={p.key} open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>{button}</PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={customRange as DayPickerRange | undefined}
                    onSelect={handleDayPickerSelect}
                    disabled={{ after: new Date() }}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
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

      {/* Impact Framework Panel — manages its own period state independently */}
      <ImpactoFinanceiroPanel saldoAtual={kpis?.saldoDisponivel} />
    </div>
  );
}
