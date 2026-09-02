import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da Jornada 06 (Medições) — Task #47.
 * Cria enum `medicao_status` + tabela `medicoes` + índices.
 * Mesmo padrão dos outros bootstraps (roda em toda inicialização).
 */
export async function bootstrapMedicoesSchema(): Promise<void> {
  try {
    await db.execute(sql.raw(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'medicao_status') THEN
          CREATE TYPE medicao_status AS ENUM ('pendente', 'aprovada', 'contestada');
        END IF;
      END$$;
    `));

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS medicoes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        empreiteiro_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        numero INTEGER NOT NULL,
        etapa TEXT NOT NULL,
        descricao TEXT,
        percentual NUMERIC(5,2) NOT NULL,
        valor NUMERIC(15,2) NOT NULL DEFAULT 0,
        fotos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        status medicao_status NOT NULL DEFAULT 'pendente',
        motivo_contestacao TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        decided_at TIMESTAMP,
        decided_by VARCHAR REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_medicoes_obra ON medicoes(obra_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_medicoes_empreiteiro ON medicoes(empreiteiro_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_medicoes_status ON medicoes(status)`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_medicoes_obra_numero ON medicoes(obra_id, numero)`);
    await db.execute(sql`ALTER TABLE medicoes ADD COLUMN IF NOT EXISTS request_id VARCHAR`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_medicoes_empreiteiro_request ON medicoes(empreiteiro_id, request_id) WHERE request_id IS NOT NULL`);

    console.info("[bootstrap-medicoes] schema ready (medicoes + índices)");
  } catch (err) {
    console.error("[bootstrap-medicoes] failed:", err);
  }
}
