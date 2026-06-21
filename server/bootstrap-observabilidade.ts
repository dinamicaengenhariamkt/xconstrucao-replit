import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente das tabelas de observabilidade técnica (J33).
 * - `app_errors`: captura persistente de erros (front + back).
 * - `job_runs`: status histórico de jobs/bootstraps.
 * Roda ANTES de todos os outros bootstraps em instrumentation.ts.
 */
export async function bootstrapObservabilidadeSchema(): Promise<void> {
  try {
    // ----------------------------------------------------------------
    // app_errors — erros de aplicação (server e client-side)
    // ----------------------------------------------------------------
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS app_errors (
        id          SERIAL PRIMARY KEY,
        level       TEXT NOT NULL DEFAULT 'error',
        message     TEXT NOT NULL,
        stack       TEXT,
        route       TEXT,
        user_id     VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        meta        JSONB,
        fingerprint TEXT,
        source      TEXT NOT NULL DEFAULT 'server',
        created_at  TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_app_errors_created_at ON app_errors(created_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_app_errors_route ON app_errors(route) WHERE route IS NOT NULL`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_app_errors_level ON app_errors(level)`);

    // ----------------------------------------------------------------
    // job_runs — histórico de execuções de jobs/bootstraps
    // ----------------------------------------------------------------
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS job_runs (
        id          SERIAL PRIMARY KEY,
        job         TEXT NOT NULL,
        status      TEXT NOT NULL,
        started_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        finished_at TIMESTAMP,
        error       TEXT,
        meta        JSONB
      )
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_job_runs_job_started ON job_runs(job, started_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_job_runs_status ON job_runs(status)`);

  } catch (err) {
    console.error("[bootstrap-observabilidade] falha ao criar tabelas:", err);
    return;
  }

  console.info("[bootstrap-observabilidade] schema ready (app_errors, job_runs)");
}
