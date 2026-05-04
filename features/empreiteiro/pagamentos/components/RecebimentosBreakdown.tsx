'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { formatCurrencyRounded } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';
import type { PagamentosEmpreiteiroKPI } from '../types';

interface RecebimentosBreakdownProps {
  kpi: PagamentosEmpreiteiroKPI;
}

interface Segment {
  label: string;
  value: number;
  barClass: string;
  dotClass: string;
}

export function RecebimentosBreakdown({ kpi }: RecebimentosBreakdownProps) {
  const total = kpi.totalContratado;
  const ocupado = kpi.totalRecebido + kpi.aguardandoAprovacao + kpi.aLiberar + kpi.rejeitado;
  const naoIniciado = Math.max(0, total - ocupado);

  const segments: Segment[] = [
    { label: 'Recebido', value: kpi.totalRecebido, barClass: 'bg-green-500', dotClass: 'bg-green-500' },
    { label: 'Aguardando aprovação', value: kpi.aguardandoAprovacao, barClass: 'bg-amber-500', dotClass: 'bg-amber-500' },
    { label: 'A liberar', value: kpi.aLiberar, barClass: 'bg-blue-500', dotClass: 'bg-blue-500' },
    { label: 'Rejeitado', value: kpi.rejeitado, barClass: 'bg-red-500', dotClass: 'bg-red-500' },
    { label: 'Não iniciado', value: naoIniciado, barClass: 'bg-gray-300 dark:bg-gray-700', dotClass: 'bg-gray-300 dark:bg-gray-700' },
  ];

  const pct = (v: number) => (total > 0 ? (v / total) * 100 : 0);
  const recebidoPct = Math.round(pct(kpi.totalRecebido));

  return (
    <Card className="border-border-light dark:border-gray-800">
      <CardHeader className="flex flex-row items-start justify-between gap-4 py-4 space-y-0">
        <div>
          <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
            Progresso de Recebimentos
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Distribuição financeira do total contratado.
          </CardDescription>
        </div>
        <span className="text-2xl font-extrabold text-primary tabular-nums">{recebidoPct}%</span>
      </CardHeader>
      <CardContent className="pt-0 pb-5 flex flex-col gap-4">
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          {segments.map((s) =>
            s.value > 0 ? (
              <div
                key={s.label}
                className={cn('h-full transition-all duration-500', s.barClass)}
                style={{ width: `${pct(s.value)}%` }}
                title={`${s.label}: ${formatCurrencyRounded(s.value)}`}
                data-testid={`progress-segment-${s.label}`}
              />
            ) : null,
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {segments.map((s) => (
            <div key={s.label} className="flex items-start gap-2">
              <span className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0', s.dotClass)} />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {s.label}
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                  {formatCurrencyRounded(s.value)}
                </span>
                <span className="text-[10px] text-gray-400 tabular-nums">
                  {Math.round(pct(s.value))}%
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
          <span>Total contratado: {formatCurrencyRounded(total)}</span>
          <span>Recebido: {formatCurrencyRounded(kpi.totalRecebido)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
