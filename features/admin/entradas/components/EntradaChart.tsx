'use client';

import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import type { EntradaChartPoint, EntradaInsight } from '../types';
import { formatCurrencyCompact, formatCurrency } from '@shared/lib/formatters';

const CHART_HEIGHT = 240;
const BAR_WIDTH = 40;
const BAR_GAP = 32;

const COLORS = {
  taxas: '#1E88E5',
  assinaturas: '#22846D',
  outros: '#F5A623',
};


interface EntradaChartProps {
  data?: EntradaChartPoint[];
  insights?: EntradaInsight;
  luminous?: boolean;
}

export function EntradaChart({ data = [], insights, luminous = false }: EntradaChartProps) {
  if (data.length === 0) return null;

  const maxTotal = Math.max(
    ...data.map((d) => d.taxas + d.assinaturas + d.outros)
  );

  const svgWidth = data.length * (BAR_WIDTH + BAR_GAP);
  const svgHeight = CHART_HEIGHT;

  const bars = data.map((d, i) => {
    const total = d.taxas + d.assinaturas + d.outros;
    const totalH = maxTotal > 0 ? (total / maxTotal) * (svgHeight - 20) : 0;
    const taxasH = maxTotal > 0 ? (d.taxas / maxTotal) * (svgHeight - 20) : 0;
    const assinaturasH = maxTotal > 0 ? (d.assinaturas / maxTotal) * (svgHeight - 20) : 0;
    const outrosH = totalH - taxasH - assinaturasH;

    const x = i * (BAR_WIDTH + BAR_GAP);
    const bottomY = svgHeight;

    const taxasY = bottomY - taxasH;
    const assinaturasY = taxasY - assinaturasH;
    const outrosY = assinaturasY - outrosH;

    return { x, taxasY, taxasH, assinaturasY, assinaturasH, outrosY, outrosH, total, dia: d.dia };
  });

  return (
    <Card className={cn('overflow-hidden', luminous && 'luminous-section border-transparent shadow-none')}>
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Entradas ao longo do tempo
            </h3>
            <p className="text-sm text-muted-foreground">
              Distribuição das receitas no período
            </p>
          </div>
        </div>
        {/* Legenda */}
        <div className="flex items-center gap-6 mt-4">
          {[
            { label: 'Taxas', color: COLORS.taxas },
            { label: 'Assinaturas', color: COLORS.assinaturas },
            { label: 'Outros', color: COLORS.outros },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-6 pb-4">
        {/* Chart */}
        <div className="overflow-x-auto">
          <div style={{ minWidth: svgWidth + BAR_GAP }}>
            <svg
              width="100%"
              height={svgHeight}
              viewBox={`0 0 ${svgWidth + BAR_GAP} ${svgHeight}`}
              preserveAspectRatio="xMidYMax meet"
            >
              {bars.map((b) => (
                <g key={b.dia}>
                  {/* Outros (topo) */}
                  {b.outrosH > 0 && (
                    <rect
                      x={b.x}
                      y={b.outrosY}
                      width={BAR_WIDTH}
                      height={b.outrosH}
                      rx={b.assinaturasH === 0 && b.taxasH === 0 ? 4 : 0}
                      fill={COLORS.outros}
                    />
                  )}
                  {/* Assinaturas (meio) */}
                  {b.assinaturasH > 0 && (
                    <rect
                      x={b.x}
                      y={b.assinaturasY}
                      width={BAR_WIDTH}
                      height={b.assinaturasH}
                      rx={b.taxasH === 0 ? 4 : 0}
                      fill={COLORS.assinaturas}
                    />
                  )}
                  {/* Taxas (base) */}
                  {b.taxasH > 0 && (
                    <rect
                      x={b.x}
                      y={b.taxasY}
                      width={BAR_WIDTH}
                      height={b.taxasH}
                      fill={COLORS.taxas}
                    />
                  )}
                  {/* Label valor máximo */}
                  {b.total === Math.max(...bars.map((bb) => bb.total)) && (
                    <text
                      x={b.x + BAR_WIDTH / 2}
                      y={b.outrosY - 6}
                      fontSize="10"
                      fontWeight="700"
                      fill="#333333"
                      textAnchor="middle"
                    >
                      {formatCurrencyCompact(b.total)}
                    </text>
                  )}
                </g>
              ))}
            </svg>
            {/* Labels eixo X */}
            <div
              className="flex mt-3"
              style={{ paddingLeft: BAR_WIDTH / 2, gap: BAR_GAP + BAR_WIDTH - 8 }}
            >
              {data.map((d) => (
                <span key={d.dia} className="text-[11px] font-bold text-gray-400 text-center" style={{ minWidth: 8 }}>
                  {d.dia}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Insight cards */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Maior dia de entrada</p>
                <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                  {insights.maiorDia} — {formatCurrency(insights.maiorDiaValor)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Dias sem entrada</p>
                <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                  {insights.diasSemEntrada} dias no período
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
