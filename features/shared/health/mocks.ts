import type {
  HealthFactors,
  HealthFactorKey,
  ObraHealth,
  HealthSummaryData,
  HealthTrendPoint,
  HealthDrivers,
  HealthStatus,
} from './types';
import { calculateHealth } from './calculate';
import { HEALTH_THRESHOLDS } from './constants';

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pseudoFactor(seed: number, salt: number): number {
  const v = ((seed * 9301 + salt * 49297) % 233280) / 233280;
  return Math.round(v * 100);
}

function pseudo(seed: number, salt: number): number {
  return ((seed * 9301 + salt * 49297) % 233280) / 233280;
}

const DRIVER_POOL: Record<HealthFactorKey, Record<HealthStatus, string[]>> = {
  atraso: {
    saudavel: [
      'Cronograma 100% aderente ao planejado',
      'Última etapa entregue no prazo',
      'Nenhuma tarefa vencida em aberto',
    ],
    atencao: [
      '3 dias de atraso acumulados na etapa atual',
      '1 entrega deslocada em 48h',
      'Previsão de conclusão pode escorregar em 1 semana',
    ],
    risco: [
      '12 dias de atraso acumulados no cronograma',
      'Etapa "Alvenaria" vencida há 5 dias',
      '2 dependências críticas bloqueadas',
      'Previsão de entrega comprometida',
    ],
  },
  financeiro: {
    saudavel: [
      'Todas as medições pagas em dia',
      'Saldo a receber dentro do esperado',
      'Nenhum aditivo crítico pendente',
    ],
    atencao: [
      'Medição M4 com 5 dias de atraso no pagamento',
      'Saldo a receber acima de 30% do total',
      '1 aditivo aguardando aprovação',
    ],
    risco: [
      'Medição M3 atrasada há 22 dias (R$ 48k)',
      'Saldo a receber acima de 50% do contratado',
      'Fluxo de caixa negativo nas últimas 2 semanas',
      'Aditivo de R$ 32k aguardando há 15 dias',
    ],
  },
  tarefas: {
    saudavel: [
      'Execução semanal dentro da meta',
      'Zero tarefas bloqueadas',
      'Checklists diários completos',
    ],
    atencao: [
      '4 tarefas pendentes há mais de 7 dias',
      'Taxa de conclusão caiu 15% na semana',
      '1 checklist incompleto',
    ],
    risco: [
      '11 tarefas pendentes há mais de 7 dias',
      '3 tarefas bloqueadas aguardando material',
      'Taxa de conclusão caiu 40% na semana',
      'Equipe reduzida em 20% sem reposição',
    ],
  },
};

const RECOMMENDATION_POOL: Record<HealthStatus, string[]> = {
  saudavel: [
    'Manter ritmo de execução atual',
    'Documentar boas práticas da equipe',
    'Revisar plano de contingência trimestralmente',
  ],
  atencao: [
    'Alinhar prazos com a equipe de execução',
    'Cobrar medição pendente com o contratante',
    'Priorizar tarefas com maior dependência',
    'Revisar fluxo de compras da próxima etapa',
  ],
  risco: [
    'Reunião urgente com a equipe para replanejamento',
    'Escalar cobrança de medição para o contratante',
    'Desbloquear tarefas críticas com ação imediata',
    'Avaliar reforço de equipe para recuperar prazo',
    'Comunicar risco ao cliente com plano de mitigação',
  ],
};

function buildDrivers(factors: HealthFactors, seed: number): HealthDrivers {
  const statusForFactor = (value: number): HealthStatus =>
    value < HEALTH_THRESHOLDS.individualRisco
      ? 'risco'
      : value < HEALTH_THRESHOLDS.individualAtencao
      ? 'atencao'
      : 'saudavel';

  const pick = (key: HealthFactorKey, s: HealthStatus): string[] => {
    const pool = DRIVER_POOL[key][s];
    const count = s === 'risco' ? 4 : s === 'atencao' ? 3 : 2;
    const start = Math.floor(pseudo(seed, key.length * 3) * pool.length);
    const out: string[] = [];
    for (let i = 0; i < count && i < pool.length; i++) {
      out.push(pool[(start + i) % pool.length]);
    }
    return out;
  };

  return {
    atraso: pick('atraso', statusForFactor(factors.atraso)),
    financeiro: pick('financeiro', statusForFactor(factors.financeiro)),
    tarefas: pick('tarefas', statusForFactor(factors.tarefas)),
  };
}

function buildRecommendations(status: HealthStatus, seed: number): string[] {
  const pool = RECOMMENDATION_POOL[status];
  const count = status === 'risco' ? 4 : status === 'atencao' ? 3 : 2;
  const start = Math.floor(pseudo(seed, 91) * pool.length);
  const out: string[] = [];
  for (let i = 0; i < count && i < pool.length; i++) {
    out.push(pool[(start + i) % pool.length]);
  }
  return out;
}

function buildTrend(baseScore: number, seed: number): HealthTrendPoint[] {
  const today = new Date();
  const points: HealthTrendPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const noise = Math.round((pseudo(seed, i + 11) - 0.5) * 20);
    const drift = Math.round((5 - i) * (pseudo(seed, 31) - 0.5) * 4);
    const score = Math.max(5, Math.min(100, baseScore + noise + drift));
    const mes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    points.push({ date: mes, score });
  }
  if (points.length > 0) points[points.length - 1].score = baseScore;
  return points;
}

export function getMockHealth(obraId: string): ObraHealth {
  const seed = hashCode(obraId || 'default');
  const factors: HealthFactors = {
    atraso: pseudoFactor(seed, 1),
    financeiro: pseudoFactor(seed, 7),
    tarefas: pseudoFactor(seed, 13),
  };
  const base = calculateHealth(factors, new Date().toISOString());
  return {
    ...base,
    drivers: buildDrivers(factors, seed),
    trend: buildTrend(base.score, seed),
    recommendations: buildRecommendations(base.status, seed),
  };
}

export function getMockHealthSummary(obraIds: string[]): HealthSummaryData {
  const summary: HealthSummaryData = { saudavel: 0, atencao: 0, risco: 0, total: obraIds.length };
  obraIds.forEach((id) => {
    const { status } = getMockHealth(id);
    summary[status] += 1;
  });
  return summary;
}
