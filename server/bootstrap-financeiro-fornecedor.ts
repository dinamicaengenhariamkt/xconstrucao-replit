import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * XG20 — beneficiário da saída ("para quem foi o dinheiro").
 *
 * Pedido do cliente após usar o console em obra real: "cadastrei lá o Jefferson
 * de elétrica... eu quero fazer um pagamento para ele, eu posso selecionar ele
 * aqui. Porque depois no filtro eu posso colocar lá Jefferson elétrica e eu vejo
 * quanto eu paguei só para ele."
 *
 * Antes disto o beneficiário só existia como texto dentro da descrição — que é
 * exatamente o placeholder do campo. Texto livre não filtra: "Jefferson
 * Elétrica" e "jefferson eletrica" são duas pessoas para qualquer agregação.
 *
 * - `fornecedor_id` → `obra_equipe.id`, o vínculo exato que o filtro usa.
 *   `ON DELETE SET NULL`: remover alguém da equipe não pode apagar o histórico
 *   financeiro da obra.
 * - `fornecedor_nome` guarda o nome no momento do lançamento, para o registro
 *   continuar legível depois que o vínculo for zerado.
 * - Índice por `(obra_id, fornecedor_id)`, que é como a listagem consulta.
 */
export async function bootstrapFinanceiroFornecedorSchema(): Promise<void> {
  try {
    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS fornecedor_id VARCHAR`);
    await db.execute(sql`ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS fornecedor_nome TEXT`);

    // `ADD CONSTRAINT` não aceita IF NOT EXISTS no Postgres; o bloco guardado é
    // o que torna o bootstrap repetível, como o enum do bootstrap-financeiro-escopo.
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE financeiro
          ADD CONSTRAINT financeiro_fornecedor_id_fkey
          FOREIGN KEY (fornecedor_id) REFERENCES obra_equipe(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_financeiro_obra_fornecedor ON financeiro(obra_id, fornecedor_id)`,
    );
  } catch (err) {
    console.error("[bootstrap-financeiro-fornecedor] falha:", err);
    return;
  }

  console.info("[bootstrap-financeiro-fornecedor] schema ready (financeiro: fornecedor)");
}
