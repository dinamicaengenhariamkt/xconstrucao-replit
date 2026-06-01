import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da Jornada 10 — Disputas.
 * - Enums: disputa_status, disputa_alvo, disputa_resolucao, disputa_categoria,
 *   disputa_prioridade.
 * - Tabelas: disputas, disputa_mensagens.
 * - Índice único PARCIAL garantindo no máximo uma disputa ABERTA por alvo
 *   (medição/pagamento) — base do "bloquear pagamento com disputa aberta".
 * - Valores novos no enum atividade_tipo (disputa_aberta, disputa_resolvida).
 */
export async function bootstrapDisputasSchema(): Promise<void> {
  try {
    await db.execute(sql`DO $$ BEGIN CREATE TYPE disputa_status AS ENUM ('aberta','em_analise','aguardando_partes','resolvida','cancelada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await db.execute(sql`DO $$ BEGIN CREATE TYPE disputa_alvo AS ENUM ('medicao','pagamento'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await db.execute(sql`DO $$ BEGIN CREATE TYPE disputa_resolucao AS ENUM ('favor_contratante','favor_empreiteiro','meio_termo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await db.execute(sql`DO $$ BEGIN CREATE TYPE disputa_categoria AS ENUM ('pagamento_atrasado','medicao_rejeitada','qualidade_obra','descumprimento_prazo','escopo_contrato','outros'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await db.execute(sql`DO $$ BEGIN CREATE TYPE disputa_prioridade AS ENUM ('alta','media','baixa'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);

    // Novos valores no enum de atividades (J07). ADD VALUE IF NOT EXISTS é idempotente.
    await db.execute(sql`ALTER TYPE atividade_tipo ADD VALUE IF NOT EXISTS 'disputa_aberta'`);
    await db.execute(sql`ALTER TYPE atividade_tipo ADD VALUE IF NOT EXISTS 'disputa_resolvida'`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS disputas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        aberta_por_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        contraparte_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        alvo_tipo disputa_alvo NOT NULL,
        alvo_id VARCHAR NOT NULL,
        categoria disputa_categoria NOT NULL DEFAULT 'outros',
        prioridade disputa_prioridade NOT NULL DEFAULT 'media',
        titulo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        valor_envolvido NUMERIC(15,2),
        status disputa_status NOT NULL DEFAULT 'aberta',
        responsavel_admin_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        resolucao_tipo disputa_resolucao,
        resolucao_texto TEXT,
        valor_ajustado NUMERIC(15,2),
        resolved_at TIMESTAMP,
        resolved_by_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS disputa_mensagens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        disputa_id VARCHAR NOT NULL REFERENCES disputas(id) ON DELETE CASCADE,
        autor_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        texto TEXT NOT NULL,
        anexo_file_id VARCHAR REFERENCES user_files(id) ON DELETE SET NULL,
        interna BOOLEAN NOT NULL DEFAULT FALSE,
        criada_em TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_disputas_obra ON disputas(obra_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_disputas_status ON disputas(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_disputa_mensagens_disputa ON disputa_mensagens(disputa_id)`);
    // No máximo uma disputa ativa por alvo. Disputas resolvidas/canceladas saem
    // do índice, permitindo reabrir uma nova disputa sobre o mesmo alvo depois.
    await db.execute(
      sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_disputas_alvo_aberta ON disputas(alvo_tipo, alvo_id) WHERE status NOT IN ('resolvida','cancelada')`,
    );
  } catch (err) {
    console.error("[bootstrap-disputas] falha:", err);
    return;
  }

  console.info("[bootstrap-disputas] schema ready (disputas + disputa_mensagens)");
}
