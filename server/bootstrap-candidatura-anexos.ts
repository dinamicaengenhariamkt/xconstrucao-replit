import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da tabela `candidatura_anexos` (Task #66 — J05.B).
 * Cria a tabela + índices se ainda não existirem. Mesmo padrão dos demais
 * bootstrap-*: roda em toda inicialização; seguro re-rodar.
 */
export async function bootstrapCandidaturaAnexosSchema(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS candidatura_anexos (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        candidatura_id varchar NOT NULL REFERENCES candidaturas(id) ON DELETE CASCADE,
        file_id varchar NOT NULL REFERENCES user_files(id) ON DELETE CASCADE,
        created_by varchar REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_candidatura_anexos_candidatura ON candidatura_anexos(candidatura_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_candidatura_anexos_file ON candidatura_anexos(file_id)`);
  } catch (err) {
    console.error("[bootstrap-candidatura-anexos]:", err);
  }

  console.info("[bootstrap-candidatura-anexos] schema ready");
}
