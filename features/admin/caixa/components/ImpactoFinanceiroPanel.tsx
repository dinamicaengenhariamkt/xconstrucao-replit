'use client';

import { useState } from 'react';
import { RiBarChartLine, RiCalendarLine } from 'react-icons/ri';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { Calendar } from '@shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import { macroImpactoByPeriodo } from '../macro-impacto-placeholder';
import { formatCurrency } from '@features/admin/financeiro/utils';
import type { CaixaPeriodoMacro, DateRange } from '../types';

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

interface ImpactoFinanceiroPanelProps {
  /** `undefined` enquanto a query não resolve → o badge exibe "—". */
  saldoAtual?: number;
}

// Sem default numérico (J40 P1 #11): o antigo `= 2_450_000` era renderizado
// como "Saldo Atual: R$ 2.450.000,00" durante o loading e em caso de erro,
// indistinguível de um saldo real.
export function ImpactoFinanceiroPanel({ saldoAtual }: ImpactoFinanceiroPanelProps) {
  const [periodo, setPeriodo] = useState<CaixaPeriodoMacro>('30dias');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const items = macroImpactoByPeriodo[periodo];

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

  return (
    <Card>
      <CardContent className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-3 bg-primary/10 text-primary rounded-lg flex-shrink-0">
              <RiBarChartLine className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Framework de Impacto Financeiro
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Análise do impacto dos indicadores macroeconômicos sobre o caixa da plataforma.
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

          <span className="text-primary text-sm font-bold bg-primary/10 px-4 py-2 rounded-full whitespace-nowrap">
            Saldo Atual: {saldoAtual === undefined ? '—' : formatCurrency(saldoAtual)}
          </span>
        </div>

        {/* Impact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={cn('flex items-start gap-3 p-4 rounded-xl', item.bgClass)}
              >
                <div className={cn('p-2 rounded-lg flex-shrink-0', item.iconBgClass, item.iconColorClass)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className={cn('text-lg font-extrabold mt-0.5', item.valueClass)}>
                    {item.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/*
          O bloco "Alerta Automático" que existia aqui era 100% inventado
          ("Se Selic cair para 10%, rendimento cai R$ 80k/ano") — nem a Selic
          nem os R$ 80k vinham de query alguma (J40 P1 #11). Ficava logo abaixo
          dos cards que honestamente exibem "—" por falta de fonte externa.
          Reintroduzir quando houver integração de indicadores macro (ver
          `macro-impacto-placeholder.ts`).
        */}
      </CardContent>
    </Card>
  );
}
