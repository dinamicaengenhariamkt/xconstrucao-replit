'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { FinancialMiniCard } from './FinancialMiniCard';
import { CashFlowChart } from './CashFlowChart';
import type { FinancialOverview as FinancialOverviewType } from '../types';

interface FinancialOverviewProps {
  data: FinancialOverviewType;
}

export function FinancialOverview({ data }: FinancialOverviewProps) {
  return (
    <Card className="border-border-light dark:border-gray-800 card-shadow">
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
          <FinancialMiniCard
            label="Margem de Lucro"
            value={data.margemLucro}
            format="percentage"
            color="success"
            trend="up"
          />
          <FinancialMiniCard
            label="Ticket Médio/Obra"
            value={data.ticketMedio}
            format="currency"
            color="info"
            trend="up"
            delta={data.ticketMedioDelta}
          />
          <FinancialMiniCard
            label="Taxa Conclusão"
            value={data.taxaConclusao}
            format="percentage"
            color="primary"
            trend="up"
            delta={data.taxaConclusaoDelta}
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
