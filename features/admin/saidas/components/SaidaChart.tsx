'use client';

import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import type { SaidaChartPoint, SaidaInsight } from '../types';

const CHART_HEIGHT = 240;
const BAR_WIDTH = 40;
const BAR_GAP = 32;

const COLORS = {
  pagamentos: '#E53935',
  reembolsos: '#F5A623',
  outros: '#333333',
};

function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
  return `R$ ${value}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface SaidaChartProps {
  data?: SaidaChartPoint[];
  insights?: SaidaInsight;
}

export function SaidaChart({ data = [], insights }: SaidaChartProps) {
  if (data.length === 0) return null;

  const maxTotal = Math.max(
    ...data.map((d) => d.pagamentos + d.reembolsos + d.outros)
  );

  const svgWidth = data.length * (BAR_WIDTH + BAR_GAP);
  const svgHeight = CHART_HEIGHT;

  const bars = data.map((d, i) => {
    const total = d.pagamentos + d.reembolsos + d.outros;
    const totalH = maxTotal > 0 ? (total / maxTotal) * (svgHeight - 20) : 0;
    const pagamentosH = maxTotal > 0 ? (d.pagamentos / maxTotal) * (svgHeight - 20) : 0;
    const reembolsosH = maxTotal > 0 ? (d.reembolsos / maxTotal) * (svgHeight - 20) : 0;
    const outrosH = totalH - pagamentosH - reembolsosH;

    const x = i * (BAR_WIDTH + BAR_GAP);
    const bottomY = svgHeight;

    const pagamentosY = bottomY - pagamentosH;
    const reembolsosY = pagamentosY - reembolsosH;
    const outrosY = reembolsosY - outrosH;

    return { x, pagamentosY, pagamentosH, reembolsosY, reembolsosH, outrosY, outrosH, total, dia: d.dia };
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Saídas ao longo do tempo
            </h3>
            <p className="text-sm text-muted-foreground">
              Distribuição diária dos desembolsos no período
            </p>
          </div>
        </div>
        {/* Legenda */}
        <div className="flex items-center gap-6 mt-4">
          {[
            { label: 'Pagamentos a empreiteiras', color: COLORS.pagamentos },
            { label: 'Reembolsos', color: COLORS.reembolsos },
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
                      rx={b.reembolsosH === 0 && b.pagamentosH === 0 ? 4 : 0}
                      fill={COLORS.outros}
                    />
                  )}
                  {/* Reembolsos (meio) */}
                  {b.reembolsosH > 0 && (
                    <rect
                      x={b.x}
                      y={b.reembolsosY}
                      width={BAR_WIDTH}
                      height={b.reembolsosH}
                      rx={b.pagamentosH === 0 ? 4 : 0}
                      fill={COLORS.reembolsos}
                    />
                  )}
                  {/* Pagamentos (base) */}
                  {b.pagamentosH > 0 && (
                    <rect
                      x={b.x}
                      y={b.pagamentosY}
                      width={BAR_WIDTH}
                      height={b.pagamentosH}
                      fill={COLORS.pagamentos}
                    />
                  )}
                  {/* Label do valor máximo */}
                  {b.total === Math.max(...bars.map((bb) => bb.total)) && (
                    <text
                      x={b.x + BAR_WIDTH / 2}
                      y={b.outrosY - 6}
                      fontSize="10"
                      fontWeight="700"
                      fill="#E53935"
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
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/10">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Maior dia de saída</p>
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
                <p className="text-xs text-gray-500 font-medium">Dias sem saída</p>
                <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">
                  {insights.diasSemSaida} dias no período
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
