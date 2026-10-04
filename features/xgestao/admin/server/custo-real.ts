import { and, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { empreiteiras, financeiro, obras } from '@shared/db/schema';

/**
 * XG34 — custo real das obras xgestão para o admin.
 *
 * Mesma regra do dashboard do assinante (XG27, `build-detalhe-server.ts`):
 * soma das saídas **pagas** da obra em que o pagador é o dono da empreiteira.
 * **Não** usa `obras.valor_pago`: no xgestão essa coluna nunca é escrita, e era
 * ela que fazia o admin mostrar R$ 0 para obra com saídas lançadas.
 */
const SAIDA_PAGA_DO_DONO = and(
  eq(financeiro.status, 'pago'),
  eq(financeiro.escopo, 'obra'),
  eq(financeiro.pagadorUserId, empreiteiras.userId),
);

/** Custo real por obra, em lote. Obra sem saída paga fica fora do mapa (= 0). */
export async function custoRealPorObra(obraIds: string[]): Promise<Map<string, number>> {
  const mapa = new Map<string, number>();
  if (obraIds.length === 0) return mapa;
  const linhas = await db
    .select({ obraId: financeiro.obraId, total: sql<string>`coalesce(sum(${financeiro.valor}), 0)` })
    .from(financeiro)
    .innerJoin(obras, eq(obras.id, financeiro.obraId))
    .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(and(inArray(financeiro.obraId, obraIds), SAIDA_PAGA_DO_DONO))
    .groupBy(financeiro.obraId);
  for (const linha of linhas) if (linha.obraId) mapa.set(linha.obraId, Number(linha.total));
  return mapa;
}

/** Custo real somado de todas as obras que casam com `escopoObras`. */
export async function custoRealTotal(escopoObras: SQL | undefined): Promise<number> {
  const [linha] = await db
    .select({ total: sql<string>`coalesce(sum(${financeiro.valor}), 0)` })
    .from(financeiro)
    .innerJoin(obras, eq(obras.id, financeiro.obraId))
    .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(and(escopoObras, SAIDA_PAGA_DO_DONO));
  return Number(linha?.total) || 0;
}
