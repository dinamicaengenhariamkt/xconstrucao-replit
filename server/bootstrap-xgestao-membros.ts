import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assertColumns } from "./lib/schema-health";

/** XG31 — associações multiusuário e grants por obra. Idempotente no boot. */
export async function bootstrapXgestaoMembrosSchema(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS obras_id_empresa_uniq
        ON obras(id, empreiteira_id)
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS xgestao_membros (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        empreiteira_id VARCHAR NOT NULL REFERENCES empreiteiras(id) ON DELETE CASCADE,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        papel TEXT NOT NULL CHECK (papel IN ('gestor', 'colaborador')),
        status TEXT NOT NULL DEFAULT 'convidado' CHECK (status IN ('convidado', 'ativo', 'revogado')),
        areas_permitidas JSONB,
        categorias_financeiro_permitidas JSONB,
        convidado_por VARCHAR NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
        atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT xgestao_membros_id_empresa_uniq UNIQUE(id, empreiteira_id)
      )
    `);
    // NULL deliberately means unrestricted so existing memberships (including
    // gestores) retain their current access after this additive migration.
    await db.execute(sql`ALTER TABLE xgestao_membros ADD COLUMN IF NOT EXISTS areas_permitidas JSONB`);
    await db.execute(sql`ALTER TABLE xgestao_membros ADD COLUMN IF NOT EXISTS categorias_financeiro_permitidas JSONB`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS xgestao_membros_user_uniq ON xgestao_membros(user_id)`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS xgestao_membros_empresa_user_uniq ON xgestao_membros(empreiteira_id, user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS xgestao_membros_empresa_status_idx ON xgestao_membros(empreiteira_id, status)`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS xgestao_membro_obras (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        membro_id VARCHAR NOT NULL,
        empreiteira_id VARCHAR NOT NULL,
        obra_id VARCHAR NOT NULL,
        permissao TEXT NOT NULL CHECK (permissao IN ('visualizar', 'editar')),
        criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT xgestao_membro_obras_membro_empresa_fk
          FOREIGN KEY (membro_id, empreiteira_id)
          REFERENCES xgestao_membros(id, empreiteira_id) ON DELETE CASCADE,
        CONSTRAINT xgestao_membro_obras_obra_empresa_fk
          FOREIGN KEY (obra_id, empreiteira_id)
          REFERENCES obras(id, empreiteira_id) ON DELETE CASCADE,
        CONSTRAINT xgestao_membro_obras_membro_obra_uniq UNIQUE(membro_id, obra_id)
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS xgestao_membro_obras_empresa_obra_idx ON xgestao_membro_obras(empreiteira_id, obra_id)`);
    await assertColumns("xgestao_membros", ["id", "empreiteira_id", "user_id", "papel", "status", "areas_permitidas", "categorias_financeiro_permitidas", "convidado_por", "atualizado_em"]);
    await assertColumns("xgestao_membro_obras", ["membro_id", "empreiteira_id", "obra_id", "permissao"]);
    console.info("[bootstrap-xgestao-membros] schema ready");
  } catch (err) {
    console.error("[bootstrap-xgestao-membros] failed:", err);
    throw err;
  }
}