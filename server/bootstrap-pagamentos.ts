import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da camada de Pagamentos (J08 — Task #48).
 * - Cria enum `financeiro_status` e novas colunas em `financeiro`
 *   (status, dataVencimento, dataPagamento, metodoPagamento,
 *    comprovanteUrl, comprovanteFileId, medicaoId,
 *    pagadorUserId, recebedorUserId, createdAt).
 * - Backfill: lançamentos legados ficam como `pago` com data_pagamento = data.
 * - Índices para consultas por pagador/recebedor/status.
 */
export async function bootstrapPagamentosSchema(): Promise<void> {
  try {
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE financeiro_status AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS status financeiro_status NOT NULL DEFAULT 'pendente'`);
    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS data_vencimento TEXT`);
    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS data_pagamento TEXT`);
    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT`);
    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS comprovante_url TEXT`);
    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS comprovante_file_id VARCHAR REFERENCES user_files(id) ON DELETE SET NULL`);
    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS medicao_id VARCHAR`);
    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS pagador_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL`);
    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS recebedor_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL`);
    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);

    // Backfill: linhas legadas (sem status explícito) — manter histórico como pago.
    await db.execute(sql`UPDATE financeiro SET status = 'pago', data_pagamento = COALESCE(data_pagamento, data) WHERE status = 'pendente' AND data_pagamento IS NULL AND created_at IS NULL`);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_financeiro_status ON financeiro(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_financeiro_pagador ON financeiro(pagador_user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_financeiro_recebedor ON financeiro(recebedor_user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_financeiro_obra ON financeiro(obra_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_financeiro_medicao ON financeiro(medicao_id)`);
    // Idempotência do hook J06→J08 (Task #82): uma medição aprovada gera no
    // máximo um lançamento. Índice parcial para não conflitar com legados
    // que têm medicao_id NULL.
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_financeiro_medicao_unique ON financeiro(medicao_id) WHERE medicao_id IS NOT NULL`,
    );
  } catch (err) {
    console.error("[bootstrap-pagamentos] falha:", err);
    return;
  }

  console.info("[bootstrap-pagamentos] schema ready (financeiro estendido)");
}
