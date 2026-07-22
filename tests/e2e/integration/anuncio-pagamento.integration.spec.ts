import { test, expect, type APIRequestContext } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users, anuncios, pedidosAnuncio, pedidoSlots } from "@shared/db/schema";
import { uniqueEmail, uniqueUsername } from "../helpers";

/**
 * Integração (J31) — Pagamento real de anúncio (webhook + expiração).
 *
 * O caminho de emissão do link (`POST /pagar`) chama o Asaas real, então NÃO é
 * exercido aqui (a suíte roda com PAYMENT_GATEWAY=manual). Testamos o que é
 * determinístico sem Asaas:
 *   1. Webhook payment_succeeded (externalReference `xconstrucao-anuncio|pedidoId`)
 *      → materializa o slot em `anuncios` (status=ativa), pedido → publicado/paga.
 *   2. Idempotência: reenviar o mesmo eventId não materializa de novo.
 *   3. Job de expiração: anúncio com fim no passado → expirada.
 *
 * Seeds direto no banco (espelha split-confirmacao.integration.spec.ts).
 * Pré-requisitos: E2E_TEST_AUTH=1.
 */

const ENDPOINT = "/api/test/webhooks/asaas";
const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };

function uniqueEventId(tag: string): string {
  return `E2E-anuncio-${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function post(request: APIRequestContext, body: unknown) {
  return request.post(ENDPOINT, { headers: { "content-type": "application/json" }, data: body });
}

/** Registra um anunciante E2E e retorna o userId. */
async function registrarAnunciante(request: APIRequestContext, tag: string): Promise<string> {
  const email = uniqueEmail(`anuncio-pg-${tag}`);
  const res = await request.post("/api/auth/register", {
    data: {
      name: `E2E Anunciante Pagamento ${tag}`,
      email,
      username: uniqueUsername(`anpg${tag}`),
      password: "Xconstr@E2E2026!",
      role: "anunciante",
      phone: "11955550000",
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect([200, 201].includes(res.status()), `registro anunciante recebeu ${res.status()}`).toBeTruthy();
  const row = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  expect(row[0]?.id, "anunciante deve existir no banco").toBeTruthy();
  return row[0].id;
}

/**
 * Seeda um pedido `aprovado`/`pendente` com 1 slot numa zona não colidente.
 * Usa a zona 'home-mercado' (múltipla) para não colidir com anúncios existentes.
 */
async function seedPedidoAprovado(userId: string, tag: string): Promise<{ pedidoId: string; slotId: string }> {
  const hoje = new Date().toISOString().slice(0, 10);
  const fim = new Date(Date.now() + 10 * 86400_000).toISOString().slice(0, 10);
  const [ped] = await db
    .insert(pedidosAnuncio)
    .values({
      solicitanteUserId: userId,
      status: "aprovado",
      cobrancaStatus: "pendente",
      valorTotal: "240.00",
    })
    .returning({ id: pedidosAnuncio.id });
  const [slot] = await db
    .insert(pedidoSlots)
    .values({
      pedidoId: ped.id,
      zona: "home-mercado",
      template: "imagem-card",
      titulo: `E2E Anúncio ${tag}`,
      criativoUrl: "https://example.com/c.png",
      periodoInicio: hoje,
      periodoFim: fim,
      valorSlot: "240.00",
    })
    .returning({ id: pedidoSlots.id });
  return { pedidoId: ped.id, slotId: slot.id };
}

async function cleanupPedido(pedidoId: string): Promise<void> {
  const slots = await db.select({ anuncioId: pedidoSlots.anuncioId }).from(pedidoSlots).where(eq(pedidoSlots.pedidoId, pedidoId));
  await db.delete(pedidoSlots).where(eq(pedidoSlots.pedidoId, pedidoId));
  await db.delete(pedidosAnuncio).where(eq(pedidosAnuncio.id, pedidoId));
  for (const s of slots) {
    if (s.anuncioId) await db.delete(anuncios).where(eq(anuncios.id, s.anuncioId));
  }
}

test.describe("J31 — Pagamento de anúncio (webhook + expiração)", () => {
  test("webhook payment_succeeded materializa o anúncio e publica o pedido", async ({ request }) => {
    const userId = await registrarAnunciante(request, "ok");
    const { pedidoId, slotId } = await seedPedidoAprovado(userId, "ok");

    try {
      const ref = `xconstrucao-anuncio|${pedidoId}`;
      const res = await post(request, { type: "payment_succeeded", eventId: uniqueEventId("ok"), externalReference: ref });
      expect(res.ok()).toBeTruthy();
      expect((await res.json()).processed).toBe(true);

      // Pedido → publicado + paga.
      const [ped] = await db.select().from(pedidosAnuncio).where(eq(pedidosAnuncio.id, pedidoId)).limit(1);
      expect(ped.status).toBe("publicado");
      expect(ped.cobrancaStatus).toBe("paga");

      // Slot ligado a um anúncio ativa.
      const [slot] = await db.select().from(pedidoSlots).where(eq(pedidoSlots.id, slotId)).limit(1);
      expect(slot.anuncioId, "slot deve estar materializado").toBeTruthy();
      const [anuncio] = await db.select().from(anuncios).where(eq(anuncios.id, slot.anuncioId!)).limit(1);
      expect(anuncio.status).toBe("ativa");
    } finally {
      await cleanupPedido(pedidoId);
    }
  });

  test("reenvio do mesmo eventId é idempotente (não materializa de novo)", async ({ request }) => {
    const userId = await registrarAnunciante(request, "idem");
    const { pedidoId } = await seedPedidoAprovado(userId, "idem");

    try {
      const ref = `xconstrucao-anuncio|${pedidoId}`;
      const eventId = uniqueEventId("idem");
      const first = await post(request, { type: "payment_succeeded", eventId, externalReference: ref });
      expect((await first.json()).processed).toBe(true);

      const second = await post(request, { type: "payment_succeeded", eventId, externalReference: ref });
      // Mesmo eventId → não reprocessa.
      expect((await second.json()).processed).toBe(false);

      // Exatamente 1 anúncio materializado para este pedido.
      const slots = await db.select().from(pedidoSlots).where(eq(pedidoSlots.pedidoId, pedidoId));
      const materializados = slots.filter((s) => s.anuncioId).length;
      expect(materializados).toBe(1);
    } finally {
      await cleanupPedido(pedidoId);
    }
  });

  test("dois eventIds distintos (RECEIVED + CONFIRMED) do mesmo pedido → materializa 1x", async ({ request }) => {
    const userId = await registrarAnunciante(request, "dois");
    const { pedidoId } = await seedPedidoAprovado(userId, "dois");

    try {
      const ref = `xconstrucao-anuncio|${pedidoId}`;
      // O Asaas envia PAYMENT_RECEIVED e PAYMENT_CONFIRMED com eventIds diferentes,
      // ambos mapeados para payment_succeeded. Só o primeiro pode materializar.
      const first = await post(request, {
        type: "payment_succeeded",
        eventId: `PAYMENT_RECEIVED:${pedidoId}`,
        externalReference: ref,
      });
      expect((await first.json()).processed).toBe(true);

      const second = await post(request, {
        type: "payment_succeeded",
        eventId: `PAYMENT_CONFIRMED:${pedidoId}`,
        externalReference: ref,
      });
      // Segundo evento (id distinto) NÃO deve materializar de novo — pedido já `paga`.
      expect((await second.json()).processed).toBe(false);

      const slots = await db.select().from(pedidoSlots).where(eq(pedidoSlots.pedidoId, pedidoId));
      expect(slots.filter((s) => s.anuncioId).length).toBe(1);
    } finally {
      await cleanupPedido(pedidoId);
    }
  });

  test("job de expiração marca anúncio com fim no passado como expirada", async ({ request }) => {
    const userId = await registrarAnunciante(request, "exp");
    // Cria um anúncio ativa com fim ontem, ligado a um anunciante do usuário.
    const { pedidoId } = await seedPedidoAprovado(userId, "exp");
    const ontem = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);

    // Materializa via webhook e depois força fim no passado (simula período vencido).
    const ref = `xconstrucao-anuncio|${pedidoId}`;
    await post(request, { type: "payment_succeeded", eventId: uniqueEventId("exp"), externalReference: ref });
    const [slot] = await db.select().from(pedidoSlots).where(eq(pedidoSlots.pedidoId, pedidoId)).limit(1);
    const anuncioId = slot.anuncioId!;
    await db.update(anuncios).set({ fim: ontem, status: "ativa" }).where(eq(anuncios.id, anuncioId));

    try {
      const { expirarAnuncios } = await import("@features/anuncios/expirar-anuncios-job");
      const result = await expirarAnuncios();
      expect(result.ok).toBe(true);

      const [anuncio] = await db.select().from(anuncios).where(eq(anuncios.id, anuncioId)).limit(1);
      expect(anuncio.status).toBe("expirada");
    } finally {
      await cleanupPedido(pedidoId);
    }
  });
});
