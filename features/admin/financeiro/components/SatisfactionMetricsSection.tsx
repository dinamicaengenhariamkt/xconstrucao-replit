'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import { RiStarFill, RiStarHalfFill, RiStarLine } from 'react-icons/ri';
import type { SatisfactionMetrics } from '../types';

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: full }).map((_, i) => (
        <RiStarFill key={`f${i}`} className="w-4 h-4" />
      ))}
      {half && <RiStarHalfFill className="w-4 h-4" />}
      {Array.from({ length: empty }).map((_, i) => (
        <RiStarLine key={`e${i}`} className="w-4 h-4" />
      ))}
    </span>
  );
}

function npsClassification(score: number): { label: string; classes: string } {
  if (score >= 75) return { label: 'Excelente', classes: 'text-emerald-600 bg-emerald-50' };
  if (score >= 50) return { label: 'Muito bom', classes: 'text-emerald-600 bg-emerald-50' };
  if (score >= 0) return { label: 'Razoável', classes: 'text-amber-600 bg-amber-50' };
  return { label: 'Crítico', classes: 'text-red-600 bg-red-50' };
}

interface SatisfactionMetricsSectionProps {
  metrics: SatisfactionMetrics;
}

export function SatisfactionMetricsSection({ metrics }: SatisfactionMetricsSectionProps) {
  const npsClass = npsClassification(metrics.npsScore);
  const total =
    metrics.breakdown.promotores +
    metrics.breakdown.neutros +
    metrics.breakdown.detratores;
  const safeTotal = total > 0 ? total : 1;

  return (
    <Card
      className="border-border-light dark:border-gray-800"
      data-testid="satisfaction-metrics-section"
    >
      <CardHeader className="py-4">
        <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
          Satisfação dos usuários
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          NPS geral e CSAT médio coletados pós-conclusão de obra (clientes) e pós-pagamento
          (empreiteiras).
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NPS principal */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col gap-3 lg:col-span-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                NPS geral
              </span>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full',
                  npsClass.classes,
                )}
              >
                {npsClass.label}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white tabular-nums">
                {metrics.npsScore}
              </p>
              <span
                className={cn(
                  'text-xs font-semibold tabular-nums',
                  metrics.npsDelta > 0
                    ? 'text-emerald-600'
                    : metrics.npsDelta < 0
                      ? 'text-red-600'
                      : 'text-gray-400',
                )}
              >
                {metrics.npsDelta > 0 ? '+' : ''}
                {metrics.npsDelta} vs trimestre
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Base: {metrics.npsResponses} respostas no trimestre.
            </p>

            {/* Breakdown bar */}
            <div className="mt-2">
              <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(metrics.breakdown.promotores / safeTotal) * 100}%` }}
                  title={`Promotores: ${metrics.breakdown.promotores}%`}
                />
                <div
                  className="bg-amber-500 transition-all duration-500"
                  style={{ width: `${(metrics.breakdown.neutros / safeTotal) * 100}%` }}
                  title={`Neutros: ${metrics.breakdown.neutros}%`}
                />
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${(metrics.breakdown.detratores / safeTotal) * 100}%` }}
                  title={`Detratores: ${metrics.breakdown.detratores}%`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-2">
                <span>Promotores {metrics.breakdown.promotores}%</span>
                <span>Neutros {metrics.breakdown.neutros}%</span>
                <span>Detratores {metrics.breakdown.detratores}%</span>
              </div>
            </div>
          </div>

          {/* CSAT clientes */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              CSAT — Clientes
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white tabular-nums">
                {metrics.csatClientes.toFixed(1)}
              </p>
              <span className="text-xs text-gray-400">/ 5,0</span>
            </div>
            <StarRating value={metrics.csatClientes} />
            <p className="text-[11px] text-gray-400">
              Avaliação média dada pelos clientes ao final de cada obra entregue.
            </p>
          </div>

          {/* CSAT empreiteiras */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              CSAT — Empreiteiras
            </span>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white tabular-nums">
                {metrics.csatEmpreiteiras.toFixed(1)}
              </p>
              <span className="text-xs text-gray-400">/ 5,0</span>
            </div>
            <StarRating value={metrics.csatEmpreiteiras} />
            <p className="text-[11px] text-gray-400">
              Avaliação média dada pelas empreiteiras à plataforma após cada pagamento liberado.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
