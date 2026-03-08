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
}

export function PagamentosEvolutionChart({ pagamentos }: PagamentosEvolutionChartProps) {
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

  return (
    <Card className="border-border-light dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Evolução Financeira
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Acompanhamento dos últimos 6 meses
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Entradas (pagamentos)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Saídas (custos extras)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 border-t-2 border-dashed border-gray-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Orçamento planejado</span>
          </div>
        </div>

        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="entradas"
                name="Entradas"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#gradEntradasPag)"
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="saidas"
                name="Saídas"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="planejado"
                name="Planejado"
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
