'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import type { StatusDistributionChartProps, StatusDistributionChartTooltipProps } from '../types';

function CustomTooltip({ active, payload }: StatusDistributionChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-bold text-gray-700 dark:text-gray-300">
        {item.name}: {item.value}%
      </p>
    </div>
  );
}

interface StatusDistributionChartExtendedProps extends StatusDistributionChartProps {
  luminous?: boolean;
}

export function StatusDistributionChart({
  data,
  totalObras = 42,
  luminous = false,
}: StatusDistributionChartExtendedProps) {
  return (
    <Card
      className={cn(
        'border-border-light dark:border-gray-800',
        luminous && 'luminous-section border-transparent shadow-none',
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Distribuição por status de obra
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Volume financeiro por situação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-8">
          {/* Donut Chart */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={76}
                  dataKey="value"
                  nameKey="name"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                {totalObras}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Obras</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
