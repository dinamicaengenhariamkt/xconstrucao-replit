'use client';

import { useState } from 'react';
import { RiCalendarLine } from 'react-icons/ri';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { Calendar } from '@shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import type { PeriodoSeletor, WelcomeSectionProps } from '../types';

const periodos: { key: PeriodoSeletor; label: string }[] = [
  { key: '30dias', label: 'Últimos 30 dias' },
  { key: '3meses', label: '3 meses' },
  { key: '12meses', label: '12 meses' },
  { key: 'personalizado', label: 'Personalizado' },
];

function formatRange(range: { from: Date; to?: Date } | undefined): string {
  if (!range) return 'Personalizado';
  const from = format(range.from, 'dd/MM', { locale: ptBR });
  const to = range.to ? format(range.to, 'dd/MM', { locale: ptBR }) : '...';
  return `${from} – ${to}`;
}

export function WelcomeSection({ periodo, onPeriodoChange, customRange, onCustomRangeChange }: WelcomeSectionProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  function handleDayPickerSelect(range: DayPickerRange | undefined) {
    if (!range?.from) {
      onCustomRangeChange(undefined);
      return;
    }
    const next = { from: range.from, to: range.to };
    onCustomRangeChange(next);
    if (range.from && range.to) {
      setPopoverOpen(false);
    }
  }

  function handlePeriodoClick(key: PeriodoSeletor) {
    if (key !== 'personalizado') {
      onCustomRangeChange(undefined);
    }
    onPeriodoChange(key);
    if (key === 'personalizado') {
      setPopoverOpen(true);
    }
  }

  const periodoLabel =
    periodo === 'personalizado'
      ? formatRange(customRange)
      : periodos.find((p) => p.key === periodo)?.label ?? '';

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
          Financeiro
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Visão consolidada dos fluxos financeiros da plataforma.
        </p>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {periodos.map((p) => {
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

      {/* Legenda honesta de escopo: o período rege apenas a série temporal,
          não os KPIs/snapshots consolidados. */}
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/40 px-4 py-3 flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
          <RiCalendarLine className="w-3.5 h-3.5" />
          Período: {periodoLabel}
        </span>
        <span className="text-xs text-muted-foreground">
          Aplica-se à <strong className="font-semibold">evolução de pagamentos × medições</strong>.
          Os KPIs, saúde do portfólio e distribuição refletem a posição atual.
        </span>
      </div>
    </div>
  );
}
