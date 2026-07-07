import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  anuncios,
  anunciantes,
  pedidosAnuncio,
  pedidoSlots,
  userRoles,
  users,
  type PedidoAnuncio,
  type PedidoSlot,
} from "@shared/db/schema";
import { criarCampanha, isZonaMultipla } from "@features/anuncios/anuncios-service";
import { getBillingPort } from "./billing-port";
import { precoSlot } from "./precificacao";
import type { SlotInput } from "./schemas";

/**
 * J23 — Serviço do self-service de anúncios. Orquestra o ciclo de vida do PEDIDO:
 * criação (com preço + porta de billing), consulta pelo dono, moderação pelo admin
 * e MATERIALIZAÇÃO dos slots em `anuncios` (reusa criarCampanha/pipeline J16) na
 * aprovação. Cobrança é protótipo (D5); J31 liga a real.
 */

export interface SlotView extends PedidoSlot {}
export interface PedidoView extends PedidoAnuncio {
  slots: SlotView[];
}

/** Garante que o usuário tenha uma identidade de anunciante (linha em `anunciantes`
 * com userId). Cria sob demanda — cobre o cliente (contratante/empreiteiro) que
 * anuncia pela primeira vez sem ter passado pelo cadastro de anunciante. */
async function ensureAnuncianteDoUsuario(
  userId: string,
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
): Promise<string> {
  const [existing] = await tx
    .select({ id: anunciantes.id })
    .from(anunciantes)
    .where(eq(anunciantes.userId, userId))
    .limit(1);
  if (existing) return existing.id;

  const [u] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
  const [created] = await tx
    .insert(anunciantes)
    .values({
      userId,
      nome: u?.name ?? "Anunciante",
      email: u?.email ?? null,
      telefone: u?.phone ?? null,
      status: "ativo",
    })
    .returning({ id: anunciantes.id });

  // D6 — concede o papel `anunciante` (aditivo) no primeiro pedido de um cliente,
  // para que o item "Meus Anúncios" passe a aparecer na visão dele. Idempotente.
  await tx
    .insert(userRoles)
    .values({ userId, role: "anunciante", origem: "signup" })
    .onConflictDoNothing();

  return created.id;
}

/**
 * Cria um pedido multi-slot. Calcula o preço de cada slot, soma o total, passa pela
 * porta de billing (protótipo: não cobra) e persiste o pedido + slots como
 * `em_analise`. Retorna o pedido com slots e o resultado da cobrança.
 */
export async function criarPedido(args: {
  solicitanteUserId: string;
  slots: SlotInput[];
}): Promise<{ pedido: PedidoView; cobranca: Awaited<ReturnType<ReturnType<typeof getBillingPort>["cobrar"]>> }> {
  const slotsComPreco = args.slots.map((s) => ({
    ...s,
    valorSlot: precoSlot(s.zona, s.periodoInicio, s.periodoFim),
  }));
  const valorTotal = slotsComPreco.reduce((acc, s) => acc + s.valorSlot, 0);

  const pedido = await db.transaction(async (tx) => {
    // Garante identidade de anunciante já no pedido (idempotente).
    await ensureAnuncianteDoUsuario(args.solicitanteUserId, tx);

    const [ped] = await tx
      .insert(pedidosAnuncio)
      .values({
        solicitanteUserId: args.solicitanteUserId,
        status: "em_analise",
        valorTotal: String(valorTotal),
        cobrancaStatus: "prototipo",
      })
      .returning();

    const slotRows = await tx
      .insert(pedidoSlots)
      .values(
        slotsComPreco.map((s) => ({
          pedidoId: ped.id,
          zona: s.zona,
          template: s.template,
          titulo: s.titulo,
          subtitulo: s.subtitulo ?? null,
          criativoUrl: s.criativoUrl ?? null,
          ctaUrl: s.ctaUrl ?? null,
          ctaTexto: s.ctaTexto ?? null,
          conteudo: s.conteudo ?? null,
          periodoInicio: s.periodoInicio ?? null,
          periodoFim: s.periodoFim ?? null,
          valorSlot: String(s.valorSlot),
        })),
      )
      .returning();

    return { ...ped, slots: slotRows } as PedidoView;
  });

  // Porta de billing (protótipo não cobra). Mantém o estado já gravado.
  const cobranca = await getBillingPort().cobrar({
    pedidoId: pedido.id,
    solicitanteUserId: args.solicitanteUserId,
    valorTotal,
    descricao: `Pedido de anúncio (${pedido.slots.length} slot(s))`,
  });

  return { pedido, cobranca };
}

