import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da Jornada 23 — Self-Service de Anúncios.
 *
 * Depende de:
 * - `users` (já existe) — FKs de papel/pedido/moderação.
 * - `anunciantes` e `anuncios` (J12, criadas em bootstrap-anuncios) — esta rotina
 *   roda DEPOIS dela (ver ordem em instrumentation.ts).
 *
 * Cria:
 * - valor de enum `user_role` = 'anunciante' (ADD VALUE idempotente).
 * - enum `user_role_origem`, `pedido_anuncio_status`, `pedido_cobranca_status`.
 * - tabela `user_roles` (papéis aditivos) + backfill dos papéis primários atuais.
 * - coluna `anunciantes.user_id` (vínculo opcional com a conta do anunciante).
 * - tabelas `pedidos_anuncio` e `pedido_slots`.
 */
export async function bootstrapAnunciosSelfServiceSchema(): Promise<void> {
  try {
    // Novo valor do enum de papel. ADD VALUE não roda dentro de bloco DO/transação
    // em algumas versões do Postgres — usar IF NOT EXISTS direto (idempotente).
    await db.execute(sql`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'anunciante'`);

    await db.execute(
      sql`DO $$ BEGIN CREATE TYPE user_role_origem AS ENUM ('signup','upgrade','backfill'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    );
    // Enum dedicado de papéis aditivos — sem admin/superadmin (constraint de banco).
    await db.execute(
      sql`DO $$ BEGIN CREATE TYPE user_additive_role AS ENUM ('contratante','empreiteiro','anunciante'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    );
    // XG01 — produto adicional para empreiteiros. Mantemos users.role como
    // "empreiteiro"; a permissão xgestão é concedida pontualmente em user_roles.
    // ADD VALUE fica fora de DO/transação porque versões antigas do Postgres não
    // permitem esse comando dentro de bloco transacional.
    await db.execute(sql`ALTER TYPE user_additive_role ADD VALUE IF NOT EXISTS 'xgestao'`);
    await db.execute(
      sql`DO $$ BEGIN CREATE TYPE pedido_anuncio_status AS ENUM ('em_analise','aprovado','recusado','publicado','encerrado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    );
    await db.execute(
      sql`DO $$ BEGIN CREATE TYPE pedido_cobranca_status AS ENUM ('prototipo','pendente','paga','isenta'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    );

    // Papéis aditivos (role usa o enum dedicado, sem admin/superadmin).
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_roles (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role user_additive_role NOT NULL,
        origem user_role_origem NOT NULL DEFAULT 'signup',
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_roles_user_role ON user_roles(user_id, role)`,
    );
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id)`);

    // Backfill: cada usuário com papel primário comum (contratante/empreiteiro/
    // anunciante) ganha a linha correspondente. Admin/superadmin NÃO recebem (o
    // enum aditivo nem aceita). Idempotente (ON CONFLICT no índice único).
    await db.execute(sql`
      INSERT INTO user_roles (user_id, role, origem)
      SELECT id, role::text::user_additive_role, 'backfill' FROM users
      WHERE role IN ('contratante','empreiteiro','anunciante')
      ON CONFLICT (user_id, role) DO NOTHING
    `);

    // Vínculo opcional anunciante↔usuário (unifica o conceito de anunciante).
    await db.execute(
      sql`ALTER TABLE anunciantes ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL`,
    );
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS uniq_anunciantes_user_id ON anunciantes(user_id) WHERE user_id IS NOT NULL`,
    );

    // Pedido (cabeçalho) + slots (itens).
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pedidos_anuncio (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        solicitante_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status pedido_anuncio_status NOT NULL DEFAULT 'em_analise',
        motivo_recusa TEXT,
        valor_total NUMERIC(15,2) NOT NULL DEFAULT 0,
        cobranca_status pedido_cobranca_status NOT NULL DEFAULT 'prototipo',
        criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
        moderado_em TIMESTAMP,
        moderado_por VARCHAR REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_pedidos_anuncio_solicitante ON pedidos_anuncio(solicitante_user_id)`,
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_pedidos_anuncio_status ON pedidos_anuncio(status)`,
    );

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pedido_slots (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        pedido_id VARCHAR NOT NULL REFERENCES pedidos_anuncio(id) ON DELETE CASCADE,
        zona TEXT NOT NULL,
        template TEXT NOT NULL DEFAULT 'imagem-card',
        titulo TEXT NOT NULL,
        subtitulo TEXT,
        criativo_url TEXT,
        cta_url TEXT,
        cta_texto TEXT,
        conteudo JSONB,
        periodo_inicio TEXT,
        periodo_fim TEXT,
        valor_slot NUMERIC(15,2) NOT NULL DEFAULT 0,
        anuncio_id VARCHAR REFERENCES anuncios(id) ON DELETE SET NULL
      )
    `);
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_pedido_slots_pedido ON pedido_slots(pedido_id)`,
    );

    // J31 — cobrança real one-off: colunas de gateway em pedidos_anuncio + tabela
    // de eventos de pagamento (idempotência do webhook). Todas nullable/idempotentes.
    await db.execute(sql`ALTER TABLE pedidos_anuncio ADD COLUMN IF NOT EXISTS gateway_provider TEXT`);
    await db.execute(sql`ALTER TABLE pedidos_anuncio ADD COLUMN IF NOT EXISTS gateway_customer_id TEXT`);
    await db.execute(sql`ALTER TABLE pedidos_anuncio ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT`);
    await db.execute(sql`ALTER TABLE pedidos_anuncio ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT`);
    await db.execute(sql`ALTER TABLE pedidos_anuncio ADD COLUMN IF NOT EXISTS invoice_url TEXT`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pedido_pagamento_eventos (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        pedido_id VARCHAR REFERENCES pedidos_anuncio(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL,
        gateway_event_id TEXT,
        payload_json JSONB NOT NULL DEFAULT '{}',
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_pedido_pagamento_eventos_gateway ON pedido_pagamento_eventos(gateway_event_id)`,
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_pedido_pagamento_eventos_pedido ON pedido_pagamento_eventos(pedido_id)`,
    );
  } catch (err) {
    console.error("[bootstrap-anuncios-self-service] falha:", err);
    return;
  }

  console.info(
    "[bootstrap-anuncios-self-service] schema ready (user_roles[+backfill] + anunciantes.user_id + pedidos_anuncio[+gateway] + pedido_slots + pedido_pagamento_eventos)",
  );
}
