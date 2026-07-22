import { eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { pedidosAnuncio, pedidoPagamentoEventos } from "@shared/db/schema";
import { criarNotificacao } from "@features/notificacoes/service";
import { getPedido, materializarSlotsDoPedido } from "./pedido-service";

/**
 * J31 — Aplica o evento de pagamento de ANÚNCIO vindo do webhook Asaas.
 * Roteado pelo prefixo `xconstrucao-anuncio|pedidoId` no webhook único.
 *
 * Na CONFIRMAÇÃO (moderar-antes-de-pagar): marca `cobranca_status='paga'`,
 * MATERIALIZA os slots em `anuncios` (entram no ar conforme inicio/fim) e move o
 * pedido para `publicado`. Em FALHA: mantém `aprovado/pendente` (link reemitível).
 *
 * Idempotência dupla: `pedido_pagamento_eventos.gateway_event_id` (único) registra
 * o evento; a materialização é idempotente por slot (`anuncioId` já preenchido).
 */
export async function aplicarEventoAnuncioPago(evt: {
  eventId: string;
  type: "payment_succeeded" | "payment_failed";
  pedidoId: string;
}): Promise<{ processed: boolean }> {
  // Registra o evento (auditoria + dedupe do MESMO eventId). NÃO é a trava
  // principal contra concorrência: o Asaas envia PAYMENT_RECEIVED e
  // PAYMENT_CONFIRMED com eventIds distintos que ambos mapeiam para
  // payment_succeeded — a trava real é o claim atômico abaixo.
  const jaVisto = await registrarEvento(evt.eventId, evt.pedidoId, evt.type);
  if (!jaVisto.novo) return { processed: false };

  // ── Falha de pagamento ──────────────────────────────────────────────────
  if (evt.type === "payment_failed") {
    // Não derruba o pedido: continua `aprovado/pendente`, link reemitível.
    console.info(`[anuncio-webhook] pagamento falhou (pedido=${evt.pedidoId})`);
    return { processed: true };
  }

  // ── Confirmação: CLAIM ATÔMICO ──────────────────────────────────────────
  // Trava a linha do pedido (FOR UPDATE) e só o PRIMEIRO evento que a encontrar
  // `pendente` a marca `paga`. Eventos concorrentes (PAYMENT_RECEIVED +
  // PAYMENT_CONFIRMED) bloqueiam no lock e depois leem `paga` → saem. Espelha o
  // guard transacional de aplicar-evento-split.ts.
  const claim = await db.transaction(async (tx) => {
    const locked = await tx.execute(
      sql`SELECT cobranca_status FROM pedidos_anuncio WHERE id = ${evt.pedidoId} FOR UPDATE`,
    );
    const rows =
      (locked as unknown as { rows?: Array<{ cobranca_status: string }> }).rows ??
      (locked as unknown as Array<{ cobranca_status: string }>);
    const cobranca = rows?.[0]?.cobranca_status;
    if (cobranca === undefined) return { claimed: false as const, notFound: true };
    if (cobranca !== "pendente") return { claimed: false as const, notFound: false };
    // Claim: marca paga já dentro do lock (materialização vem depois, idempotente).
    await tx.update(pedidosAnuncio).set({ cobrancaStatus: "paga" }).where(eq(pedidosAnuncio.id, evt.pedidoId));
    return { claimed: true as const, notFound: false };
  });

  if (claim.notFound) {
    console.warn(`[anuncio-webhook] pedido não encontrado (${evt.pedidoId})`);
    return { processed: false };
  }
  if (!claim.claimed) return { processed: false }; // outro evento já processou

  // Materializa fora do lock (idempotente por slot). Recarrega o pedido já `paga`.
  const pedido = await getPedido(evt.pedidoId);
  if (!pedido) return { processed: false };

  const { slotsPublicados } = await materializarSlotsDoPedido({
    pedido,
    // Valor real cobrado por slot → lança receita (J09) na materialização.
    orcamentoPorSlot: (slot) => Number(slot.valorSlot),
  });

  const statusFinal = slotsPublicados > 0 ? "publicado" : "aprovado";
  await db
    .update(pedidosAnuncio)
    .set({ status: statusFinal })
    .where(eq(pedidosAnuncio.id, evt.pedidoId));

  await notificarAnunciante(pedido.solicitanteUserId, slotsPublicados).catch(() => {});

  console.info(`[anuncio-webhook] pedido ${evt.pedidoId} pago → ${statusFinal} (${slotsPublicados} no ar)`);
  return { processed: true };
}

/** Registra o evento; retorna { novo: false } se o gatewayEventId já existia. */
async function registrarEvento(
  eventId: string,
  pedidoId: string,
  tipo: string,
): Promise<{ novo: boolean }> {
  try {
    const inserted = await db
      .insert(pedidoPagamentoEventos)
      .values({ pedidoId, tipo: tipo === "payment_succeeded" ? "paga" : "falhou", gatewayEventId: eventId })
      .onConflictDoNothing({ target: pedidoPagamentoEventos.gatewayEventId })
      .returning({ id: pedidoPagamentoEventos.id });
    return { novo: inserted.length > 0 };
  } catch (err) {
    console.error(`[anuncio-webhook] falha ao registrar evento ${eventId}:`, err);
    // Em erro de registro, deixa reprocessar (fail-open p/ o gateway reenviar).
    return { novo: true };
  }
}

async function notificarAnunciante(userId: string, slotsPublicados: number): Promise<void> {
  await criarNotificacao({
    userId,
    tipo: "sucesso",
    titulo: "Pagamento confirmado",
    descricao:
      slotsPublicados > 0
        ? `Seu anúncio está no ar (${slotsPublicados} local(is)).`
        : "Pagamento confirmado. Seu anúncio entrará no ar na data de início.",
    href: "/anunciante/meus-anuncios",
  });
}