/** Lista os pedidos do usuário logado (mais recentes primeiro), com slots. */
export async function listarPedidosDoUsuario(userId: string): Promise<PedidoView[]> {
  const peds = await db
    .select()
    .from(pedidosAnuncio)
    .where(eq(pedidosAnuncio.solicitanteUserId, userId))
    .orderBy(desc(pedidosAnuncio.criadoEm));
  if (peds.length === 0) return [];
  const slots = await db
    .select()
    .from(pedidoSlots)
    .where(inArray(pedidoSlots.pedidoId, peds.map((p) => p.id)));
  return peds.map((p) => ({ ...p, slots: slots.filter((s) => s.pedidoId === p.id) }));
}

/** Detalhe de um pedido. Se `ownerUserId` vier, valida posse (retorna null se não for dono). */
export async function getPedido(id: string, ownerUserId?: string): Promise<PedidoView | null> {
  const [ped] = await db.select().from(pedidosAnuncio).where(eq(pedidosAnuncio.id, id)).limit(1);
  if (!ped) return null;
  if (ownerUserId && ped.solicitanteUserId !== ownerUserId) return null;
  const slots = await db.select().from(pedidoSlots).where(eq(pedidoSlots.pedidoId, id));
  return { ...ped, slots };
}

/** Fila de moderação para o admin (filtra por status; default = em_analise). */
export async function listarFilaModeracao(status?: string): Promise<PedidoView[]> {
  const where = status ? eq(pedidosAnuncio.status, status as PedidoAnuncio["status"]) : undefined;
  const peds = await db
    .select()
    .from(pedidosAnuncio)
    .where(where)
    .orderBy(desc(pedidosAnuncio.criadoEm));
  if (peds.length === 0) return [];
  const slots = await db
    .select()
    .from(pedidoSlots)
    .where(inArray(pedidoSlots.pedidoId, peds.map((p) => p.id)));
  return peds.map((p) => ({ ...p, slots: slots.filter((s) => s.pedidoId === p.id) }));
}

/**
 * Modera um pedido. Recusar grava motivo. Aprovar MATERIALIZA cada slot em
 * `anuncios` (status 'ativa', via criarCampanha → pipeline J16/receita J09) e liga
 * o slot ao anúncio criado, movendo o pedido para `publicado`.
 *
 * Conflito de zona não-múltipla: default = primeira aprovada leva. Slots cuja zona
 * já tem anúncio ativo são pulados na materialização e reportados (§13).
 */
