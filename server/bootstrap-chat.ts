import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assertColumns } from "./lib/schema-health";

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
    // J13 — paginação keyset (criada_em, id) DESC. Cobre o tiebreaker `id` usado
    // na comparação de tupla de `listarMensagensDaThread`.
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_chat_mensagens_thread_keyset ON chat_mensagens(thread_id, criada_em DESC, id DESC)`);

    // J41 Task #145 — colunas de arquivo no chat (idempotente).
    // texto permanece NOT NULL no schema; file-only envia texto=''.
    await db.execute(sql`ALTER TABLE chat_mensagens ADD COLUMN IF NOT EXISTS arquivo_url TEXT`);
    await db.execute(sql`ALTER TABLE chat_mensagens ADD COLUMN IF NOT EXISTS arquivo_nome TEXT`);
    await db.execute(sql`ALTER TABLE chat_mensagens ADD COLUMN IF NOT EXISTS arquivo_mime TEXT`);

    // Verify the columns actually exist — ADD COLUMN IF NOT EXISTS can silently
    // fail on Neon Postgres. Throws SchemaHealthError if any are missing so
    // runBootstrap() in instrumentation.ts catches it and logs the failure loudly.
    await assertColumns("chat_mensagens", ["arquivo_url", "arquivo_nome", "arquivo_mime"]);

    // FK cross-table: notificacoes.thread_id → chat_threads.id (ON DELETE SET NULL).
    // Garante que notificações ficam órfãs nulas quando a thread some (ex: cascade da obra).
    // Adicionada aqui porque bootstrap-notificacoes roda antes — quando criou a coluna,
    // chat_threads ainda não existia.
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE notificacoes
          ADD CONSTRAINT notificacoes_thread_id_fk
          FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
  } catch (err) {
    console.error("[bootstrap-chat] falha:", err);
    return;
  }

  console.info("[bootstrap-chat] schema ready (chat_threads, chat_mensagens)");
}
