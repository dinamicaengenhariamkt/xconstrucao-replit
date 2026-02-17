'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@shared/components/ui/chart';
import type { CashFlowData } from '../types';
import { EmptyState } from './EmptyState';
import { RiLineChartLine } from 'react-icons/ri';

interface CashFlowChartProps {
  data: CashFlowData[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <RiLineChartLine className="w-12 h-12 text-muted-foreground mx-auto" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">Sem dados financeiros</p>
            <p className="text-sm text-muted-foreground">
              Os dados aparecerão quando houver movimentações registradas
            </p>
          </div>
        </div>
      </div>
    );
  }

  const chartConfig = {
    receitas: {
      label: 'Receitas',
      color: '#22846D',
    },
    despesas: {
      label: 'Despesas',
      color: '#ef4444',
    },
  };

  return (
    <div className="relative h-[100%] w-full">
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="mes"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 700 }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value) => (
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {value}
                </span>
              )}
            />
            <defs>
              <linearGradient id="receitasGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22846D" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22846D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Line
              type="monotone"
              dataKey="receitas"
              stroke="#22846D"
              strokeWidth={3}
              dot={{ fill: '#22846D', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="despesas"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
