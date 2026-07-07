import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente da tabela `notificacoes` (Task #52).
 * - Cria enum `notificacao_tipo` (lembrete/alerta/info/sucesso).
 * - Cria tabela `notificacoes` (id, user_id FK CASCADE, tipo, titulo, descricao, href, lida, created_at).
 * - Índice por (user_id, created_at DESC) para listar rápido e por (user_id, lida) para contar não lidas.
 */
export async function bootstrapNotificacoesSchema(): Promise<void> {
  try {
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE notificacao_tipo AS ENUM ('lembrete', 'alerta', 'info', 'sucesso');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tipo notificacao_tipo NOT NULL DEFAULT 'info',
        titulo TEXT NOT NULL,
        descricao TEXT NOT NULL,
        href TEXT,
        lida BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_notificacoes_user_created ON notificacoes(user_id, created_at DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_notificacoes_user_lida ON notificacoes(user_id, lida)`);

    // J13 hardening — coluna thread_id pra coalescing de notificações de chat
    // (substitui o match por href, frágil a mudanças de URL).
    // A FK pra chat_threads é criada em bootstrap-chat (que roda depois deste).
    await db.execute(sql`ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS thread_id VARCHAR`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_notificacoes_thread_user_lida ON notificacoes(thread_id, user_id, lida) WHERE thread_id IS NOT NULL`);

    // J13 hardening — dedupe de notificação NÃO-LIDA por (user_id, href).
    // Impede acúmulo de duplicatas idênticas não-lidas (ex.: obra-zona em pause→republish).
    // Re-disparo legítimo continua possível: ao ler (lida=true), a linha sai do índice parcial.
    //
    // Pré-limpeza idempotente: dado legado pode ter duplicatas que impediriam a criação do
    // índice único. Mantém a mais recente por (user_id, href) e marca as demais como lidas.
    await db.execute(sql`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (
                 PARTITION BY user_id, href
                 ORDER BY created_at DESC
               ) AS rn
        FROM notificacoes
        WHERE lida = false AND href IS NOT NULL
      )
      UPDATE notificacoes n SET lida = true
      FROM ranked r WHERE n.id = r.id AND r.rn > 1
    `);
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_notificacoes_user_href_unread
        ON notificacoes (user_id, href)
        WHERE lida = false AND href IS NOT NULL
    `);
  } catch (err) {
    console.error("[bootstrap-notificacoes] falha:", err);
    return;
  }

  console.info("[bootstrap-notificacoes] schema ready (notificacoes)");
}
