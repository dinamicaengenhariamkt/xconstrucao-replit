import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  chatMensagens,
  chatThreads,
  clientes,
  empreiteiras,
  obras,
  type ChatMensagem,
  type ChatThread,
} from "@shared/db/schema";
import type { ChatCursor } from "./cursor";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ResolverParticipantesErro =
  | "NOT_FOUND"
  | "SEM_EMPREITEIRA"
  | "EMPREITEIRO_SEM_USER";

export interface ParticipantesDaObra {
  obraId: string;
  clienteId: string | null;
  empreiteiraId: string;
  contratanteUserId: string | null;
  empreiteiroUserId: string;
}

export type ResolverParticipantesResult =
  | { ok: true; participantes: ParticipantesDaObra }
  | { ok: false; erro: ResolverParticipantesErro };

/**
 * Resolve os participantes (userIds de contratante e empreiteiro) de uma obra
 * a partir do seu `obraId`, num único JOIN. Fonte de verdade compartilhada
 * pelas rotas `garantir-thread` de ambas as personas (J41 Item 2) — evita
 * duplicar a resolução de `clientes.userId` / `empreiteiras.userId`.
 *
 * O `contratanteUserId` pode vir `null` se o cliente não tiver `userId`
 * vinculado (caso raro/legado); a rota decide como tratar. O empreiteiro é
 * obrigatório: sem `empreiteiraId` retorna `SEM_EMPREITEIRA`; com empreiteira
 * mas sem `userId`, `EMPREITEIRO_SEM_USER`.
 */
export async function resolverParticipantesDaObra(
  obraId: string,
): Promise<ResolverParticipantesResult> {
  const [row] = await db
    .select({
      obraId: obras.id,
      clienteId: obras.clienteId,
      empreiteiraId: obras.empreiteiraId,
      contratanteUserId: clientes.userId,
      empreiteiroUserId: empreiteiras.userId,
    })
    .from(obras)
    .leftJoin(clientes, eq(clientes.id, obras.clienteId))
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(eq(obras.id, obraId))
    .limit(1);

  if (!row) {
    return { ok: false, erro: "NOT_FOUND" };
  }

  if (!row.empreiteiraId) {
    return { ok: false, erro: "SEM_EMPREITEIRA" };
  }

  if (!row.empreiteiroUserId) {
    return { ok: false, erro: "EMPREITEIRO_SEM_USER" };
  }

  return {
    ok: true,
    participantes: {
      obraId: row.obraId,
      clienteId: row.clienteId,
      empreiteiraId: row.empreiteiraId,
      contratanteUserId: row.contratanteUserId,
      empreiteiroUserId: row.empreiteiroUserId,
    },
  };
}

export interface GarantirChatThreadArgs {
  obraId: string;
  contratanteUserId: string;
  empreiteiroUserId: string;
}

export interface GarantirChatThreadResult {
  threadId: string;
  criada: boolean;
}

export async function garantirChatThread(
  args: GarantirChatThreadArgs,
  tx?: DbOrTx,
): Promise<GarantirChatThreadResult> {
  const client = tx ?? db;
  const inserted = await client
    .insert(chatThreads)
    .values({
      obraId: args.obraId,
      contratanteUserId: args.contratanteUserId,
      empreiteiroUserId: args.empreiteiroUserId,
    })
    .onConflictDoNothing({ target: chatThreads.obraId })
    .returning({ id: chatThreads.id });

  if (inserted.length > 0 && inserted[0]) {
    return { threadId: inserted[0].id, criada: true };
  }

  const [existing] = await client
    .select({ id: chatThreads.id })
    .from(chatThreads)
    .where(eq(chatThreads.obraId, args.obraId))
    .limit(1);

  if (!existing) {
    throw new Error(`[chat] thread inesperadamente ausente para obra ${args.obraId}`);
  }

  return { threadId: existing.id, criada: false };
}

export interface ConversaRow {
  threadId: string;
  obraId: string;
  obraNome: string;
  obraStatus: string;
  contratanteUserId: string;
  empreiteiroUserId: string;
  counterpartUserId: string;
  counterpartName: string | null;
  counterpartAvatarUrl: string | null;
  ultimaMensagemEm: Date;
  ultimaMensagemTexto: string | null;
  ultimaMensagemCriadaEm: Date | null;
  naoLidas: number;
}

