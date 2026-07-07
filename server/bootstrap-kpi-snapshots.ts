import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da observabilidade histórica (J29).
 * - Tabela `kpi_snapshots` (metrica, valor, periodo) — uma fotografia por
 *   métrica por dia. O índice ÚNICO (metrica, periodo) garante a idempotência
 *   do job de snapshot (ON CONFLICT DO NOTHING).
 * - Coluna `users.last_login_at` — base do churn por inatividade.
 */
export async function bootstrapKpiSnapshotsSchema(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS kpi_snapshots (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        metrica TEXT NOT NULL,
        valor NUMERIC NOT NULL,
        periodo DATE NOT NULL,
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_kpi_snapshots_metrica_periodo
        ON kpi_snapshots(metrica, periodo)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_metrica_periodo
        ON kpi_snapshots(metrica, periodo DESC)
    `);

    // Churn por last-login (J29). Coluna em `users`; índice parcial p/ varrer
    // rápido inativos.
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_last_login_at
        ON users(last_login_at) WHERE last_login_at IS NOT NULL
    `);
  } catch (err) {
    console.error("[bootstrap-kpi-snapshots] falha:", err);
    return;
  }

  console.info("[bootstrap-kpi-snapshots] schema ready (kpi_snapshots + users.last_login_at)");
}
