import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assertColumns } from "./lib/schema-health";

/**
 * Bootstrap idempotente da Jornada 42 — Fundação de dados: marketplace split.
 * Só modelagem (schema), SEM comportamento novo. Destrava J43–J50.
 * - Colunas novas em `users`: cpf_cnpj, asaas_customer_id (nullable).
 * - Enums: asaas_subconta_status, split_pagamento_status.
 * - Tabelas: asaas_subcontas (subconta recebedora do empreiteiro, com wallet_id),
 *   pagamentos_split (repasse por cobrança de obra; unique asaas_payment_id p/
 *   idempotência do webhook).
 */
export async function bootstrapMarketplaceSplitSchema(): Promise<void> {
  try {
    // Colunas novas em users (papel pagador/recebedor + customer Asaas proativo).
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT`);

    // Enums (idempotentes via bloco DO com EXCEPTION duplicate_object).
    await db.execute(sql`DO $$ BEGIN CREATE TYPE asaas_subconta_status AS ENUM ('pendente','aguardando_kyc','aprovada','rejeitada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await db.execute(sql`DO $$ BEGIN CREATE TYPE split_pagamento_status AS ENUM ('pendente','confirmado','repassado','falhou','estornado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);

    // Subconta Asaas do empreiteiro (uma por usuário). asaas_api_key_enc SEMPRE
    // cifrada em repouso — o valor puro nunca é persistido (cripto em J45).
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS asaas_subcontas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        asaas_account_id TEXT,
        wallet_id TEXT,
        asaas_api_key_enc TEXT,
        onboarding_status asaas_subconta_status NOT NULL DEFAULT 'pendente',
        kyc_status TEXT,
        tipo_conta TEXT,
        pix_chave TEXT,
        pix_tipo TEXT,
        banco_codigo TEXT,
        agencia TEXT,
        conta TEXT,
        conta_digito TEXT,
        conta_tipo TEXT,
        titular_nome TEXT,
        titular_cpf_cnpj TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_asaas_subcontas_user ON asaas_subcontas(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_asaas_subcontas_account ON asaas_subcontas(asaas_account_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_asaas_subcontas_wallet ON asaas_subcontas(wallet_id)`);

    // Repasse por cobrança de obra com split. unique asaas_payment_id =
    // idempotência do webhook de confirmação (J48).
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pagamentos_split (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        financeiro_id VARCHAR REFERENCES financeiro(id),
        obra_id VARCHAR REFERENCES obras(id),
        medicao_id VARCHAR,
        pagador_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        recebedor_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        asaas_payment_id TEXT,
        asaas_checkout_id TEXT,
        valor_total NUMERIC(15,2),
        valor_plataforma NUMERIC(15,2),
        valor_empreiteiro NUMERIC(15,2),
        percentual_plataforma NUMERIC(5,2),
        wallet_id_empreiteiro TEXT,
        status split_pagamento_status NOT NULL DEFAULT 'pendente',
        billing_type TEXT,
        confirmado_em TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    // Idempotência do webhook: um registro por asaas_payment_id (quando presente).
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_pagamentos_split_asaas_payment ON pagamentos_split(asaas_payment_id) WHERE asaas_payment_id IS NOT NULL`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_pagamentos_split_obra_status ON pagamentos_split(obra_id, status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_pagamentos_split_financeiro ON pagamentos_split(financeiro_id)`);

    // J49 — histórico local de saques (transferências da subconta para o banco).
    await db.execute(sql`DO $$ BEGIN CREATE TYPE saque_status AS ENUM ('pendente','concluido','falhou'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS saques (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        valor NUMERIC(15,2) NOT NULL,
        status saque_status NOT NULL DEFAULT 'pendente',
        asaas_transfer_id TEXT,
        metodo TEXT,
        erro TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_saques_user ON saques(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_saques_transfer ON saques(asaas_transfer_id)`);

    // Falha cedo se algum CREATE/ALTER silenciosamente não aplicar (defesa Neon).
    await assertColumns("users", ["cpf_cnpj", "asaas_customer_id"]);
    await assertColumns("asaas_subcontas", ["user_id", "wallet_id", "asaas_api_key_enc", "onboarding_status"]);
    await assertColumns("pagamentos_split", ["asaas_payment_id", "obra_id", "status", "valor_empreiteiro"]);
    await assertColumns("saques", ["user_id", "valor", "status", "asaas_transfer_id"]);
  } catch (err) {
    console.error("[bootstrap-marketplace-split] falha:", err);
    return;
  }

  console.info("[bootstrap-marketplace-split] schema ready (users.cpf_cnpj/asaas_customer_id + asaas_subcontas + pagamentos_split + saques)");
}
