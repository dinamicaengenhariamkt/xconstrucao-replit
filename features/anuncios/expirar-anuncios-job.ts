import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { anuncios, auditLogs } from "@shared/db/schema";

export interface ExpirarAnunciosResult {
  ok: boolean;
  updated: number;
  runAt: string;
  error?: string;
}

/**
 * J31 — Job idempotente: promove anúncios `ativa` cujo `fim` já passou para
 * `expirada`. Hoje o anúncio some da exibição pelo filtro de data (`whereAtivo`),
 * mas o status permanece `ativa` no banco; este job fecha esse gap para relatório
 * e para liberar a zona (conflito).
 *
 * Roda diariamente via Replit Scheduled Deployment (`scripts/expirar-anuncios.ts`)
 * e na inicialização (instrumentation.ts). NÃO precisa de job `agendada→ativa`: o
 * filtro de exibição já respeita início futuro.
 *
 * Critério SQL: status='ativa' AND fim IS NOT NULL AND fim < CURRENT_DATE.
 * `fim` é TEXT ISO `YYYY-MM-DD` → comparação lexicográfica = cronológica.
 */
export async function expirarAnuncios(): Promise<ExpirarAnunciosResult> {
  const runAt = new Date().toISOString();
  try {
    const today = runAt.slice(0, 10);
    const rows = await db
      .update(anuncios)
      .set({ status: "expirada" })
      .where(
        and(
          eq(anuncios.status, "ativa"),
          sql`${anuncios.fim} IS NOT NULL`,
          lt(anuncios.fim, today),
        ),
      )
      .returning({ id: anuncios.id });

    const updated = rows.length;

    if (updated > 0) {
      try {
        await db.insert(auditLogs).values({
          actorId: null,
          action: "anuncios.expirar",
          targetUserId: null,
          payload: { updated, today, ids: rows.map((r) => r.id) },
          ip: "cron",
          userAgent: "expirar-anuncios-job",
        });
      } catch (auditErr) {
        console.error("[expirar-anuncios] falha ao gravar audit log:", auditErr);
      }
    }

    console.info(`[expirar-anuncios] runAt=${runAt} updated=${updated}`);
    return { ok: true, updated, runAt };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[expirar-anuncios] falha:", err);
    return { ok: false, updated: 0, runAt, error: message };
  }
}
