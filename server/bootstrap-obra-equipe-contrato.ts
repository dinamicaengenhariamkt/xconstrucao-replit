import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * XG22 — o contrato do prestador mora no card dele.
 *
 * Pedido do cliente: "no cadastro do prestador, coloca uma caixa para pôr a
 * chave PIX dele também (...) e também o valor de contrato, ou até anexar um
 * link, um PDF, porque se a gente tiver um contrato assinado a gente anexa aqui
 * também junto com o card do prestador. E esse valor de contrato o sistema tem
 * que puxar e colocar como prévia de gasto da obra."
 *
 * - `pix_chave` é TEXT sem validação de formato: chave PIX pode ser CPF, CNPJ,
 *   e-mail, telefone ou aleatória. Um regex aqui recusaria chave válida no meio
 *   do cadastro, que é o pior momento para errar.
 * - `valor_contrato` é NUMERIC(15,2), o mesmo tipo de `obras.valor_total` e
 *   `financeiro.valor` — dinheiro neste schema nunca é float.
 * - `contrato_file_id` + `contrato_link_url`: arquivo OU link, o arranjo de
 *   `obra_anexos`. A exclusividade é validada na rota, não no banco, como lá.
 * - A FK é `ON DELETE SET NULL`: apagar o arquivo não pode apagar o prestador.
 *
 * Roda DEPOIS de `obra-operacao` (cria `obra_equipe`) e de `storage` (cria
 * `user_files`) — ver a ordem em `instrumentation.ts`. Num banco limpo, inverter
 * faz a constraint falhar.
 */
export async function bootstrapObraEquipeContratoSchema(): Promise<void> {
  try {
    await db.execute(sql`ALTER TABLE obra_equipe ADD COLUMN IF NOT EXISTS pix_chave TEXT`);
    await db.execute(
      sql`ALTER TABLE obra_equipe ADD COLUMN IF NOT EXISTS valor_contrato NUMERIC(15, 2)`,
    );
    await db.execute(sql`ALTER TABLE obra_equipe ADD COLUMN IF NOT EXISTS contrato_file_id VARCHAR`);
    await db.execute(sql`ALTER TABLE obra_equipe ADD COLUMN IF NOT EXISTS contrato_link_url TEXT`);

    // `ADD CONSTRAINT` não aceita IF NOT EXISTS no Postgres; o bloco guardado é
    // o que torna o bootstrap repetível, como em bootstrap-financeiro-fornecedor.
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE obra_equipe
          ADD CONSTRAINT obra_equipe_contrato_file_id_fkey
          FOREIGN KEY (contrato_file_id) REFERENCES user_files(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
  } catch (err) {
    console.error("[bootstrap-obra-equipe-contrato] falha:", err);
    return;
  }

  console.info("[bootstrap-obra-equipe-contrato] schema ready (obra_equipe: pix, contrato)");
}
