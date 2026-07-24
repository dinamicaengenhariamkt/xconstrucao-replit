import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * J58/J59 — Bootstrap idempotente do contrato entre as partes e do termo do anunciante.
 *
 * As jornadas 58 e 59 introduziram objetos de banco novos direto no schema Drizzle
 * (shared/db/schema.ts) sem um bootstrap que os criasse — eles existiam apenas no banco
 * de dev, onde foram aplicados à mão. Em qualquer ambiente novo o boot quebrava:
 * `bootstrap-legal-documents` insere `legal_documents.tipo = 'termo_anunciante'`, e o
 * enum `consent_document` não tinha esse valor. Por isso este bootstrap roda ANTES
 * daquele (ver instrumentation.ts).
 *
 * Cobre:
 *  - valores `termo_anunciante` e `contrato_obra` no enum `consent_document` (J59/J58);
 *  - enums `obra_contrato_status` e `contrato_papel` (J58);
 *  - coluna `obras.contrato_status` (J58);
 *  - tabela `contrato_assinaturas` + unique (obra_id, papel) (J58).
 *
 * Notas de implementação:
 *  - `ALTER TYPE ... ADD VALUE` não roda dentro de bloco transacional no Postgres, então
 *    cada valor vai em seu próprio `db.execute` — nunca dentro de `db.transaction`.
 *  - O Postgres não tem `CREATE TYPE IF NOT EXISTS`; o idioma equivalente é o bloco
 *    DO/EXCEPTION `duplicate_object`, idempotente por construção.
 *  - O unique (obra_id, papel) NÃO é decorativo: `assinarContrato` depende dele para o
 *    `onConflictDoNothing` que torna a assinatura idempotente.
 */
export async function bootstrapContratosSchema(): Promise<void> {
  try {
    // 1) Novos valores do enum `consent_document`. Fora de transação (limitação do PG).
    //    `IF NOT EXISTS` torna o passo idempotente entre re-deploys.
    await db.execute(sql`ALTER TYPE consent_document ADD VALUE IF NOT EXISTS 'termo_anunciante'`);
    await db.execute(sql`ALTER TYPE consent_document ADD VALUE IF NOT EXISTS 'contrato_obra'`);

    // 2) Enums do fluxo de contrato.
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE obra_contrato_status AS ENUM ('pendente_contratante', 'pendente_empreiteiro', 'assinado');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE contrato_papel AS ENUM ('contratante', 'empreiteiro');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // 3) Estado do contrato na obra. Nullable de propósito: null = obra sem fluxo de
    //    contrato (legado / não contratada), então não há backfill nem rewrite da tabela.
    await db.execute(
      sql`ALTER TABLE obras ADD COLUMN IF NOT EXISTS contrato_status obra_contrato_status`,
    );

    // 4) Assinaturas eletrônicas (molde de `user_consents`: registro com IP/UA).
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contrato_assinaturas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        candidatura_id VARCHAR REFERENCES candidaturas(id) ON DELETE SET NULL,
        papel contrato_papel NOT NULL,
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        versao_template INTEGER NOT NULL,
        assinado_em TIMESTAMP NOT NULL DEFAULT NOW(),
        ip TEXT,
        user_agent TEXT
      )
    `);
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS contrato_assinaturas_obra_papel_uniq
        ON contrato_assinaturas(obra_id, papel)
    `);
  } catch (err) {
    console.error("[bootstrap-contratos] falha:", err);
    return;
  }

  console.info(
    "[bootstrap-contratos] schema ready (consent_document +2 valores, obras.contrato_status, contrato_assinaturas)",
  );
}
