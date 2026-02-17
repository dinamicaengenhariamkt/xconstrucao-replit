'use client';

import { RiCalendarLine } from 'react-icons/ri';
import type { PeriodoSeletor, WelcomeSectionProps } from '../types';

const periodos: { key: PeriodoSeletor; label: string; hasIcon?: boolean }[] = [
  { key: '30dias', label: 'Últimos 30 dias' },
  { key: '3meses', label: '3 meses' },
  { key: '12meses', label: '12 meses' },
  { key: 'personalizado', label: 'Personalizado', hasIcon: true },
];

export function WelcomeSection({ periodo, onPeriodoChange }: WelcomeSectionProps) {
  return (
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
        {periodos.map((p) => (
          <button
            key={p.key}
            onClick={() => onPeriodoChange(p.key)}
            className={`
              px-3 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1
              ${
                periodo === p.key
                  ? 'bg-primary text-white font-bold shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
              }
            `}
          >
            {p.hasIcon && <RiCalendarLine className="w-4 h-4" />}
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
