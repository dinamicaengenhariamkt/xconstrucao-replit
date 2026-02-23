'use client';

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { formatCompactCurrency, formatCurrency } from '@features/admin/financeiro/utils';
import { ADMIN_DASHBOARD_COLORS } from '@features/admin/financeiro/constants';
import { useCaixaChartData } from '../hooks/use-caixa';

const MINIMO_SEGURANCA = 500_000;

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">Dia {label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-semibold">
          {entry.name === 'saldo' ? 'Saldo real' : 'Projeção'}:{' '}
          {formatCurrency(entry.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

export function CaixaChart() {
  const { data: chartData } = useCaixaChartData();

  if (!chartData) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Saldo de caixa no tempo
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Evolução diária no período selecionado
        </p>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex items-center gap-6 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Saldo real</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-0 border-t-2"
              style={{ borderColor: ADMIN_DASHBOARD_COLORS.info, borderStyle: 'dashed' }}
            />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Saldo projetado</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-0 border-t-2"
              style={{ borderColor: ADMIN_DASHBOARD_COLORS.error, borderStyle: 'dashed' }}
            />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Mínimo de segurança</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id="saldoGradientCaixa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ADMIN_DASHBOARD_COLORS.primary} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={ADMIN_DASHBOARD_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 11, fontWeight: 600, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => formatCompactCurrency(v)}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine
                y={MINIMO_SEGURANCA}
                stroke={ADMIN_DASHBOARD_COLORS.error}
                strokeDasharray="8 4"
                strokeWidth={1.5}
                opacity={0.5}
                label={{
                  value: `Mín. ${formatCompactCurrency(MINIMO_SEGURANCA)}`,
                  position: 'insideTopRight',
                  fontSize: 9,
                  fontWeight: 600,
                  fill: ADMIN_DASHBOARD_COLORS.error,
                  opacity: 0.7,
                }}
              />
              <Area
                type="monotone"
                dataKey="saldo"
                stroke={ADMIN_DASHBOARD_COLORS.primary}
                strokeWidth={3}
                fill="url(#saldoGradientCaixa)"
                dot={false}
                activeDot={{ r: 5, fill: ADMIN_DASHBOARD_COLORS.primary, strokeWidth: 2, stroke: '#fff' }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="projecao"
                stroke={ADMIN_DASHBOARD_COLORS.info}
                strokeWidth={2.5}
                strokeDasharray="8 4"
                dot={false}
                activeDot={{ r: 5, fill: ADMIN_DASHBOARD_COLORS.info, strokeWidth: 2, stroke: '#fff' }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
