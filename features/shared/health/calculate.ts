import type { HealthFactors, HealthStatus, ObraHealth, HealthReason, HealthFactorKey } from './types';
import { HEALTH_THRESHOLDS, HEALTH_WEIGHTS, FACTOR_LABELS } from './constants';

const clamp = (n: number) => Math.min(100, Math.max(0, n));

const STATUS_RANK: Record<HealthStatus, number> = { saudavel: 0, atencao: 1, risco: 2 };

function statusFromScore(score: number): HealthStatus {
  if (score >= HEALTH_THRESHOLDS.saudavel) return 'saudavel';
  if (score >= HEALTH_THRESHOLDS.atencao) return 'atencao';
  return 'risco';
}

function severityFromValue(value: number): HealthStatus {
  if (value < HEALTH_THRESHOLDS.individualRisco) return 'risco';
  if (value < HEALTH_THRESHOLDS.individualAtencao) return 'atencao';
  return 'saudavel';
}

const REASON_TEMPLATES: Record<HealthFactorKey, Record<Exclude<HealthStatus, 'saudavel'>, string>> = {
  atraso: {
    atencao: 'Cronograma com atrasos pontuais',
    risco: 'Cronograma significativamente atrasado',
  },
  financeiro: {
    atencao: 'Indicadores financeiros desalinhados',
    risco: 'Situação financeira crítica',
  },
  tarefas: {
    atencao: 'Tarefas com baixa execução recente',
    risco: 'Muitas tarefas pendentes ou bloqueadas',
  },
};

export function calculateHealth(factorsInput: HealthFactors, updatedAt: string = new Date().toISOString()): ObraHealth {
  const factors: HealthFactors = {
    atraso: clamp(factorsInput.atraso),
    financeiro: clamp(factorsInput.financeiro),
    tarefas: clamp(factorsInput.tarefas),
  };

  const score = Math.round(
    factors.atraso * HEALTH_WEIGHTS.atraso +
      factors.financeiro * HEALTH_WEIGHTS.financeiro +
      factors.tarefas * HEALTH_WEIGHTS.tarefas
  );

  let status = statusFromScore(score);
  const reasons: HealthReason[] = [];

  (Object.keys(factors) as HealthFactorKey[]).forEach((key) => {
    const severity = severityFromValue(factors[key]);
    if (severity === 'saudavel') return;
    if (STATUS_RANK[severity] > STATUS_RANK[status]) status = severity;
    reasons.push({
      fator: key,
      severidade: severity,
      mensagem: REASON_TEMPLATES[key][severity],
    });
  });

  return { status, score, factors, reasons, updatedAt };
}

export { FACTOR_LABELS };
