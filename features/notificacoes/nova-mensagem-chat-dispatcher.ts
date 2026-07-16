import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { notificacoes } from "@shared/db/schema";
import { criarNotificacao } from "./service";

const TRECHO_MAX = 80;
const COALESCING_WINDOW_MINUTES = 5;

/** Trunca por code point (preserva emoji/surrogate pairs) ao invés de code unit UTF-16. */
function truncarTexto(texto: string, max: number): string {
  const cps = Array.from(texto);
  if (cps.length <= max) return texto;
  return `${cps.slice(0, max).join("").trimEnd()}…`;
}

export interface NotificarNovaMensagemArgs {
  threadId: string;
  autorUserId: string;
  destinatarioUserId: string;
  texto: string;
}

type ContextoRow = {
  dest_role: string;
  autor_nome: string | null;
  obra_nome: string;
} & Record<string, unknown>;

/**
 * Dispatcher de notificação de nova mensagem no chat (J13).
 * - Best-effort fire-and-forget: errors são logados mas não derrubam o caller.
 * - Coalescing: pula se já houver notificação não-lida pra esta thread na janela
 *   de 5 minutos. Sem isso, 5 mensagens em sequência viram 5 notificações.
 * - Sem email no MVP (chat é canal síncrono).
 */
export async function notificarNovaMensagem(args: NotificarNovaMensagemArgs): Promise<void> {
  try {
    const ctxResult = await db.execute<ContextoRow>(sql`
      SELECT
        dest.role::text AS dest_role,
        autor.name AS autor_nome,
        o.nome AS obra_nome
      FROM chat_threads t
      INNER JOIN obras o ON o.id = t.obra_id
      INNER JOIN users dest ON dest.id = ${args.destinatarioUserId}
      LEFT JOIN users autor ON autor.id = ${args.autorUserId}
      WHERE t.id = ${args.threadId}
      LIMIT 1
    `);

    const ctx = ctxResult.rows[0];
    if (!ctx) {
      console.warn("[chat-notif] contexto não encontrado para thread", args.threadId);
      return;
    }

    const basePath =
      ctx.dest_role === "contratante"
        ? "/contratante/chat"
        : ctx.dest_role === "empreiteiro"
          ? "/empreiteiro/chat"
          : null;

    if (!basePath) {
      // admin/superadmin não recebe notificação de chat.
      return;
    }

    // Padronizado em `?thread=` — contrato consumido pelas páginas de chat
    // (contratante e empreiteiro). Ver J41 Item 1.
    const href = `${basePath}?thread=${args.threadId}`;

    // Coalescing por thread_id (mais robusto que href, que pode ganhar query params no futuro).
    const cutoff = new Date(Date.now() - COALESCING_WINDOW_MINUTES * 60 * 1000);
    const [existente] = await db
      .select({ id: notificacoes.id })
      .from(notificacoes)
      .where(
        and(
          eq(notificacoes.userId, args.destinatarioUserId),
          eq(notificacoes.threadId, args.threadId),
          eq(notificacoes.lida, false),
          gt(notificacoes.createdAt, cutoff),
        ),
      )
      .limit(1);

    if (existente) {
      return;
    }

    const trecho = truncarTexto(args.texto, TRECHO_MAX);
    const autor = (ctx.autor_nome ?? "").trim() || "Alguém";

    await criarNotificacao({
      userId: args.destinatarioUserId,
      tipo: "info",
      titulo: `Nova mensagem de ${autor}`,
      descricao: ctx.obra_nome ? `${ctx.obra_nome}: ${trecho}` : trecho,
      href,
      threadId: args.threadId,
    });
  } catch (err) {
    console.error("[chat-notif] falha ao notificar nova mensagem:", err);
  }
}
