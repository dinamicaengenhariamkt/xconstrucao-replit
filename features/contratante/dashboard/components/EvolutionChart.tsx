'use client';

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
import { EvolutionDataPoint } from '../types';

interface EvolutionChartProps {
  data: EvolutionDataPoint[];
}

const chartConfig = {
  planejado: { label: 'Planejado', color: '#22846D' },
  realizado: { label: 'Realizado', color: '#333333' },
};

export function EvolutionChart({ data }: EvolutionChartProps) {
  return (
    <Card className="border-border-light dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Evolução: Planejado x Realizado
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Acompanhamento dos últimos 10 meses
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Legend */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#22846D]" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Planejado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Realizado</span>
          </div>
        </div>

        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="gradientPlanejadoContratante" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22846D" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#22846D" stopOpacity={0} />
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
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="planejado"
                name="Planejado"
                stroke="#22846D"
                strokeWidth={3}
                fill="url(#gradientPlanejadoContratante)"
                dot={{ fill: '#22846D', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="realizado"
                name="Realizado"
                stroke="#333333"
                strokeWidth={3}
                dot={{ fill: '#333333', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
