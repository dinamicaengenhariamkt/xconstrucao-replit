import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente das tabelas de chat (J13).
 * - chat_threads: uma thread por obra (UNIQUE obra_id). FKs CASCADE pra obra/contratante/empreiteiro.
 * - chat_mensagens: FK CASCADE pra thread; anexo_obra_id (único anexo no MVP é ObraRefAttachment).
 * Índices:
 *   - listagem por participante ordenada por última mensagem (contratante e empreiteiro)
 *   - mensagens por thread, mais recentes primeiro
 *   - índice parcial pra contar mensagens não lidas rápido
 */
export async function bootstrapChatSchema(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chat_threads (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
        contratante_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        empreiteiro_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        criada_em TIMESTAMP NOT NULL DEFAULT NOW(),
        ultima_mensagem_em TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT chat_threads_obra_unique UNIQUE (obra_id)
      )
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_chat_threads_contratante ON chat_threads(contratante_user_id, ultima_mensagem_em DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_chat_threads_empreiteiro ON chat_threads(empreiteiro_user_id, ultima_mensagem_em DESC)`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS chat_mensagens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        thread_id VARCHAR NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
        autor_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        texto TEXT NOT NULL,
        anexo_obra_id VARCHAR REFERENCES obras(id) ON DELETE SET NULL,
        lida_em TIMESTAMP,
        criada_em TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_chat_mensagens_thread_criada ON chat_mensagens(thread_id, criada_em DESC)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_chat_mensagens_nao_lidas ON chat_mensagens(thread_id, autor_user_id) WHERE lida_em IS NULL`);
  } catch (err) {
    console.error("[bootstrap-chat] falha:", err);
    return;
  }

  console.info("[bootstrap-chat] schema ready (chat_threads, chat_mensagens)");
}
