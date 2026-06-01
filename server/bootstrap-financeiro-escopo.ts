import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da fundação financeira compartilhada (Fase 0 — Wave 3).
 * Estende `financeiro` para separar dinheiro DA OBRA do dinheiro DA PLATAFORMA,
 * base de J09 (caixa admin), J10 (estornos de disputa), J11 (assinaturas) e
 * J12 (anúncios).
 *
 * - Enum `financeiro_escopo` (obra | plataforma).
 * - Colunas: escopo (default 'obra' → backfill seguro), origem_tipo, origem_id.
 * - Índice composto para agregação de caixa por escopo/status/período.
 * - Índice único parcial em (origem_tipo, origem_id) para idempotência de
 *   lançamentos de plataforma (reenvio de webhook / re-resolução não duplica).
 */
export async function bootstrapFinanceiroEscopoSchema(): Promise<void> {
  try {
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE financeiro_escopo AS ENUM ('obra', 'plataforma');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS escopo financeiro_escopo NOT NULL DEFAULT 'obra'`);
    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS origem_tipo TEXT`);
    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS origem_id VARCHAR`);

    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_financeiro_escopo_status_data ON financeiro(escopo, status, data)`,
    );
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_financeiro_origem ON financeiro(origem_tipo, origem_id) WHERE origem_id IS NOT NULL`,
    );
  } catch (err) {
    console.error("[bootstrap-financeiro-escopo] falha:", err);
    return;
  }

  console.info("[bootstrap-financeiro-escopo] schema ready (financeiro: escopo + origem)");
}
