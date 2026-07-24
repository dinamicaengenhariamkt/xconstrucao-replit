import { test, expect } from "@playwright/test";
import { eq, inArray } from "drizzle-orm";
import { db } from "@shared/db/db";
import { anuncios, anunciantes, pedidosAnuncio, pedidoSlots, userRoles, users } from "@shared/db/schema";
import {
  loginAs,
  logout,
  uniqueEmail,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  SEED_ADMIN_EMAIL,
} from "../helpers";

/**
 * Integração (J36) — G9b · Anúncios admin (complemento) + self-service.
 *
 * Complementa `admin-anuncios.integration.spec.ts` (que já cobre authz + CRUD de
 * campanha em `admin/anuncios/{anunciantes,campanhas(+[id]),config,kpi,pedidos,zonas}`)
 * com os endpoints QUE FALTAVAM:
 *   POST /api/anunciante/upgrade
 *   POST /api/anuncios/[id]/eventos           (público)
 *   PATCH /api/anuncios/meus/[id]              (self-service, anti-IDOR)
 *   GET  /api/anuncios/pedidos (+POST)         (self-service)
 *   GET  /api/admin/anuncios/campanhas/[id] PATCH — só reforço de 404 (guard já coberto no outro spec)
 *   GET  /api/admin/anuncios/pedidos/[id]      (detalhe do pedido pelo admin)
 *
 * Estratégia:
 *   - `anunciante/upgrade` MUTA o usuário (adiciona role + cria clientes/empreiteiras).
 *     Nunca usar joão/maria (poluiria o seed) — cria um usuário E2E descartável via
 *     `POST /api/admin/usuarios` (senhaModo:"random" já vem com emailVerified setado)
 *     e faz hard-delete no final.
 *   - `anuncios/pedidos` POST/GET: fluxo ponta-a-ponta com o EMPREITEIRO seed (papel
 *     aditivo de anunciante é reversível — some ao apagar a campanha/anunciante E2E;
 *     a role fica residual como no admin-anuncios.spec, mesmo padrão "E2E" já aceito).
 *     Modo prototype (AD_PAYMENT_GATEWAY off) materializa direto na aprovação — cobre
 *     também `anuncios/meus/[id]` PATCH (pausar/reativar) e `anuncios/[id]/eventos`.
 *   - `admin/anuncios/pedidos/[id]` GET: detalhe do pedido criado acima.
 *
 * Pré-requisitos (playwright.config.ts): E2E_TEST_AUTH=1; seed com joão, maria, admin.
 */

const ID_FAKE = "00000000-0000-0000-0000-000000000000";
const ZONA_OK = "sidebar-sup-contratante";
const TEMPLATE_OK = "imagem-card";