export async function listarConversasPorUsuario(userId: string): Promise<ConversaRow[]> {
  const result = await db.execute<{
    thread_id: string;
    obra_id: string;
    obra_nome: string;
    obra_status: string;
    contratante_user_id: string;
    empreiteiro_user_id: string;
    counterpart_user_id: string;
    counterpart_name: string | null;
    counterpart_avatar_url: string | null;
    ultima_mensagem_em: Date;
    ultima_mensagem_texto: string | null;
    ultima_mensagem_criada_em: Date | null;
    nao_lidas: number;
  }>(sql`
    SELECT
      t.id AS thread_id,
      t.obra_id,
      o.nome AS obra_nome,
      o.status::text AS obra_status,
      t.contratante_user_id,
      t.empreiteiro_user_id,
      CASE WHEN t.contratante_user_id = ${userId} THEN t.empreiteiro_user_id ELSE t.contratante_user_id END AS counterpart_user_id,
      cu.name AS counterpart_name,
      -- Avatar do counterpart com fallback: image do user → avatar do perfil de
      -- domínio (cliente/empreiteira) → avatar_url do user → arquivo público. (J41)
      COALESCE(cu.image, cli.avatar_url, emp.avatar_url, cu.avatar_url, uf.public_url) AS counterpart_avatar_url,
      t.ultima_mensagem_em,
      lm.texto AS ultima_mensagem_texto,
      lm.criada_em AS ultima_mensagem_criada_em,
      COALESCE(nl.qtd, 0)::int AS nao_lidas
    FROM chat_threads t
    INNER JOIN obras o ON o.id = t.obra_id
    LEFT JOIN users cu ON cu.id = CASE WHEN t.contratante_user_id = ${userId} THEN t.empreiteiro_user_id ELSE t.contratante_user_id END
    LEFT JOIN clientes cli ON cli.user_id = cu.id
    LEFT JOIN empreiteiras emp ON emp.user_id = cu.id
    LEFT JOIN user_files uf ON uf.id = cu.avatar_file_id
    LEFT JOIN LATERAL (
      SELECT m.texto, m.criada_em
      FROM chat_mensagens m
      WHERE m.thread_id = t.id
      ORDER BY m.criada_em DESC
      LIMIT 1
    ) lm ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS qtd
      FROM chat_mensagens m
      WHERE m.thread_id = t.id
        AND m.autor_user_id <> ${userId}
        AND m.lida_em IS NULL
    ) nl ON TRUE
    WHERE t.contratante_user_id = ${userId} OR t.empreiteiro_user_id = ${userId}
    ORDER BY t.ultima_mensagem_em DESC
  `);

  return result.rows.map((row) => ({
    threadId: row.thread_id,
    obraId: row.obra_id,
    obraNome: row.obra_nome,
    obraStatus: row.obra_status,
    contratanteUserId: row.contratante_user_id,
    empreiteiroUserId: row.empreiteiro_user_id,
    counterpartUserId: row.counterpart_user_id,
    counterpartName: row.counterpart_name,
    counterpartAvatarUrl: row.counterpart_avatar_url,
    ultimaMensagemEm: row.ultima_mensagem_em,
    ultimaMensagemTexto: row.ultima_mensagem_texto,
    ultimaMensagemCriadaEm: row.ultima_mensagem_criada_em,
    naoLidas: row.nao_lidas,
  }));
}

export interface MensagemRow {
  id: string;
  threadId: string;
  autorUserId: string;
  autorName: string | null;
  autorAvatarUrl: string | null;
  texto: string;
  anexoObraId: string | null;
  anexoObraNome: string | null;
  anexoObraStatus: string | null;
  anexoObraProgresso: number | null;
  anexoObraEndereco: string | null;
  lidaEm: Date | null;
  criadaEm: Date;
  arquivoUrl: string | null;
  arquivoNome: string | null;
  arquivoMime: string | null;
  /** Sequência monotônica de chegada — fonte de verdade da ordem (J41 #149). */
  seq: number;
}

export interface ListarMensagensOpts {
  /** Tamanho da página (default 50). */
  limit?: number;
  /** Cursor keyset: traz mensagens ANTERIORES a este cursor (por `seq`). */
  before?: ChatCursor | null;
}

