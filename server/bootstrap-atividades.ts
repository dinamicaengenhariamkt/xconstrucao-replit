import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da J07 — Atividades & Timeline.
 *
 * Cria:
 *  - enum `atividade_tipo` cobrindo eventos de J03/J05/J06/J08.
 *  - tabela `atividades` (id uuid, tipo, actor_user_id, obra_id?, target_user_id?, payload jsonb, created_at).
 *  - índices: (obra_id, created_at desc), (actor_user_id, created_at desc), (tipo, created_at desc).
 *
 * Decisão: `atividades` é separada de `audit_logs`. audit_logs é trilha
 * técnica de segurança (login, password reset, impersonate, etc.); atividades
 * é feed cronológico de domínio para 3 dashboards + timeline da obra +
 * gatilho de notificações (J13).
 */
export async function bootstrapAtividadesSchema(): Promise<void> {
  try {
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE atividade_tipo AS ENUM (
          'obra_publicada',
          'candidatura_criada',
          'candidatura_aceita',
          'candidatura_rejeitada',
          'candidatura_cancelada',
          'medicao_criada',
          'medicao_aprovada',
          'medicao_contestada',
          'diario_postado',
          'ocorrencia_aberta',
          'ocorrencia_resolvida',
          'lancamento_criado',
          'lancamento_quitado'
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS atividades (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tipo atividade_tipo NOT NULL,
        actor_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        obra_id VARCHAR REFERENCES obras(id) ON DELETE SET NULL,
        target_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_atividades_obra_created ON atividades(obra_id, created_at DESC)`,
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_atividades_actor_created ON atividades(actor_user_id, created_at DESC)`,
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_atividades_tipo_created ON atividades(tipo, created_at DESC)`,
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_atividades_target_created ON atividades(target_user_id, created_at DESC)`,
    );
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_atividades_created ON atividades(created_at DESC)`,
    );
  } catch (err) {
    console.error("[bootstrap-atividades] falha:", err);
    return;
  }

  console.info("[bootstrap-atividades] schema ready (atividades + atividade_tipo)");
}
