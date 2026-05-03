'use client';

import { cn } from '@shared/lib/utils';
import type { DashboardPeriodo } from '../types';

const PERIOD_OPTIONS: { value: DashboardPeriodo; label: string }[] = [
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: '3meses', label: '3 meses' },
  { value: '12meses', label: '12 meses' },
];

interface DashboardPeriodSelectorProps {
  value: DashboardPeriodo;
  onChange: (next: DashboardPeriodo) => void;
  description?: string;
}

export function DashboardPeriodSelector({
  value,
  onChange,
  description = 'Período aplicado aos KPIs e ao gráfico de evolução',
}: DashboardPeriodSelectorProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/40 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Filtro global
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex-wrap">
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm',
                )}
                data-testid={`dashboard-periodo-${opt.value}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
