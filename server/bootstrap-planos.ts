import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { PLANS_CATALOG, type PlanoPersona, type PlanoTier } from "@shared/lib/plans-catalog";

/**
 * Bootstrap idempotente da Jornada 11 — Planos & Assinatura.
 * - Enums: plano_persona, assinatura_status.
 * - Tabelas: planos (catálogo), assinaturas, assinatura_eventos.
 * - Índices únicos PARCIAIS: 1 assinatura ativa por user; 1 evento por
 *   gateway_event_id (idempotência do webhook).
 * - Seed do catálogo a partir de shared/lib/plans-catalog (fonte de verdade dos
 *   limites). Idempotente por (tier, persona).
 */
export async function bootstrapPlanosSchema(): Promise<void> {
  try {
    await db.execute(sql`DO $$ BEGIN CREATE TYPE plano_persona AS ENUM ('contratante','empreiteiro','ambos'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await db.execute(sql`DO $$ BEGIN CREATE TYPE assinatura_status AS ENUM ('ativa','cancelada','inadimplente','expirada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    // Migração idempotente: adiciona 'pendente_reativacao' ao enum se ainda não existir.
    await db.execute(sql`DO $$ BEGIN ALTER TYPE assinatura_status ADD VALUE IF NOT EXISTS 'pendente_reativacao'; EXCEPTION WHEN others THEN NULL; END $$;`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS planos (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tier plano NOT NULL,
        persona plano_persona NOT NULL,
        nome TEXT NOT NULL,
        descricao TEXT,
        valor_mensal NUMERIC(15,2) NOT NULL DEFAULT 0,
        valor_anual NUMERIC(15,2),
        limites_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        features TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_planos_tier_persona ON planos(tier, persona)`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assinaturas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plano_id VARCHAR NOT NULL REFERENCES planos(id),
        status assinatura_status NOT NULL DEFAULT 'ativa',
        ciclo TEXT NOT NULL DEFAULT 'mensal',
        iniciada_em TIMESTAMP NOT NULL DEFAULT NOW(),
        renova_em TIMESTAMP,
        cancelada_em TIMESTAMP,
        gateway_provider TEXT NOT NULL DEFAULT 'manual',
        gateway_customer_id TEXT,
        gateway_subscription_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_assinaturas_user ON assinaturas(user_id)`);
    // No máximo uma assinatura ATIVA por usuário.
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_assinaturas_user_ativa ON assinaturas(user_id) WHERE status = 'ativa'`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assinatura_eventos (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        assinatura_id VARCHAR REFERENCES assinaturas(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL,
        gateway_event_id TEXT,
        payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    // Idempotência do webhook: um evento por gateway_event_id (quando presente).
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_assinatura_eventos_gateway ON assinatura_eventos(gateway_event_id) WHERE gateway_event_id IS NOT NULL`);

    // Seed do catálogo a partir do plans-catalog (idempotente por tier+persona).
    const personas: PlanoPersona[] = ["empreiteiro", "contratante"];
    const tiers: PlanoTier[] = ["free", "pro", "enterprise"];
    for (const persona of personas) {
      for (const tier of tiers) {
        const c = PLANS_CATALOG[persona][tier];
        await db.execute(sql`
          INSERT INTO planos (tier, persona, nome, descricao, valor_mensal, limites_json, features, ativo)
          VALUES (
            ${tier}::plano, ${persona}::plano_persona, ${c.nome}, NULL, ${c.precoMensal},
            ${JSON.stringify(c.limites)}::jsonb, ${sql.raw(`ARRAY[${c.features.map((f) => `'${f.replace(/'/g, "''")}'`).join(",")}]::text[]`)}, TRUE
          )
          ON CONFLICT (tier, persona) DO NOTHING
        `);
      }
    }
  } catch (err) {
    console.error("[bootstrap-planos] falha:", err);
    return;
  }

  console.info("[bootstrap-planos] schema ready (planos + assinaturas + eventos, catálogo seedado)");
}
