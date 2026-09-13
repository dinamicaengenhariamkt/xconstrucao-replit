import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * XG10 — bootstrap idempotente de `obra_aditivos`.
 *
 * Aditivo de contrato: valor acrescido (ou suprimido) ao escopo original da
 * obra. Antes desta tabela, `aditivos` era `0` hardcoded nos serviços de
 * detalhe, embora o card já aparecesse na UI.
 *
 * `valor` é assinado de propósito — aditivo de supressão reduz o contratado.
 */
export async function bootstrapObraAditivosSchema(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS obra_aditivos (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        descricao TEXT NOT NULL,
        valor NUMERIC(15,2) NOT NULL,
        data TEXT NOT NULL,
        criado_por VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // O caminho quente é somar todos os aditivos de uma obra ao montar o
    // detalhe; o índice evita varredura à medida que a tabela cresce.
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_obra_aditivos_obra ON obra_aditivos(obra_id)
    `);

    console.info("[bootstrap-obra-aditivos] schema ready");
  } catch (err) {
    console.error("[bootstrap-obra-aditivos] failed:", err);
    throw err;
  }
}