export interface ListarMensagensResult {
  /** Sempre em ordem cronológica ASC (a UI renderiza de cima pra baixo). */
  messages: MensagemRow[];
  /** Cursor para carregar mensagens mais antigas; `null` quando não há mais. */
  nextCursor: ChatCursor | null;
}

/**
 * Lista mensagens de uma thread com paginação keyset (J13 — Camada A).
 *
 * Por padrão retorna as N mensagens MAIS RECENTES (em ordem cronológica ASC),
 * corrigindo o antigo `LIMIT 100` que truncava as recentes silenciosamente.
 * Para carregar mais antigas, passar `before` com o cursor da mensagem mais
 * antiga já carregada.
 *
 * Internamente busca DESC com `LIMIT limit + 1` (a linha extra detecta se há
 * página anterior) e inverte o resultado para devolver ASC.
 */
export async function listarMensagensDaThread(
  threadId: string,
  opts: ListarMensagensOpts = {},
): Promise<ListarMensagensResult> {
  const limit = opts.limit ?? 50;
  const before = opts.before ?? null;
  const beforeFilter = before ? sql`AND m.seq < ${before.seq}` : sql``;

  const result = await db.execute<{
    id: string;
    thread_id: string;
    autor_user_id: string;
    autor_name: string | null;
    autor_avatar_url: string | null;
    texto: string;
    anexo_obra_id: string | null;
    anexo_obra_nome: string | null;
    anexo_obra_status: string | null;
    anexo_obra_progresso: number | null;
    anexo_obra_endereco: string | null;
    lida_em: Date | null;
    criada_em: Date;
    arquivo_url: string | null;
    arquivo_nome: string | null;
    arquivo_mime: string | null;
    seq: number;
  }>(sql`
    SELECT
      m.id,
      m.seq,
      m.thread_id,
      m.autor_user_id,
      u.name AS autor_name,
      -- Avatar do autor com o mesmo fallback das conversas. (J41)
      COALESCE(u.image, cli.avatar_url, emp.avatar_url, u.avatar_url, uf.public_url) AS autor_avatar_url,
      m.texto,
      m.anexo_obra_id,
      ao.nome AS anexo_obra_nome,
      ao.status::text AS anexo_obra_status,
      ao.progresso AS anexo_obra_progresso,
      ao.endereco AS anexo_obra_endereco,
      m.lida_em,
      m.criada_em,
      m.arquivo_url,
      m.arquivo_nome,
      m.arquivo_mime
    FROM chat_mensagens m
    LEFT JOIN users u ON u.id = m.autor_user_id
    LEFT JOIN clientes cli ON cli.user_id = u.id
    LEFT JOIN empreiteiras emp ON emp.user_id = u.id
    LEFT JOIN user_files uf ON uf.id = u.avatar_file_id
    LEFT JOIN obras ao ON ao.id = m.anexo_obra_id
    WHERE m.thread_id = ${threadId}
    ${beforeFilter}
    ORDER BY m.seq DESC
    LIMIT ${limit + 1}
  `);

  // Linha extra além de `limit` indica que há mensagens mais antigas.
  const temMaisAntigas = result.rows.length > limit;
  const pageDesc = temMaisAntigas ? result.rows.slice(0, limit) : result.rows;

  // pageDesc está em DESC (mais recente → mais antiga). O cursor para "mais
  // antigas" é a última linha desta página (a mais antiga retornada), por `seq`.
  const maisAntiga = pageDesc[pageDesc.length - 1];
  const nextCursor =
    temMaisAntigas && maisAntiga ? { seq: Number(maisAntiga.seq) } : null;

  // Inverte para ASC (ordem cronológica esperada pela UI).
  const messages = pageDesc
    .slice()
    .reverse()
    .map((row) => ({
      id: row.id,
      seq: Number(row.seq),
      threadId: row.thread_id,
      autorUserId: row.autor_user_id,
      autorName: row.autor_name,
      autorAvatarUrl: row.autor_avatar_url,
      texto: row.texto,
      anexoObraId: row.anexo_obra_id,
      anexoObraNome: row.anexo_obra_nome,
      anexoObraStatus: row.anexo_obra_status,
      anexoObraProgresso: row.anexo_obra_progresso,
      anexoObraEndereco: row.anexo_obra_endereco,
      lidaEm: row.lida_em,
      criadaEm: row.criada_em,
      arquivoUrl: row.arquivo_url ?? null,
      arquivoNome: row.arquivo_nome ?? null,
      arquivoMime: row.arquivo_mime ?? null,
    }));

  return { messages, nextCursor };
}

