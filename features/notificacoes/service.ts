import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { notificacoes, type Notificacao } from "@shared/db/schema";

export type NotificacaoTipo = "lembrete" | "alerta" | "info" | "sucesso";

export interface CriarNotificacaoArgs {
  userId: string;
  tipo: NotificacaoTipo;
  titulo: string;
  descricao: string;
  href?: string | null;
  threadId?: string | null;
}

export async function criarNotificacao(args: CriarNotificacaoArgs): Promise<Notificacao | null> {
  try {
    const [row] = await db
      .insert(notificacoes)
      .values({
        userId: args.userId,
        tipo: args.tipo,
        titulo: args.titulo,
        descricao: args.descricao,
        href: args.href ?? null,
        threadId: args.threadId ?? null,
      })
      .onConflictDoNothing()
      .returning();
    return row ?? null;
  } catch (err) {
    console.error("[notificacoes] falha ao criar notificação:", err);
    return null;
  }
}

export async function listarNotificacoes(userId: string, limit = 50): Promise<Notificacao[]> {
  return db
    .select()
    .from(notificacoes)
    .where(eq(notificacoes.userId, userId))
    .orderBy(desc(notificacoes.createdAt))
    .limit(limit);
}

export async function contarNaoLidas(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(notificacoes)
    .where(and(eq(notificacoes.userId, userId), eq(notificacoes.lida, false)));
  return row?.count ?? 0;
}

export async function marcarComoLida(userId: string, id: string): Promise<boolean> {
  const result = await db
    .update(notificacoes)
    .set({ lida: true })
    .where(and(eq(notificacoes.id, id), eq(notificacoes.userId, userId)))
    .returning({ id: notificacoes.id });
  return result.length > 0;
}

export async function marcarTodasComoLidas(userId: string): Promise<number> {
  const result = await db
    .update(notificacoes)
    .set({ lida: true })
    .where(and(eq(notificacoes.userId, userId), eq(notificacoes.lida, false)))
    .returning({ id: notificacoes.id });
  return result.length;
}
