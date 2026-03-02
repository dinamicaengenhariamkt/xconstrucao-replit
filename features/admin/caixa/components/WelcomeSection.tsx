'use client';

import { useState } from 'react';
import { RiCalendarLine } from 'react-icons/ri';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { Calendar } from '@shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
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

interface WelcomeSectionProps {
  periodo: CaixaPeriodo;
  onPeriodoChange: (p: CaixaPeriodo) => void;
  customRange?: DateRange;
  onCustomRangeChange: (range: DateRange | undefined) => void;
}

export function WelcomeSection({ periodo, onPeriodoChange, customRange, onCustomRangeChange }: WelcomeSectionProps) {
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
    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
          Caixa
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Acompanhamento do fluxo de caixa da plataforma por período.
        </p>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {PERIODO_OPTIONS.map((p) => {
          const isActive = periodo === p.key;
          const isPersonalizado = p.key === 'personalizado';

          const button = (
            <button
              key={p.key}
              onClick={() => handlePeriodoClick(p.key)}
              className={`
                px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5
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
  );
}
