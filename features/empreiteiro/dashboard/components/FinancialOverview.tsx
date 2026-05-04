'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import { StatsCard } from '@features/shared/components/StatsCard';
import { IconAnalytics, IconAttachMoney, IconCheckCircle } from '@shared/components/icons';
import { formatCompactCurrency, formatPercentage } from '../utils';
import { CashFlowChart } from './CashFlowChart';
import type { FinancialOverviewProps } from '../types';

interface FinancialOverviewExtendedProps extends FinancialOverviewProps {
  /** Aplica a borda luminosa de seção. */
  luminous?: boolean;
}

export function FinancialOverview({ data, luminous = false }: FinancialOverviewExtendedProps) {
  return (
    <Card
      className={cn(
        !luminous && 'border-border-light dark:border-gray-800 card-shadow',
        luminous && 'luminous-section border-transparent shadow-none',
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Visão Financeira Consolidada
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Acompanhamento de receitas, despesas e obras em {new Date().getFullYear()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mini Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            label="Margem de Lucro"
            value={formatPercentage(data.margemLucro)}
            icon={IconAnalytics}
            iconBgColor="bg-green-50 text-green-600 dark:bg-green-900/20"
            luminous={luminous}
          />
          <StatsCard
            label="Ticket Médio/Obra"
            value={formatCompactCurrency(data.ticketMedio)}
            icon={IconAttachMoney}
            iconBgColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20"
            badge={
              data.ticketMedioDelta > 0
                ? { label: `+${data.ticketMedioDelta}%`, variant: 'success' }
                : undefined
            }
            luminous={luminous}
          />
          <StatsCard
            label="Taxa Conclusão"
            value={formatPercentage(data.taxaConclusao)}
            icon={IconCheckCircle}
            iconBgColor="bg-primary/10 text-primary"
            badge={
              data.taxaConclusaoDelta > 0
                ? { label: `+${data.taxaConclusaoDelta}%`, variant: 'success' }
                : undefined
            }
            luminous={luminous}
          />
        </div>

        {/* Chart Section */}
        <div className="pb-2">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Fluxo de Caixa Mensal
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Receitas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Despesas
                </span>
              </div>
            </div>
          </div>
          <CashFlowChart data={data.fluxoCaixa} />
        </div>
      </CardContent>
    </Card>
  );
}
