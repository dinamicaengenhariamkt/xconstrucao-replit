import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/** Schema idempotente dos links públicos de acompanhamento xgestão (XG04). */
export async function bootstrapObraShareLinksSchema(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS obra_share_links (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        criado_por VARCHAR NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        expira_em TIMESTAMP,
        visualizacoes INTEGER NOT NULL DEFAULT 0,
        ultimo_acesso_em TIMESTAMP,
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS obra_share_links_token_uniq ON obra_share_links(token)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS obra_share_links_obra_ativo_idx ON obra_share_links(obra_id, ativo)`);
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS obra_share_links_one_active_obra_uniq
      ON obra_share_links(obra_id) WHERE ativo = TRUE
    `);
    console.info("[bootstrap-obra-share-links] schema ready");
  } catch (err) {
    console.error("[bootstrap-obra-share-links] failed:", err);
    throw err;
  }
}