import type { ProfitMetrics, ProfitSummaryData, ProfitTrendPoint } from './types';

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pseudo(seed: number, salt: number): number {
  return ((seed * 9301 + salt * 49297) % 233280) / 233280;
}

export function getMockProfit(obraId: string): ProfitMetrics {
  const seed = hashCode(obraId || 'default');
  const receitaTotal = Math.round(120_000 + pseudo(seed, 1) * 480_000);
  const custoTotal = Math.round(receitaTotal * (0.55 + pseudo(seed, 2) * 0.4));
  const lucroEstimado = receitaTotal - custoTotal;
  const margem = receitaTotal > 0 ? Number(((lucroEstimado / receitaTotal) * 100).toFixed(1)) : 0;
  return { receitaTotal, custoTotal, lucroEstimado, margem };
}

const MESES = ['Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr'];

export function getMockProfitSummary(obraIds: string[]): ProfitSummaryData {
  const aggregate = obraIds.reduce<ProfitMetrics>(
    (acc, id) => {
      const m = getMockProfit(id);
      acc.receitaTotal += m.receitaTotal;
      acc.custoTotal += m.custoTotal;
      acc.lucroEstimado += m.lucroEstimado;
      return acc;
    },
    { receitaTotal: 0, custoTotal: 0, lucroEstimado: 0, margem: 0 }
  );
  aggregate.margem = aggregate.receitaTotal > 0
    ? Number(((aggregate.lucroEstimado / aggregate.receitaTotal) * 100).toFixed(1))
    : 0;

  const baseSeed = hashCode(obraIds.join('|') || 'default');
  const trend: ProfitTrendPoint[] = MESES.map((mes, i) => {
    const factor = 0.6 + pseudo(baseSeed, i + 1) * 0.8;
    const lucro = Math.round((aggregate.lucroEstimado / 6) * factor);
    const receita = Math.round((aggregate.receitaTotal / 6) * factor);
    const margem = receita > 0 ? Number(((lucro / receita) * 100).toFixed(1)) : 0;
    return { mes, lucro, margem };
  });

  return { metrics: aggregate, trend, totalObras: obraIds.length };
}
