import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assertColumns } from "./lib/schema-health";

/**
 * Ocorrências editáveis (observação da resolução, `atualizado_em`) e autor
 * logado da assinatura do checklist (EMP-08). Espelha
 * migrations/0010_ocorrencias_edicao_checklist_assinante.sql. Idempotente.
 */
export async function bootstrapObraOcorrenciasEdicaoSchema(): Promise<void> {
  try {
    await db.execute(sql`ALTER TABLE obra_ocorrencias ADD COLUMN IF NOT EXISTS observacao_resolucao TEXT`);
    await db.execute(sql`ALTER TABLE obra_ocorrencias ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP`);
    await db.execute(sql`
      ALTER TABLE obra_checklists
        ADD COLUMN IF NOT EXISTS assinado_por_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL
    `);
    await assertColumns("obra_ocorrencias", ["observacao_resolucao", "atualizado_em"]);
    await assertColumns("obra_checklists", ["assinado_por_user_id"]);
    console.info("[bootstrap-obra-ocorrencias-edicao] schema ready");
  } catch (err) {
    console.error("[bootstrap-obra-ocorrencias-edicao] failed:", err);
    throw err;
  }
}
