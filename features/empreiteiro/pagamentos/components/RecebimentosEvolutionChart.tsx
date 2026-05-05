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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@shared/components/ui/chart';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@shared/components/ui/card';
import { formatCurrencyCompact } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';
import type { MedicaoEmpreiteiro } from '../types';

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

const chartConfig = {
  recebido: { label: 'Recebido', color: '#22c55e' },
  aguardando: { label: 'Aguardando', color: '#f59e0b' },
};

interface RecebimentosEvolutionChartProps {
  medicoes: MedicaoEmpreiteiro[];
  /** Aplica a borda luminosa de seção. */
  luminous?: boolean;
}

export function RecebimentosEvolutionChart({ medicoes, luminous = false }: RecebimentosEvolutionChartProps) {
  const chartData = useMemo(() => {
    const byMonth: Record<string, { recebido: number; aguardando: number }> = {};

    for (const m of medicoes) {
      const key = m.dataRecebimento && m.status === 'recebido'
        ? m.dataRecebimento.slice(0, 7)
        : m.dataEnvio.slice(0, 7);
      if (!byMonth[key]) byMonth[key] = { recebido: 0, aguardando: 0 };
      if (m.status === 'recebido') {
        byMonth[key].recebido += m.valor;
      } else if (m.status === 'aguardando_aprovacao') {
        byMonth[key].aguardando += m.valor;
      }
    }

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, vals]) => {
        const month = key.split('-')[1];
        return {
          mes: MONTH_LABELS[month] ?? month,
          recebido: vals.recebido,
          aguardando: vals.aguardando,
        };
      });
  }, [medicoes]);

  if (chartData.length === 0) {
    return (
      <Card
        className={cn(
          !luminous && 'border-border-light dark:border-gray-800',
          luminous && 'luminous-section border-transparent shadow-none',
        )}
      >
        <CardHeader className="py-4">
          <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
            Evolução de Recebimentos
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
        !luminous && 'border-border-light dark:border-gray-800',
        luminous && 'luminous-section border-transparent shadow-none',
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-4 py-4 space-y-0">
        <div>
          <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
            Evolução de Recebimentos
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Valor recebido e aguardando aprovação por mês (últimos 6 meses)
          </CardDescription>
        </div>

        <div className="hidden sm:flex items-center gap-4 flex-wrap pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Recebido</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">Aguardando</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 px-4">
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <AreaChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRecebidoEmp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
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
              dataKey="recebido"
              name="Recebido"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#gradRecebidoEmp)"
              dot={{ fill: '#22c55e', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="aguardando"
              name="Aguardando"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ fill: '#f59e0b', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
