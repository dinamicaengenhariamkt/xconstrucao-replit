'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { ProgressBar } from '@features/shared/components/ProgressBar';
import { cn } from '@shared/lib/utils';
import { IconHealthAndSafety, IconWarning, IconCheckCircle, IconErrorOutline } from '@shared/components/icons';
import type { ObraHealth, HealthFactorKey, HealthStatus } from '../types';
import { HEALTH_LABELS, HEALTH_DESCRIPTIONS, HEALTH_PROGRESS_COLOR, FACTOR_LABELS, HEALTH_BADGE_CLASSES } from '../constants';
import { HealthBadge } from './HealthBadge';

interface HealthCardProps {
  health: ObraHealth;
  className?: string;
}

const STATUS_ICON: Record<HealthStatus, typeof IconHealthAndSafety> = {
  saudavel: IconCheckCircle,
  atencao: IconWarning,
  risco: IconErrorOutline,
};

const FACTORS: HealthFactorKey[] = ['atraso', 'financeiro', 'tarefas'];

export function HealthCard({ health, className }: HealthCardProps) {
  const StatusIcon = STATUS_ICON[health.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={className}
    >
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="flex items-start gap-3">
            <div className={cn('p-2.5 rounded-lg border', HEALTH_BADGE_CLASSES[health.status])}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Saúde da obra
                <HealthBadge status={health.status} size="sm" />
              </CardTitle>
              <CardDescription className="mt-1">{HEALTH_DESCRIPTIONS[health.status]}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-2xl font-extrabold tabular-nums text-gray-900 dark:text-gray-100">{health.score}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {FACTORS.map((key) => {
              const value = health.factors[key];
              const reason = health.reasons.find((r) => r.fator === key);
              const color = reason ? HEALTH_PROGRESS_COLOR[reason.severidade] : 'success';
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{FACTOR_LABELS[key]}</span>
                    <span className="font-bold tabular-nums text-gray-600 dark:text-gray-400">{value}</span>
                  </div>
                  <ProgressBar value={value} color={color} size="sm" />
                </div>
              );
            })}
          </div>

          {health.reasons.length > 0 && (
            <div className="border-t pt-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pontos de atenção</p>
              <ul className="space-y-1">
                {health.reasons.map((r) => (
                  <li key={r.fator} className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <HealthBadge status={r.severidade} size="sm" showLabel={false} />
                    <span>
                      <strong>{FACTOR_LABELS[r.fator]}:</strong> {r.mensagem}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {health.reasons.length === 0 && (
            <p className="text-xs text-muted-foreground border-t pt-3">Todos os indicadores dentro do esperado.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
