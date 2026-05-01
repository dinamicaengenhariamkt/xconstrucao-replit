'use client';

import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import type { PhaseDistributionChartProps, PhaseDistributionChartTooltipProps } from '../types';

/**
 * Mapeia o nome da fase exibida no chart para o filtro de status correspondente
 * em /contratante/minhas-obras. Fases sem status equivalente caem em 'em_execucao'
 * (estado padrão de obra "em andamento").
 */
const PHASE_TO_STATUS: Record<string, string> = {
  Planejamento: 'planejamento',
  Fundação: 'em_execucao',
  Estrutura: 'em_execucao',
  Acabamento: 'em_execucao',
  Concluído: 'finalizada',
};

function buildHrefFromPhase(name: string): string {
  const status = PHASE_TO_STATUS[name];
  return status
    ? `/contratante/minhas-obras?status=${status}`
    : '/contratante/minhas-obras';
}

function CustomTooltip({ active, payload }: PhaseDistributionChartTooltipProps) {
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

export function PhaseDistributionChart({
  data,
  totalObras = 12,
}: PhaseDistributionChartProps) {
  const router = useRouter();

  const handleSliceClick = (entry: { name: string }) => {
    router.push(buildHrefFromPhase(entry.name));
  };

  return (
    <Card className="border-border-light dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Distribuição por Fase
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Status atual de todas as obras · clique para filtrar
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
                  onClick={handleSliceClick}
                  className="cursor-pointer"
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
          <div className="flex-1 space-y-1">
            {data.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleSliceClick({ name: item.name })}
                className="w-full flex items-center justify-between cursor-pointer rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/60 dark:hover:bg-accent/30"
                data-testid={`fase-link-${item.name}`}
              >
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
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