export async function moderarPedido(args: {
  pedidoId: string;
  acao: "aprovar" | "recusar";
  moderadorId: string;
  motivoRecusa?: string | null;
  valorTotal?: number;
}): Promise<{ pedido: PedidoView; slotsPublicados: number; slotsPulados: number } | null> {
  const pedido = await getPedido(args.pedidoId);
  if (!pedido) return null;
  if (pedido.status !== "em_analise") return null; // só modera o que está na fila

  if (args.acao === "recusar") {
    const [upd] = await db
      .update(pedidosAnuncio)
      .set({
        status: "recusado",
        motivoRecusa: args.motivoRecusa ?? "Sem motivo informado",
        moderadoEm: new Date(),
        moderadoPor: args.moderadorId,
      })
      .where(eq(pedidosAnuncio.id, args.pedidoId))
      .returning();
    return { pedido: { ...upd, slots: pedido.slots }, slotsPublicados: 0, slotsPulados: 0 };
  }

  // Aprovar → materializar.
  const anuncianteId = await db.transaction(async (tx) =>
    ensureAnuncianteDoUsuario(pedido.solicitanteUserId, tx),
  );

  let slotsPublicados = 0;
  let slotsPulados = 0;
  const cobrancaIsenta = pedido.cobrancaStatus === "prototipo";

  for (const slot of pedido.slots) {
    // Conflito de zona não-múltipla: primeira aprovada leva (default §13).
    const livre = await zonaDisponivel(slot.zona, slot.periodoInicio, slot.periodoFim);
    if (!livre) {
      slotsPulados++;
      continue;
    }
    const anuncio = await criarCampanha({
      anuncianteId,
      titulo: slot.titulo,
      subtitulo: slot.subtitulo ?? undefined,
      criativoUrl: slot.criativoUrl ?? undefined,
      ctaUrl: slot.ctaUrl ?? undefined,
      ctaTexto: slot.ctaTexto ?? undefined,
      zona: slot.zona,
      template: slot.template,
      conteudo: slot.conteudo ?? undefined,
      inicio: slot.periodoInicio ?? undefined,
      fim: slot.periodoFim ?? undefined,
      // Protótipo não lança receita (default §13): orçamento 0 → maybeLancarReceita
      // não dispara. A J31 passa o valor real cobrado.
      orcamento: cobrancaIsenta ? 0 : Number(slot.valorSlot),
      status: "ativa",
    });
    await db.update(pedidoSlots).set({ anuncioId: anuncio.id }).where(eq(pedidoSlots.id, slot.id));
    slotsPublicados++;
  }

  // Se NENHUM slot foi publicado (todas as zonas em conflito), o pedido não vai ao
  // ar: marca como `aprovado` (revisado, mas sem veiculação) em vez de `publicado`,
  // para não enganar o anunciante. Pelo menos um publicado → `publicado`.
  const statusFinal = slotsPublicados > 0 ? "publicado" : "aprovado";

  const [upd] = await db
    .update(pedidosAnuncio)
    .set({
      status: statusFinal,
      cobrancaStatus: cobrancaIsenta ? "isenta" : pedido.cobrancaStatus,
      valorTotal: args.valorTotal !== undefined ? String(args.valorTotal) : pedido.valorTotal,
      moderadoEm: new Date(),
      moderadoPor: args.moderadorId,
    })
    .where(eq(pedidosAnuncio.id, args.pedidoId))
    .returning();

  const slots = await db.select().from(pedidoSlots).where(eq(pedidoSlots.pedidoId, args.pedidoId));
  return { pedido: { ...upd, slots }, slotsPublicados, slotsPulados };
}

/** Zona livre? Múltiplas sempre aceitam. Não-múltiplas: livre se não há anúncio ativo. */
async function zonaDisponivel(
  zona: string,
  _inicio?: string | null,
  _fim?: string | null,
): Promise<boolean> {
  if (isZonaMultipla(zona)) return true;
  const [ativo] = await db
    .select({ id: anuncios.id })
    .from(anuncios)
    .where(and(eq(anuncios.zona, zona), eq(anuncios.status, "ativa")))
    .limit(1);
  return !ativo;
}

// ─── Gestão do próprio anúncio (anunciante) ─────────────────────────────────

/** Anúncios materializados que pertencem ao usuário (via anunciantes.userId). */
export async function listarAnunciosDoUsuario(userId: string) {
  return db
    .select({
      id: anuncios.id,
      titulo: anuncios.titulo,
      zona: anuncios.zona,
      template: anuncios.template,
      status: anuncios.status,
      criativoUrl: anuncios.criativoUrl,
      inicio: anuncios.inicio,
      fim: anuncios.fim,
      createdAt: anuncios.createdAt,
    })
    .from(anuncios)
    .innerJoin(anunciantes, eq(anuncios.anuncianteId, anunciantes.id))
    .where(eq(anunciantes.userId, userId))
    .orderBy(desc(anuncios.createdAt));
}

/** O anúncio pertence ao usuário? (posse via anunciantes.userId) — anti-IDOR. */
export async function anuncioPertenceAoUsuario(anuncioId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: anuncios.id })
    .from(anuncios)
    .innerJoin(anunciantes, eq(anuncios.anuncianteId, anunciantes.id))
    .where(and(eq(anuncios.id, anuncioId), eq(anunciantes.userId, userId)))
    .limit(1);
  return !!row;
}

/** Pausa/reativa o próprio anúncio. Valida posse antes (404/403 fica no route). */
export async function gerirMeuAnuncio(
  anuncioId: string,
  userId: string,
  acao: "pausar" | "reativar",
): Promise<boolean> {
  const dono = await anuncioPertenceAoUsuario(anuncioId, userId);
  if (!dono) return false;
  const novoStatus = acao === "pausar" ? "pausada" : "ativa";
  await db.update(anuncios).set({ status: novoStatus }).where(eq(anuncios.id, anuncioId));
  return true;
}
