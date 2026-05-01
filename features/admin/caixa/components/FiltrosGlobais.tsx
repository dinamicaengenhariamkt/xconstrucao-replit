'use client';

import { useState } from 'react';
import { RiCalendarLine } from 'react-icons/ri';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { Calendar } from '@shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { cn } from '@shared/lib/utils';
import type { CaixaPeriodo, DateRange } from '../types';

const PERIODO_OPTIONS: { key: CaixaPeriodo; label: string }[] = [
  { key: '7dias', label: '7 dias' },
  { key: '30dias', label: 'Últimos 30 dias' },
  { key: '90dias', label: '90 dias' },
  { key: 'anoAtual', label: 'Ano atual' },
  { key: 'personalizado', label: 'Personalizado' },
];

function formatRange(range: DateRange | undefined): string {
  if (!range) return 'Personalizado';
  const from = format(range.from, 'dd/MM', { locale: ptBR });
  const to = range.to ? format(range.to, 'dd/MM', { locale: ptBR }) : '...';
  return `${from} – ${to}`;
}

interface FiltrosGlobaisProps {
  periodo: CaixaPeriodo;
  onPeriodoChange: (p: CaixaPeriodo) => void;
  customRange?: DateRange;
  onCustomRangeChange: (range: DateRange | undefined) => void;
}

export function FiltrosGlobais({
  periodo,
  onPeriodoChange,
  customRange,
  onCustomRangeChange,
}: FiltrosGlobaisProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  function handleDayPickerSelect(range: DayPickerRange | undefined) {
    if (!range?.from) {
      onCustomRangeChange(undefined);
      return;
    }
    onCustomRangeChange({ from: range.from, to: range.to });
    if (range.from && range.to) {
      setPopoverOpen(false);
    }
  }

  function handlePeriodoClick(key: CaixaPeriodo) {
    if (key !== 'personalizado') {
      onCustomRangeChange(undefined);
    }
    onPeriodoChange(key);
    if (key === 'personalizado') {
      setPopoverOpen(true);
    }
  }

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Filtros globais
          </p>
          <p className="text-xs text-muted-foreground">
            Período aplicado aos KPIs, gráfico, fluxo resumo e movimentações
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex-wrap">
          {PERIODO_OPTIONS.map((p) => {
            const isActive = periodo === p.key;
            const isPersonalizado = p.key === 'personalizado';

            const button = (
              <button
                key={p.key}
                onClick={() => handlePeriodoClick(p.key)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                  isActive
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm',
                )}
                data-testid={`filtro-periodo-${p.key}`}
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
    </div>
  );
}
