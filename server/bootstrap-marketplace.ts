import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da camada de Marketplace (J04.A — Task #41).
 * - Cria tabela `obras_salvas` (favoritos do empreiteiro) + índices.
 * - Cria índices auxiliares em `candidaturas` para suportar anti-self-apply e
 *   ranking por status (alimenta também a J05).
 *
 * Mesmo padrão de bootstrap-storage / bootstrap-obras: roda em toda
 * inicialização (idempotente, seguro re-rodar).
 */
export async function bootstrapMarketplaceSchema(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS obras_salvas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_obras_salvas_user_obra ON obras_salvas(user_id, obra_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_obras_salvas_user_id ON obras_salvas(user_id)`);
  } catch (err) {
    console.error("[bootstrap-marketplace] tabela obras_salvas:", err);
  }

  try {
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_candidaturas_obra_empreiteiro ON candidaturas(obra_id, empreiteiro_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_candidaturas_status ON candidaturas(status)`);
  } catch (err) {
    console.error("[bootstrap-marketplace] índices candidaturas:", err);
  }

  console.info("[bootstrap-marketplace] schema ready (obras_salvas + índices candidaturas)");
}
