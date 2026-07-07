import { db } from '@shared/db/db';
import { obras } from '@shared/db/schema';
import { computeHealthSummaryForObras } from '@features/shared/health/summary-server';
import { computeProfitSummaryForObras } from '@features/shared/profit/summary-server';
import type { HealthSummaryData } from '@features/shared/health';
import type { ProfitSummaryData } from '@features/shared/profit';

/**
 * Resumo de saúde + lucro de TODO o portfólio (J18 admin). Reusa os mesmos
 * agregadores das personas — substitui `getMockHealthSummary`/`getMockProfitSummary`
 * no dashboard financeiro admin.
 */
export async function getAdminPortfolioSummary(): Promise<{
  health: HealthSummaryData;
  profit: ProfitSummaryData;
}> {
  const rows = await db.select({ id: obras.id }).from(obras);
  const obraIds = rows.map((r) => r.id);
  const [health, profit] = await Promise.all([
    computeHealthSummaryForObras(obraIds),
    computeProfitSummaryForObras(obraIds),
  ]);
  return { health, profit };
}
