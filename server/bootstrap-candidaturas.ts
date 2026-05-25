import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da camada de Candidaturas (J05 — Task #64).
 * - Adiciona colunas novas em `candidaturas` (motivo_rejeicao, mensagem_contratante,
 *   notificacao_disparada, cancelada_pelo_empreiteiro, decidida_em, observacoes_financeiras).
 * - Cria UNIQUE(obra_id, empreiteiro_id) — substitui o check racy do POST atual.
 *
 * Mesmo padrão de bootstrap-marketplace / bootstrap-obras: roda em toda
 * inicialização. Seguro re-rodar.
 */
export async function bootstrapCandidaturasSchema(): Promise<void> {
  try {
    await db.execute(sql`ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS observacoes_financeiras text`);
    await db.execute(sql`ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS motivo_rejeicao text`);
    await db.execute(sql`ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS mensagem_contratante text`);
    await db.execute(sql`ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS notificacao_disparada boolean NOT NULL DEFAULT false`);
    await db.execute(sql`ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS cancelada_pelo_empreiteiro boolean NOT NULL DEFAULT false`);
    await db.execute(sql`ALTER TABLE candidaturas ADD COLUMN IF NOT EXISTS decidida_em timestamp`);
  } catch (err) {
    console.error("[bootstrap-candidaturas] ALTER TABLE:", err);
  }

  // UNIQUE garante 1 candidatura por (obra, empreiteiro). Para tornar o
  // CREATE robusto contra duplicatas legadas, fazemos dedupe ANTES — mantém
  // a candidatura mais antiga por par e remove as outras (best-effort).
  // Em produção é raro, mas evita que o índice fique "silenciosamente
  // ausente" e a proteção do POST caia no fallback racy.
  try {
    await db.execute(sql`
      DELETE FROM candidaturas
      WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY obra_id, empreiteiro_id
            ORDER BY created_at ASC NULLS LAST, id ASC
          ) AS rn
          FROM candidaturas
          WHERE obra_id IS NOT NULL AND empreiteiro_id IS NOT NULL
        ) sub
        WHERE rn > 1
      )
    `);
  } catch (err) {
    console.error("[bootstrap-candidaturas] dedupe legacy duplicates:", err);
  }

  try {
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_candidaturas_obra_empreiteiro_unique
      ON candidaturas(obra_id, empreiteiro_id)
    `);
  } catch (err) {
    // Se ainda falhar, deixar barulhento — o POST tem fallback (pre-check)
    // mas a proteção mais forte vem do índice.
    console.error("[bootstrap-candidaturas] UNIQUE index FAILED — POST cairá no pre-check racy:", err);
  }

  console.info("[bootstrap-candidaturas] schema ready");
}
