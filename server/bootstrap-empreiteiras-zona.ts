import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente para Zona de atuação do empreiteiro (Task #87 / J02).
 * Adiciona colunas `zona_atuacao_ufs` (text[]) e `zona_atuacao_cidades` (text[])
 * em `empreiteiras` com default `[]`.
 */
export async function bootstrapEmpreiteirasZona(): Promise<void> {
  const cols: Array<{ name: string; ddl: string }> = [
    { name: "zona_atuacao_ufs", ddl: "zona_atuacao_ufs text[] NOT NULL DEFAULT ARRAY[]::text[]" },
    { name: "zona_atuacao_cidades", ddl: "zona_atuacao_cidades text[] NOT NULL DEFAULT ARRAY[]::text[]" },
  ];
  for (const c of cols) {
    try {
      await db.execute(
        sql.raw(`ALTER TABLE empreiteiras ADD COLUMN IF NOT EXISTS ${c.ddl};`),
      );
    } catch (err) {
      console.error(`[bootstrap-empreiteiras-zona] column ${c.name}:`, err);
    }
  }
}
