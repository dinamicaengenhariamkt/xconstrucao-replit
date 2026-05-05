'use client';

import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { ProgressBar } from '@features/shared/components/ProgressBar';
import { cn } from '@shared/lib/utils';
import {
  IconCheckCircle,
  IconWarning,
  IconErrorOutline,
  IconArrowForward,
  IconTarget,
  IconTrendingUp,
  IconCalendarMonth,
  IconPayments,
  IconTaskAlt,
} from '@shared/components/icons';
import type { ObraHealth, HealthStatus, HealthFactorKey } from '../types';
import {
  HEALTH_LABELS,
  HEALTH_DESCRIPTIONS,
  HEALTH_PROGRESS_COLOR,
  HEALTH_BADGE_CLASSES,
  FACTOR_LABELS,
} from '../constants';
import { HealthBadge } from './HealthBadge';

const STATUS_ICON: Record<HealthStatus, typeof IconCheckCircle> = {
  saudavel: IconCheckCircle,
  atencao: IconWarning,
  risco: IconErrorOutline,
};

const FACTOR_ICON: Record<HealthFactorKey, typeof IconCalendarMonth> = {
  atraso: IconCalendarMonth,
  financeiro: IconPayments,
  tarefas: IconTaskAlt,
};

const FACTORS: HealthFactorKey[] = ['atraso', 'financeiro', 'tarefas'];

const OVERALL_RECOMMENDATION: Record<HealthStatus, string> = {
  saudavel: 'Mantenha o ritmo. Continue monitorando os indicadores para sustentar a saúde da obra.',
  atencao: 'Alguns pontos precisam de atenção nesta semana para evitar escalada de risco.',
  risco: 'Intervenção recomendada imediatamente. Priorize ações de mitigação para recuperar a saúde da obra.',
};

export interface HealthDetailPanelProps {
  health: ObraHealth;
  actionsByFactor?: Partial<Record<HealthFactorKey, { label: string; onClick: () => void }>>;
  className?: string;
  luminous?: boolean;
}

export function HealthDetailPanel({ health, actionsByFactor, className, luminous = false }: HealthDetailPanelProps) {
  const luminousClass = luminous ? 'luminous-section border-transparent shadow-none' : '';
  const StatusIcon = STATUS_ICON[health.status];
  const scoreFactorsCount = health.reasons.length;

  return (
    <div className={cn('space-y-6', className)} data-testid="health-detail-panel">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className={luminousClass}>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div
                className={cn(
                  'w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center flex-shrink-0',
                  HEALTH_BADGE_CLASSES[health.status]
                )}
              >
                <StatusIcon className="w-5 h-5 mb-1" />
                <span className="text-2xl font-extrabold tabular-nums leading-none">{health.score}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80 mt-0.5">score</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <HealthBadge status={health.status} size="md" />
                  <span className="text-xs text-muted-foreground">
                    {scoreFactorsCount === 0
                      ? 'Todos os indicadores dentro do esperado'
                      : `${scoreFactorsCount} ${scoreFactorsCount === 1 ? 'ponto requer' : 'pontos requerem'} atenção`}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                  {HEALTH_LABELS[health.status]}: {HEALTH_DESCRIPTIONS[health.status]}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">{OVERALL_RECOMMENDATION[health.status]}</p>
                <p className="text-xs text-gray-400 mt-3">
                  Última avaliação: {new Date(health.updatedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Breakdown por fator */}
      <div className="grid gap-4 md:grid-cols-3">
        {FACTORS.map((key, idx) => {
          const value = health.factors[key];
          const reason = health.reasons.find((r) => r.fator === key);
          const severity = reason?.severidade ?? 'saudavel';
          const color = HEALTH_PROGRESS_COLOR[severity];
          const drivers = health.drivers?.[key] ?? [];
          const action = actionsByFactor?.[key];
          const FactorIcon = FACTOR_ICON[key];

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
            >
              <Card className={cn('h-full flex flex-col', luminousClass)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-2 rounded-lg border', HEALTH_BADGE_CLASSES[severity])}>
                        <FactorIcon className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-sm">{FACTOR_LABELS[key]}</CardTitle>
                    </div>
                    <HealthBadge status={severity} size="sm" showLabel={false} />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tabular-nums text-gray-900 dark:text-gray-100">
                      {value}
                    </span>
                    <span className="text-xs text-muted-foreground">/ 100</span>
                  </div>
                  <ProgressBar value={value} color={color} size="md" />
                  <p className="text-xs text-muted-foreground">
                    {reason?.mensagem ?? 'Indicador dentro do esperado.'}
                  </p>

                  {drivers.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Evidências
                      </p>
                      <ul className="space-y-1">
                        {drivers.map((d, i) => (
                          <li
                            key={i}
                            className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2"
                          >
                            <span
                              className={cn(
                                'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                                severity === 'risco'
                                  ? 'bg-red-500'
                                  : severity === 'atencao'
                                  ? 'bg-amber-500'
                                  : 'bg-green-500'
                              )}
                            />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {action && (
                    <button
                      type="button"
                      onClick={action.onClick}
                      className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer self-start"
                      data-testid={`health-factor-action-${key}`}
                    >
                      {action.label}
                      <IconArrowForward className="w-3.5 h-3.5" />
                    </button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Evolução */}
      {health.trend && health.trend.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
        >
          <Card className={luminousClass}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconTrendingUp className="w-4 h-4 text-primary" />
                Evolução do score
              </CardTitle>
              <CardDescription>Últimos 6 meses — comparação do score geral da obra.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={health.trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="health-trend-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22846D" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#22846D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="currentColor"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                    />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                      formatter={(value: number) => [`${value} pts`, 'Score']}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#22846D"
                      strokeWidth={2}
                      fill="url(#health-trend-gradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recomendações */}
      {health.recommendations && health.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
        >
          <Card className={luminousClass}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconTarget className="w-4 h-4 text-primary" />
                Recomendações de ação
              </CardTitle>
              <CardDescription>
                Ações sugeridas com base no estado atual dos indicadores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {health.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
