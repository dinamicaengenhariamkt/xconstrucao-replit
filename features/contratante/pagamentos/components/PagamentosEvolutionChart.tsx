'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@shared/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import type { PagamentoContratante } from '../types';
import { formatCurrencyCompact } from '@shared/lib/formatters';

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

const chartConfig = {
  entradas: { label: 'Entradas', color: '#3b82f6' },
  saidas: { label: 'Saídas', color: '#ef4444' },
  planejado: { label: 'Planejado', color: '#9ca3af' },
};


interface PagamentosEvolutionChartProps {
  pagamentos: PagamentoContratante[];
  luminous?: boolean;
}

export function PagamentosEvolutionChart({ pagamentos, luminous = false }: PagamentosEvolutionChartProps) {
  const chartData = useMemo(() => {
    const byMonth: Record<string, { entradas: number; saidas: number }> = {};

    for (const p of pagamentos) {
      const [year, month] = p.data.split('-');
      const key = `${year}-${month}`;
      if (!byMonth[key]) byMonth[key] = { entradas: 0, saidas: 0 };
      if (p.tipo === 'entrada') byMonth[key].entradas += p.valor;
      else byMonth[key].saidas += p.valor;
    }

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, vals]) => {
        const month = key.split('-')[1];
        const planejado = (vals.entradas + vals.saidas) * 0.85;
        return {
          mes: MONTH_LABELS[month] ?? month,
          entradas: vals.entradas,
          saidas: vals.saidas,
          planejado: Math.round(planejado),
        };
      });
  }, [pagamentos]);

  if (chartData.length === 0) {
    return (
      <Card
        className={cn(
          'border-border-light dark:border-gray-800',
          luminous && 'luminous-section border-transparent shadow-none',
        )}
      >
        <CardHeader className="py-4">
          <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
            Evolução Financeira
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Sem movimentações no período selecionado.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'border-border-light dark:border-gray-800',
        luminous && 'luminous-section border-transparent shadow-none',
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 py-4 space-y-0">
        <div>
          <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
            Evolução Financeira
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Entradas, saídas e orçamento planejado por mês
          </CardDescription>
        </div>

        <div className="hidden sm:flex items-center gap-4 flex-wrap pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Entradas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Saídas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 border-t-2 border-dashed border-gray-400" />
            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Planejado</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 px-4">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradEntradasPag" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrencyCompact}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="entradas"
              name="Entradas"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#gradEntradasPag)"
              dot={{ fill: '#3b82f6', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="saidas"
              name="Saídas"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="planejado"
              name="Planejado"
              stroke="#9ca3af"
              strokeWidth={1.5}
              strokeDasharray="5 4"
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
