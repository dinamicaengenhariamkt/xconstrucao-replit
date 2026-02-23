'use client';

import { RiBarChartLine, RiAlertLine, RiCalendarLine } from 'react-icons/ri';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import { PeriodoSelector } from './PeriodoSelector';
import { mockImpactoFinanceiro } from '../mocks';
import { formatCurrency } from '@features/admin/financeiro/utils';
import type { CaixaPeriodoMacro, PeriodoOption } from '../types';

const PERIODO_OPTIONS: PeriodoOption<CaixaPeriodoMacro>[] = [
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: '90dias', label: '90 dias' },
  { value: 'anoAtual', label: 'Ano atual' },
  { value: 'personalizado', label: 'Personalizado', icon: RiCalendarLine },
  { value: 'futuro', label: 'Futuro' },
];

interface ImpactoFinanceiroPanelProps {
  saldoAtual?: number;
  periodo: CaixaPeriodoMacro;
  onPeriodoChange: (p: CaixaPeriodoMacro) => void;
}

export function ImpactoFinanceiroPanel({
  saldoAtual = 2_450_000,
  periodo,
  onPeriodoChange,
}: ImpactoFinanceiroPanelProps) {
  const items = mockImpactoFinanceiro;

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
          <PeriodoSelector
            options={PERIODO_OPTIONS}
            value={periodo}
            onChange={onPeriodoChange}
          />
          <span className="text-primary text-sm font-bold bg-primary/10 px-4 py-2 rounded-full whitespace-nowrap">
            Saldo Atual: {formatCurrency(saldoAtual)}
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

        {/* Alerta */}
        <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 mt-6">
          <div className="flex-shrink-0 w-8 h-8 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center">
            <RiAlertLine className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              Alerta Automático
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              Se Selic cair para <span className="font-bold text-gray-900 dark:text-gray-100">10%</span>,
              rendimento cai{' '}
              <span className="font-bold text-red-600">R$ 80k/ano</span>.
              Recomenda-se reavaliar estratégia de alocação do caixa.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
