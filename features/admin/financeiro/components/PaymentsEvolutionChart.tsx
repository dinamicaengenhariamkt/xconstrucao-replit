'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import type { PaymentsEvolutionChartProps, PaymentsEvolutionChartTooltipProps } from '../types';
import { ADMIN_DASHBOARD_COLORS } from '../constants';

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(0)}K`;
  return `R$${value}`;
}

function CustomTooltip({ active, payload, label }: PaymentsEvolutionChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 shadow-lg text-sm space-y-1">
      <p className="font-bold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {formatYAxis(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface PaymentsEvolutionChartExtendedProps extends PaymentsEvolutionChartProps {
  luminous?: boolean;
}

export function PaymentsEvolutionChart({ data, luminous = false }: PaymentsEvolutionChartExtendedProps) {
  return (
    <Card
      className={cn(
        'border-border-light dark:border-gray-800',
        luminous && 'luminous-section border-transparent shadow-none',
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Evolução de pagamentos × medições
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Comparativo mensal do período
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Legend */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ADMIN_DASHBOARD_COLORS.info }} />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Medições aprovadas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ADMIN_DASHBOARD_COLORS.success }} />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Pagamentos efetuados
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="gradientMedicoes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ADMIN_DASHBOARD_COLORS.info} stopOpacity={0.15} />
                <stop offset="100%" stopColor={ADMIN_DASHBOARD_COLORS.info} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientPagamentos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ADMIN_DASHBOARD_COLORS.success} stopOpacity={0.15} />
                <stop offset="100%" stopColor={ADMIN_DASHBOARD_COLORS.success} stopOpacity={0} />
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
              tickFormatter={formatYAxis}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="medicoes"
              name="Medições aprovadas"
              stroke={ADMIN_DASHBOARD_COLORS.info}
              strokeWidth={3}
              fill="url(#gradientMedicoes)"
              dot={false}
              activeDot={{ r: 5, fill: ADMIN_DASHBOARD_COLORS.info }}
            />
            <Area
              type="monotone"
              dataKey="pagamentos"
              name="Pagamentos efetuados"
              stroke={ADMIN_DASHBOARD_COLORS.success}
              strokeWidth={3}
              fill="url(#gradientPagamentos)"
              dot={false}
              activeDot={{ r: 5, fill: ADMIN_DASHBOARD_COLORS.success }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