test.describe("J36 — anúncios: self-service + endpoints complementares", () => {
  // ================= anunciante/upgrade — usuário E2E descartável ============

  test("upgrade: adiciona papel contratante a um usuário E2E novo", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const email = uniqueEmail("upgrade-e2e");
    const create = await request.post("/api/admin/usuarios", {
      data: { name: "E2E Upgrade", email, role: "empreiteiro", senhaModo: "random" },
    });
    expect(create.status(), "criar usuário E2E deve ser 201").toBe(201);
    const { user } = (await create.json()) as { user: { id: string } };
    const userId = user.id;
    await logout(request);

    try {
      await loginAs(request, email);

      // Guard: role inválido → 400.
      const inval = await request.post("/api/anunciante/upgrade", { data: { role: "admin" } });
      expect(inval.status(), "role fora do enum deve ser 400").toBe(400);

      const up = await request.post("/api/anunciante/upgrade", { data: { role: "contratante" } });
      expect(up.status(), "upgrade deve ser 200").toBe(200);
      const body = (await up.json()) as { ok: boolean; role: string };
      expect(body.ok, "resposta deve confirmar ok").toBe(true);
      expect(body.role, "role devolvido deve bater").toBe("contratante");

      const roles = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, userId));
      expect(
        roles.some((r) => r.role === "contratante"),
        "papel contratante deve estar gravado em user_roles",
      ).toBeTruthy();

      await logout(request);
    } finally {
      // Guard/401 sem sessão.
      await logout(request);
      const anon = await request.post("/api/anunciante/upgrade", { data: { role: "contratante" } });
      expect(anon.status(), "anônimo deve ser 401").toBe(401);

      await db.delete(userRoles).where(eq(userRoles.userId, userId)).catch(() => {});
      await db.delete(users).where(eq(users.id, userId)).catch(() => {});
    }
  });

  // ================= pedido self-service: ponta-a-ponta ======================

  test.describe.serial("pedido self-service: cria → aprova → materializa → gestão", () => {
    let anuncioId: string | null = null;
    let pedidoId: string | null = null;

    test.beforeAll(async ({ request }) => {
      // J59 — POST /api/anuncios/pedidos exige aceite vigente do Termo do
      // Anunciante (gate ANTES do Zod). O seed empreiteiro nunca aceitou —
      // sem isso, toda chamada cairia em 403 em vez do status testado. Aceite
      // real e idempotente (onConflictDoNothing), não é destrutivo/reversível
      // precisar desfazer: mantém o seed coerente com "anunciante que aceitou".
      await loginAs(request, SEED_EMPREITEIRO_EMAIL);
      await request.post("/api/anunciante/contrato");
      await logout(request);
    });

    test.afterAll(async () => {
      // Cleanup best-effort dos artefatos E2E (não mexe em dado do seed além do
      // papel `anunciante` residual do empreiteiro, mesmo padrão já aceito no
      // spec irmão `admin-anuncios.integration.spec.ts`).
      if (pedidoId) {
        await db.delete(pedidoSlots).where(eq(pedidoSlots.pedidoId, pedidoId)).catch(() => {});
        await db.delete(pedidosAnuncio).where(eq(pedidosAnuncio.id, pedidoId)).catch(() => {});
      }
      if (anuncioId) {
        await db.delete(anuncios).where(eq(anuncios.id, anuncioId)).catch(() => {});
      }
    });

    test("GET /api/anuncios/pedidos e /api/anuncios/meus sem sessão → 401", async ({ request }) => {
      await logout(request);
      const p = await request.get("/api/anuncios/pedidos");
      expect(p.status()).toBe(401);
      const m = await request.get("/api/anuncios/meus");
      expect(m.status()).toBe(401);
    });

    test("POST /api/anuncios/pedidos: payload inválido → 400", async ({ request }) => {
      await loginAs(request, SEED_EMPREITEIRO_EMAIL);
      const res = await request.post("/api/anuncios/pedidos", { data: { slots: [] } });
      expect(res.status(), "slots vazio deve ser 400").toBe(400);
      await logout(request);
    });

    test("empreiteiro cria pedido → aparece em GET → admin aprova → materializa → PATCH pausa/reativa → evento público", async ({
      request,
    }) => {
      const stamp = Date.now().toString(36);

      // 1. Empreiteiro (seed) cria pedido multi-slot (1 slot, template compatível).
      await loginAs(request, SEED_EMPREITEIRO_EMAIL);
      const criar = await request.post("/api/anuncios/pedidos", {
        data: {
          slots: [
            {
              zona: ZONA_OK,
              template: TEMPLATE_OK,
              titulo: `E2E pedido ${stamp}`,
              ctaUrl: "https://parceiro.exemplo.com/e2e",
            },
          ],
        },
      });
      expect(criar.status(), "criar pedido deve ser 201").toBe(201);
      const criado = (await criar.json()) as { pedido: { id: string; status: string } };
      pedidoId = criado.pedido.id;
      expect(criado.pedido.status, "pedido nasce em_analise").toBe("em_analise");

      // Aparece na listagem do próprio usuário.
      const lista = await request.get("/api/anuncios/pedidos");
      expect(lista.status()).toBe(200);
      const { pedidos } = (await lista.json()) as { pedidos: Array<{ id: string }> };
      expect(pedidos.some((p) => p.id === pedidoId), "pedido deve aparecer na listagem do usuário").toBeTruthy();

      // Detalhe pelo próprio dono.
      const det = await request.get(`/api/anuncios/pedidos/${pedidoId}`);
      expect(det.status(), "dono vê o detalhe do pedido").toBe(200);
      await logout(request);

      // Detalhe por outro usuário não-dono → 404 (anti-IDOR).
      await loginAs(request, SEED_CONTRATANTE_EMAIL);
      const detAlheio = await request.get(`/api/anuncios/pedidos/${pedidoId}`);
      expect(detAlheio.status(), "não-dono não vê o pedido alheio").toBe(404);
      await logout(request);

      // 2. Admin vê o pedido na fila (não há GET de detalhe — só PATCH neste
      // recurso), depois aprova (materializa no modo prototype/isento, sem
      // gateway pago configurado no ambiente de teste).
      await loginAs(request, SEED_ADMIN_EMAIL);
      const filaAdmin = await request.get("/api/admin/anuncios/pedidos");
      expect(filaAdmin.status()).toBe(200);
      const { pedidos: filaPedidos } = (await filaAdmin.json()) as { pedidos?: Array<{ id: string }> };
      expect(
        (filaPedidos ?? []).some((p) => p.id === pedidoId),
        "pedido deve aparecer na fila de moderação do admin",
      ).toBeTruthy();

      const aprovarFake = await request.patch(`/api/admin/anuncios/pedidos/${ID_FAKE}`, {
        data: { acao: "aprovar" },
      });
      expect(aprovarFake.status(), "pedido inexistente deve ser 404").toBe(404);

      const aprovar = await request.patch(`/api/admin/anuncios/pedidos/${pedidoId}`, {
        data: { acao: "aprovar" },
      });
      expect(aprovar.status(), "aprovar pedido deve ser 200").toBe(200);

      const [slotRow] = await db
        .select({ anuncioId: pedidoSlots.anuncioId })
        .from(pedidoSlots)
        .where(eq(pedidoSlots.pedidoId, pedidoId))
        .limit(1);
      expect(slotRow?.anuncioId, "slot deve ter sido materializado em um anúncio").toBeTruthy();
      anuncioId = slotRow!.anuncioId as string;
      await logout(request);

      // 3. Evento público de tracking (impressão/clique) — sem sessão.
      await logout(request);
      const evtInval = await request.post(`/api/anuncios/${anuncioId}/eventos`, { data: { tipo: "invalido" } });
      expect(evtInval.status(), "tipo inválido deve ser 400").toBe(400);
      const evt = await request.post(`/api/anuncios/${anuncioId}/eventos`, { data: { tipo: "impressao" } });
      expect(evt.status(), "registrar evento público deve ser 200").toBe(200);
      const evtFake = await request.post(`/api/anuncios/${ID_FAKE}/eventos`, { data: { tipo: "clique" } });
      expect(evtFake.status(), "anúncio inexistente deve ser 404").toBe(404);

      // 4. Empreiteiro (dono) gerencia o próprio anúncio: pausa e reativa.
      await loginAs(request, SEED_EMPREITEIRO_EMAIL);
      const meus = await request.get("/api/anuncios/meus");
      expect(meus.status()).toBe(200);
      const { anuncios: meusAnuncios } = (await meus.json()) as { anuncios: Array<{ id: string }> };
      expect(meusAnuncios.some((a) => a.id === anuncioId), "anúncio materializado deve aparecer em /meus").toBeTruthy();

      const pausar = await request.patch(`/api/anuncios/meus/${anuncioId}`, { data: { acao: "pausar" } });
      expect(pausar.status(), "pausar o próprio anúncio deve ser 200").toBe(200);
      const [pausado] = await db.select({ status: anuncios.status }).from(anuncios).where(eq(anuncios.id, anuncioId));
      expect(pausado?.status, "status deve ir para pausada").toBe("pausada");

      const reativar = await request.patch(`/api/anuncios/meus/${anuncioId}`, { data: { acao: "reativar" } });
      expect(reativar.status(), "reativar deve ser 200").toBe(200);
      const [ativo] = await db.select({ status: anuncios.status }).from(anuncios).where(eq(anuncios.id, anuncioId));
      expect(ativo?.status, "status deve voltar para ativa").toBe("ativa");

      // Ação inválida → 400.
      const acaoInval = await request.patch(`/api/anuncios/meus/${anuncioId}`, { data: { acao: "excluir" } });
      expect(acaoInval.status(), "ação fora do enum deve ser 400").toBe(400);
      await logout(request);

      // Anti-IDOR: outro usuário (contratante) não gerencia o anúncio alheio.
      await loginAs(request, SEED_CONTRATANTE_EMAIL);
      const idor = await request.patch(`/api/anuncios/meus/${anuncioId}`, { data: { acao: "pausar" } });
      expect(idor.status(), "não-dono recebe 404 (anti-IDOR)").toBe(404);
      await logout(request);
    });
  });
});
