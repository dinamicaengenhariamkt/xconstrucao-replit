'use client';

import { RiCalendarLine } from 'react-icons/ri';
import { PeriodoSelector } from './PeriodoSelector';
import type { CaixaPeriodo, PeriodoOption } from '../types';

const PERIODO_OPTIONS: PeriodoOption<CaixaPeriodo>[] = [
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: '90dias', label: '90 dias' },
  { value: 'anoAtual', label: 'Ano atual' },
  { value: 'personalizado', label: 'Personalizado', icon: RiCalendarLine },
];

interface WelcomeSectionProps {
  periodo: CaixaPeriodo;
  onPeriodoChange: (p: CaixaPeriodo) => void;
}

export function WelcomeSection({ periodo, onPeriodoChange }: WelcomeSectionProps) {
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
      <PeriodoSelector
        options={PERIODO_OPTIONS}
        value={periodo}
        onChange={onPeriodoChange}
      />
    </div>
  );
}