export async function podeAcessarThread(userId: string, threadId: string): Promise<ChatThread | null> {
  const [thread] = await db
    .select()
    .from(chatThreads)
    .where(
      and(
        eq(chatThreads.id, threadId),
        or(eq(chatThreads.contratanteUserId, userId), eq(chatThreads.empreiteiroUserId, userId)),
      ),
    )
    .limit(1);
  return thread ?? null;
}

export interface CriarMensagemArgs {
  threadId: string;
  autorUserId: string;
  texto: string;
  anexoObraId?: string | null;
  arquivoUrl?: string | null;
  arquivoNome?: string | null;
  arquivoMime?: string | null;
}

export interface CriarMensagemResult {
  mensagem: ChatMensagem;
  destinatarioUserId: string;
  obraId: string;
}

export async function criarMensagem(args: CriarMensagemArgs): Promise<CriarMensagemResult> {
  return db.transaction(async (tx) => {
    const [thread] = await tx
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.id, args.threadId))
      .limit(1);

    if (!thread) {
      throw new Error(`[chat] thread ${args.threadId} não encontrada`);
    }

    if (thread.contratanteUserId !== args.autorUserId && thread.empreiteiroUserId !== args.autorUserId) {
      throw new Error(`[chat] autor ${args.autorUserId} não participa da thread ${args.threadId}`);
    }

    // Anexo restrito à própria obra da thread no MVP. Evita IDOR de empreiteiro/contratante
    // anexar (e vazar) obras alheias.
    if (args.anexoObraId && args.anexoObraId !== thread.obraId) {
      throw new Error(`[chat] anexo só permite a obra da própria thread`);
    }

    const [mensagem] = await tx
      .insert(chatMensagens)
      .values({
        threadId: args.threadId,
        autorUserId: args.autorUserId,
        texto: args.texto,
        anexoObraId: args.anexoObraId ?? null,
        arquivoUrl: args.arquivoUrl ?? null,
        arquivoNome: args.arquivoNome ?? null,
        arquivoMime: args.arquivoMime ?? null,
      })
      .returning();

    if (!mensagem) {
      throw new Error("[chat] falha ao inserir mensagem");
    }

    await tx
      .update(chatThreads)
      .set({ ultimaMensagemEm: mensagem.criadaEm })
      .where(eq(chatThreads.id, args.threadId));

    const destinatarioUserId =
      thread.contratanteUserId === args.autorUserId
        ? thread.empreiteiroUserId
        : thread.contratanteUserId;

    return { mensagem, destinatarioUserId, obraId: thread.obraId };
  });
}

export async function marcarThreadComoLida(userId: string, threadId: string): Promise<number> {
  const result = await db
    .update(chatMensagens)
    .set({ lidaEm: sql`NOW()` })
    .where(
      and(
        eq(chatMensagens.threadId, threadId),
        ne(chatMensagens.autorUserId, userId),
        isNull(chatMensagens.lidaEm),
      ),
    )
    .returning({ id: chatMensagens.id });
  return result.length;
}

/**
 * Conta o total de mensagens não-lidas do usuário agregando todas as suas
 * threads (mensagens do outro autor com `lida_em IS NULL`). Fonte de verdade
 * do badge global na sidebar (J41 Item 8). Query barata: um JOIN + COUNT,
 * coberta pelo índice `(thread_id, lida_em, autor_user_id)`.
 */
export async function contarNaoLidasTotais(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`COUNT(*)::int` })
    .from(chatMensagens)
    .innerJoin(chatThreads, eq(chatThreads.id, chatMensagens.threadId))
    .where(
      and(
        or(
          eq(chatThreads.contratanteUserId, userId),
          eq(chatThreads.empreiteiroUserId, userId),
        ),
        ne(chatMensagens.autorUserId, userId),
        isNull(chatMensagens.lidaEm),
      ),
    );
  return row?.total ?? 0;
}
