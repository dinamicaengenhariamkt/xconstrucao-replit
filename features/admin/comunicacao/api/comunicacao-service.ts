// J21 — Observabilidade de Comunicação (Admin) · camada de leitura.
// Estritamente READ-ONLY sobre tabelas existentes (chat, notificações, audit).
// Schema de chat fica INTOCADO — o admin lê por fora, não vira participante.
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@shared/db/db";
import {
  auditLogs,
  chatMensagens,
  chatThreads,
  notificacoes,
  obras,
  users,
} from "@shared/db/schema";
import type {
  AdminAuditoriaFiltro,
  AdminAuditoriaItem,
  AdminChatMensagem,
  AdminChatThread,
  AdminChatThreadDetalhe,
  AdminChatThreadsFiltro,
  AdminNotificacaoItem,
  AdminNotificacoesFiltro,
  NotificacaoTipo,
  Paginado,
} from "../types";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function clampPage(page?: number): number {
  return Math.max(1, Math.floor(page ?? 1));
}
function clampPageSize(pageSize?: number): number {
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSize ?? DEFAULT_PAGE_SIZE)));
}
function iso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

// ─── Threads de chat (lista paginada) ────────────────────────────────────────
export async function listarThreadsAdmin(
  filtro: AdminChatThreadsFiltro,
): Promise<Paginado<AdminChatThread>> {
  const page = clampPage(filtro.page);
  const pageSize = clampPageSize(filtro.pageSize);
  const offset = (page - 1) * pageSize;

  const contratante = alias(users, "contratante");
  const empreiteiro = alias(users, "empreiteiro");

  const busca = filtro.busca?.trim();
  const condicoes = [];
  if (busca) {
    const like = `%${busca}%`;
    condicoes.push(
      or(
        ilike(obras.nome, like),
        ilike(contratante.name, like),
        ilike(empreiteiro.name, like),
      ),
    );
  }
  if (filtro.somenteNaoRespondidas) {
    // Há ao menos uma mensagem ainda não lida pela contraparte.
    condicoes.push(sql`EXISTS (
      SELECT 1 FROM ${chatMensagens} cm
      WHERE cm.thread_id = ${chatThreads.id} AND cm.lida_em IS NULL
    )`);
  }
  const where = condicoes.length ? and(...condicoes) : undefined;

  const baseFrom = db
    .select({
      threadId: chatThreads.id,
      obraId: chatThreads.obraId,
      obraNome: obras.nome,
      contratanteUserId: chatThreads.contratanteUserId,
      contratanteNome: contratante.name,
      empreiteiroUserId: chatThreads.empreiteiroUserId,
      empreiteiroNome: empreiteiro.name,
      ultimaMensagemEm: chatThreads.ultimaMensagemEm,
      criadaEm: chatThreads.criadaEm,
    })
    .from(chatThreads)
    .innerJoin(obras, eq(obras.id, chatThreads.obraId))
    .innerJoin(contratante, eq(contratante.id, chatThreads.contratanteUserId))
    .innerJoin(empreiteiro, eq(empreiteiro.id, chatThreads.empreiteiroUserId));

  const rows = await (where ? baseFrom.where(where) : baseFrom)
    .orderBy(desc(chatThreads.ultimaMensagemEm))
    .limit(pageSize)
    .offset(offset);

  const totalQuery = db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(chatThreads)
    .innerJoin(obras, eq(obras.id, chatThreads.obraId))
    .innerJoin(contratante, eq(contratante.id, chatThreads.contratanteUserId))
    .innerJoin(empreiteiro, eq(empreiteiro.id, chatThreads.empreiteiroUserId));
  const [{ count: total } = { count: 0 }] = await (where ? totalQuery.where(where) : totalQuery);

  // Enriquecer cada thread com agregados (total + última mensagem + não respondida).
  const threadIds = rows.map((r) => r.threadId);
  const agregados = await carregarAgregadosThreads(threadIds);

  const items: AdminChatThread[] = rows.map((r) => {
    const ag = agregados.get(r.threadId);
    return {
      threadId: r.threadId,
      obraId: r.obraId,
      obraNome: r.obraNome,
      contratanteUserId: r.contratanteUserId,
      contratanteNome: r.contratanteNome?.trim() || "Contratante",
      empreiteiroUserId: r.empreiteiroUserId,
      empreiteiroNome: r.empreiteiroNome?.trim() || "Empreiteiro",
      totalMensagens: ag?.total ?? 0,
      ultimaMensagemTexto: ag?.ultimaTexto ?? null,
      ultimaMensagemEm: iso(r.ultimaMensagemEm),
      ultimoAutorUserId: ag?.ultimoAutorUserId ?? null,
      temNaoRespondida: ag?.temNaoRespondida ?? false,
      criadaEm: iso(r.criadaEm) ?? "",
    };
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

interface AgregadoThread {
  total: number;
  ultimaTexto: string | null;
  ultimoAutorUserId: string | null;
  temNaoRespondida: boolean;
}

async function carregarAgregadosThreads(
  threadIds: string[],
): Promise<Map<string, AgregadoThread>> {
  const mapa = new Map<string, AgregadoThread>();
  if (threadIds.length === 0) return mapa;

  // Contagem total e de não-lidas por thread, numa varredura.
  const contagens = await db
    .select({
      threadId: chatMensagens.threadId,
      total: sql<number>`COUNT(*)::int`,
      naoLidas: sql<number>`COUNT(*) FILTER (WHERE ${chatMensagens.lidaEm} IS NULL)::int`,
    })
    .from(chatMensagens)
    .where(inArray(chatMensagens.threadId, threadIds))
    .groupBy(chatMensagens.threadId);

  // Última mensagem por thread — DISTINCT ON traz exatamente 1 linha por thread.
  const ultimas = await db
    .selectDistinctOn([chatMensagens.threadId], {
      threadId: chatMensagens.threadId,
      texto: chatMensagens.texto,
      autorUserId: chatMensagens.autorUserId,
    })
    .from(chatMensagens)
    .where(inArray(chatMensagens.threadId, threadIds))
    .orderBy(chatMensagens.threadId, desc(chatMensagens.criadaEm));

  const ultimaPorThread = new Map<string, { texto: string; autorUserId: string }>();
  for (const u of ultimas) {
    ultimaPorThread.set(u.threadId, { texto: u.texto, autorUserId: u.autorUserId });
  }

  for (const c of contagens) {
    const ultima = ultimaPorThread.get(c.threadId);
    mapa.set(c.threadId, {
      total: c.total,
      ultimaTexto: ultima?.texto ?? null,
      ultimoAutorUserId: ultima?.autorUserId ?? null,
      temNaoRespondida: c.naoLidas > 0,
    });
  }
  return mapa;
}

// ─── Histórico de uma thread (read-only) ─────────────────────────────────────
export async function obterThreadDetalheAdmin(
  threadId: string,
): Promise<AdminChatThreadDetalhe | null> {
  const contratante = alias(users, "contratante");
  const empreiteiro = alias(users, "empreiteiro");

  const [cabecalho] = await db
    .select({
      threadId: chatThreads.id,
      obraId: chatThreads.obraId,
      obraNome: obras.nome,
      contratanteUserId: chatThreads.contratanteUserId,
      contratanteNome: contratante.name,
      empreiteiroUserId: chatThreads.empreiteiroUserId,
      empreiteiroNome: empreiteiro.name,
      ultimaMensagemEm: chatThreads.ultimaMensagemEm,
      criadaEm: chatThreads.criadaEm,
    })
    .from(chatThreads)
    .innerJoin(obras, eq(obras.id, chatThreads.obraId))
    .innerJoin(contratante, eq(contratante.id, chatThreads.contratanteUserId))
    .innerJoin(empreiteiro, eq(empreiteiro.id, chatThreads.empreiteiroUserId))
    .where(eq(chatThreads.id, threadId))
    .limit(1);

  if (!cabecalho) return null;

  const autor = alias(users, "autor");
  const anexo = alias(obras, "anexo");
  const mensagensRows = await db
    .select({
      id: chatMensagens.id,
      autorUserId: chatMensagens.autorUserId,
      autorNome: autor.name,
      texto: chatMensagens.texto,
      anexoObraId: chatMensagens.anexoObraId,
      anexoObraNome: anexo.nome,
      lidaEm: chatMensagens.lidaEm,
      criadaEm: chatMensagens.criadaEm,
    })
    .from(chatMensagens)
    .innerJoin(autor, eq(autor.id, chatMensagens.autorUserId))
    .leftJoin(anexo, eq(anexo.id, chatMensagens.anexoObraId))
    .where(eq(chatMensagens.threadId, threadId))
    .orderBy(asc(chatMensagens.criadaEm));

  const mensagens: AdminChatMensagem[] = mensagensRows.map((m) => ({
    id: m.id,
    autorUserId: m.autorUserId,
    autorNome: m.autorNome?.trim() || "Participante",
    texto: m.texto,
    anexoObraId: m.anexoObraId,
    anexoObraNome: m.anexoObraNome,
    lidaEm: iso(m.lidaEm),
    criadaEm: iso(m.criadaEm) ?? "",
  }));

  const naoRespondida = mensagens.some((m) => m.lidaEm === null);

  const thread: AdminChatThread = {
    threadId: cabecalho.threadId,
    obraId: cabecalho.obraId,
    obraNome: cabecalho.obraNome,
    contratanteUserId: cabecalho.contratanteUserId,
    contratanteNome: cabecalho.contratanteNome?.trim() || "Contratante",
    empreiteiroUserId: cabecalho.empreiteiroUserId,
    empreiteiroNome: cabecalho.empreiteiroNome?.trim() || "Empreiteiro",
    totalMensagens: mensagens.length,
    ultimaMensagemTexto: mensagens.at(-1)?.texto ?? null,
    ultimaMensagemEm: iso(cabecalho.ultimaMensagemEm),
    ultimoAutorUserId: mensagens.at(-1)?.autorUserId ?? null,
    temNaoRespondida: naoRespondida,
    criadaEm: iso(cabecalho.criadaEm) ?? "",
  };

  return { thread, mensagens };
}

// ─── Notificações da plataforma (painel real, substitui o mock) ──────────────
export async function listarNotificacoesAdmin(
  filtro: AdminNotificacoesFiltro,
): Promise<Paginado<AdminNotificacaoItem>> {
  const page = clampPage(filtro.page);
  const pageSize = clampPageSize(filtro.pageSize);
  const offset = (page - 1) * pageSize;

  const condicoes = [];
  if (filtro.tipo) condicoes.push(eq(notificacoes.tipo, filtro.tipo));
  if (filtro.status === "lida") condicoes.push(eq(notificacoes.lida, true));
  if (filtro.status === "nao-lida") condicoes.push(eq(notificacoes.lida, false));
  const busca = filtro.busca?.trim();
  if (busca) {
    const like = `%${busca}%`;
    condicoes.push(
      or(
        ilike(notificacoes.titulo, like),
        ilike(notificacoes.descricao, like),
        ilike(users.name, like),
        ilike(users.email, like),
      ),
    );
  }
  const where = condicoes.length ? and(...condicoes) : undefined;

  const baseFrom = db
    .select({
      id: notificacoes.id,
      tipo: notificacoes.tipo,
      titulo: notificacoes.titulo,
      descricao: notificacoes.descricao,
      href: notificacoes.href,
      lida: notificacoes.lida,
      destinatarioUserId: notificacoes.userId,
      destinatarioNome: users.name,
      destinatarioEmail: users.email,
      criadoEm: notificacoes.createdAt,
    })
    .from(notificacoes)
    .innerJoin(users, eq(users.id, notificacoes.userId));

  const rows = await (where ? baseFrom.where(where) : baseFrom)
    .orderBy(desc(notificacoes.createdAt))
    .limit(pageSize)
    .offset(offset);

  const totalQuery = db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(notificacoes)
    .innerJoin(users, eq(users.id, notificacoes.userId));
  const [{ count: total } = { count: 0 }] = await (where ? totalQuery.where(where) : totalQuery);

  const items: AdminNotificacaoItem[] = rows.map((r) => ({
    id: r.id,
    tipo: r.tipo as NotificacaoTipo,
    titulo: r.titulo,
    descricao: r.descricao,
    href: r.href,
    canal: "in-app",
    lida: r.lida,
    destinatarioUserId: r.destinatarioUserId,
    destinatarioNome: r.destinatarioNome?.trim() || "Usuário",
    destinatarioEmail: r.destinatarioEmail,
    criadoEm: iso(r.criadoEm) ?? "",
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ─── Trilha de auditoria (leituras admin etc) ────────────────────────────────
export async function listarAuditoriaAdmin(
  filtro: AdminAuditoriaFiltro,
): Promise<Paginado<AdminAuditoriaItem>> {
  const page = clampPage(filtro.page);
  const pageSize = clampPageSize(filtro.pageSize);
  const offset = (page - 1) * pageSize;

  const where = filtro.action ? eq(auditLogs.action, filtro.action) : undefined;

  const baseFrom = db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorId: auditLogs.actorId,
      actorNome: users.name,
      targetUserId: auditLogs.targetUserId,
      payload: auditLogs.payload,
      ip: auditLogs.ip,
      criadoEm: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId));

  const rows = await (where ? baseFrom.where(where) : baseFrom)
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageSize)
    .offset(offset);

  const totalQuery = db.select({ count: sql<number>`COUNT(*)::int` }).from(auditLogs);
  const [{ count: total } = { count: 0 }] = await (where ? totalQuery.where(where) : totalQuery);

  const items: AdminAuditoriaItem[] = rows.map((r) => ({
    id: r.id,
    action: r.action,
    actorId: r.actorId,
    actorNome: r.actorNome?.trim() ?? null,
    targetUserId: r.targetUserId,
    payload: (r.payload ?? {}) as Record<string, unknown>,
    ip: r.ip,
    criadoEm: iso(r.criadoEm) ?? "",
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
