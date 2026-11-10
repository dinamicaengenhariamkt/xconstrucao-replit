import { sql } from 'drizzle-orm';
import { assinaturas, planos } from '@shared/db/schema';

/**
 * XG50 — receita mensal equivalente da assinatura, em SQL: no anual, o valor
 * do ano dividido por 12 (MRR); no mensal, a mensalidade. Mesma regra de
 * `mensalidadeEquivalente` (`features/xgestao/lib/ciclo-plano.ts`).
 */
export const precoMensalEquivalente = sql<string>`(CASE
  WHEN ${assinaturas.ciclo} = 'anual' AND ${planos.valorAnual} > 0 THEN round(${planos.valorAnual} / 12, 2)
  ELSE ${planos.valorMensal}
END)`;
