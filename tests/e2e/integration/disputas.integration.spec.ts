import { test, expect } from "@playwright/test";
import { eq, inArray } from "drizzle-orm";
import { db } from "@shared/db/db";
import { disputas, disputaMensagens } from "@shared/db/schema";
import {
  loginAs,
  logout,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  SEED_ADMIN_EMAIL,
} from "../helpers";
import {
  criarObraVinculadaE2E,
  criarLancamentoE2E,
  limparObraVinculadaE2E,
  type ObraVinculada,
} from "../helpers-marketplace";

/**
 * Integração (J36 / J10) — Disputas.
 *
 * Domínio antes 100% sem cobertura de integração. Cobre o fluxo ponta-a-ponta:
 * contratante abre disputa sobre um lançamento → admin lista/assume → mensagens
 * dos dois lados → admin resolve → estados refletem no banco. Mais os guards de
 * authz (401/403), validação (400) e idempotência (409).
 *
 * Endpoints:
 *   POST/GET /api/disputas
 *   GET      /api/disputas/[id]
 *   POST     /api/disputas/[id]/mensagens
 *   GET      /api/obras/[id]/disputas
 *   GET      /api/admin/disputas · /kpi · /[id]
 *   POST     /api/admin/disputas/[id]/{assumir,mensagens,resolver}
 *
 * Isolamento: obra + lançamento E2E criados por teste; disputas/mensagens
 * removidas no cleanup. Nunca toca dado de produção (guard anti-prod global).
 */

async function limparDisputasDaObra(obraId: string | null | undefined): Promise<void> {
  if (!obraId) return;
  const rows = await db.select({ id: disputas.id }).from(disputas).where(eq(disputas.obraId, obraId));
  const ids = rows.map((r) => r.id);
  if (ids.length > 0) {
    await db.delete(disputaMensagens).where(inArray(disputaMensagens.disputaId, ids)).catch(() => {});
    await db.delete(disputas).where(inArray(disputas.id, ids)).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Guards de autenticação
// ---------------------------------------------------------------------------

test.describe("J10 — disputas: guards de autenticação", () => {
  test("GET /api/disputas sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/disputas");
    expect(res.status()).toBe(401);
  });

  test("POST /api/disputas sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post("/api/disputas", { data: {} });
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/disputas como contratante → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.get("/api/admin/disputas");
    expect(res.status(), "não-admin não pode listar disputas do admin").toBe(403);
    await logout(request);
  });

  test("GET /api/admin/disputas/kpi como contratante → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.get("/api/admin/disputas/kpi");
    expect(res.status()).toBe(403);
    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

test.describe("J10 — POST /api/disputas: validação", () => {
  test("body inválido → 400", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    try {
      const res = await request.post("/api/disputas", { data: { titulo: "x" } });
      expect(res.status(), "payload incompleto deve retornar 400").toBe(400);
    } finally {
      await logout(request);
    }
  });

  test("obra em que não participa → 403", async ({ request }) => {
    // Cria obra E2E, mas tenta abrir disputa com um alvo forjado de outra obra.
    const obra = await criarObraVinculadaE2E("disputa-403");
    try {
      // Um empreiteiro aleatório (maria participa; usamos admin que NÃO é parte).
      await loginAs(request, SEED_ADMIN_EMAIL);
      const res = await request.post("/api/disputas", {
        data: {
          obraId: obra.obraId,
          alvoTipo: "pagamento",
          alvoId: "qualquer",
          titulo: "E2E disputa",
          descricao: "descrição suficientemente longa para passar no zod",
        },
      });
      // Admin não é parte da obra → 403.
      expect(res.status(), "quem não participa da obra não abre disputa").toBe(403);
      await logout(request);
    } finally {
      await limparObraVinculadaE2E(obra.obraId);
    }
  });
});

// ---------------------------------------------------------------------------
// Fluxo feliz completo
// ---------------------------------------------------------------------------

test.describe("J10 — disputa: fluxo ponta-a-ponta", () => {
  let obra: ObraVinculada;
  let lancamentoId: string;

  test.beforeEach(async () => {
    obra = await criarObraVinculadaE2E("disputa-fluxo");
    lancamentoId = await criarLancamentoE2E({
      obraId: obra.obraId,
      pagadorUserId: obra.contratanteUserId,
      recebedorUserId: obra.empreiteiroUserId,
      tag: "disputa-fluxo",
    });
  });

  test.afterEach(async () => {
    await limparDisputasDaObra(obra?.obraId);
    await limparObraVinculadaE2E(obra?.obraId);
  });

  test("contratante abre → admin assume → mensagens → admin resolve", async ({ request }) => {
    // 1. Contratante abre disputa sobre o lançamento.
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const abrir = await request.post("/api/disputas", {
      data: {
        obraId: obra.obraId,
        alvoTipo: "pagamento",
        alvoId: lancamentoId,
        categoria: "pagamento_atrasado",
        titulo: "E2E pagamento em disputa",
        descricao: "O pagamento não reflete a medição aprovada. Texto longo o bastante.",
      },
    });
    expect(abrir.status(), "abrir disputa deve retornar 201").toBe(201);
    const disputa = (await abrir.json()) as { id: string; status: string };
    expect(disputa.id, "disputa deve ter id").toBeTruthy();
    expect(disputa.status, "disputa nasce aberta").toBe("aberta");
    const disputaId = disputa.id;

    // Idempotência: segunda disputa sobre o MESMO alvo → 409.
    const dup = await request.post("/api/disputas", {
      data: {
        obraId: obra.obraId,
        alvoTipo: "pagamento",
        alvoId: lancamentoId,
        titulo: "E2E duplicada",
        descricao: "tentativa de abrir disputa duplicada sobre o mesmo alvo",
      },
    });
    expect(dup.status(), "disputa duplicada sobre o mesmo alvo deve retornar 409").toBe(409);

    // Aparece em GET /api/disputas (parte) e em GET /api/obras/[id]/disputas.
    const minhas = await request.get("/api/disputas");
    expect(minhas.status()).toBe(200);
    const listaMinhas = (await minhas.json()) as Array<{ id: string }>;
    expect(listaMinhas.some((d) => d.id === disputaId), "disputa deve aparecer para a parte").toBeTruthy();

    const daObra = await request.get(`/api/obras/${obra.obraId}/disputas`);
    expect(daObra.status()).toBe(200);

    // Detalhe acessível pela parte.
    const detParte = await request.get(`/api/disputas/${disputaId}`);
    expect(detParte.status(), "parte vê o detalhe da própria disputa").toBe(200);
    await logout(request);

    // 2. Empreiteiro (contraparte) também vê o detalhe e posta mensagem.
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const detContraparte = await request.get(`/api/disputas/${disputaId}`);
    expect(detContraparte.status(), "contraparte vê o detalhe").toBe(200);
    const msgEmp = await request.post(`/api/disputas/${disputaId}/mensagens`, {
      data: { texto: "E2E resposta do empreiteiro" },
    });
    expect(msgEmp.status(), "contraparte posta mensagem → 201").toBe(201);
    await logout(request);

    // 3. Admin lista, vê KPI, assume.
    await loginAs(request, SEED_ADMIN_EMAIL);
    const adminList = await request.get("/api/admin/disputas");
    expect(adminList.status()).toBe(200);
    const kpi = await request.get("/api/admin/disputas/kpi");
    expect(kpi.status()).toBe(200);
    const adminDet = await request.get(`/api/admin/disputas/${disputaId}`);
    expect(adminDet.status()).toBe(200);

    const assumir = await request.post(`/api/admin/disputas/${disputaId}/assumir`);
    expect(assumir.status(), "admin assume → 200").toBe(200);

    // Estado no banco: em_analise + responsável setado.
    const [apos] = await db
      .select({ status: disputas.status, responsavel: disputas.responsavelAdminId })
      .from(disputas)
      .where(eq(disputas.id, disputaId))
      .limit(1);
    expect(apos?.status, "disputa deve ir para em_analise").toBe("em_analise");
    expect(apos?.responsavel, "responsável admin deve ser setado").toBeTruthy();

    // Assumir de novo → 409 (já assumida).
    const assumir2 = await request.post(`/api/admin/disputas/${disputaId}/assumir`);
    expect(assumir2.status(), "assumir disputa já assumida → 409").toBe(409);

    // Admin posta mensagem.
    const msgAdmin = await request.post(`/api/admin/disputas/${disputaId}/mensagens`, {
      data: { texto: "E2E nota do mediador" },
    });
    expect(msgAdmin.status(), "admin posta mensagem → 201").toBe(201);

    // 4. Admin resolve.
    const resolver = await request.post(`/api/admin/disputas/${disputaId}/resolver`, {
      data: {
        resolucaoTipo: "meio_termo",
        resolucaoTexto: "Resolução E2E: ajuste parcial acordado entre as partes.",
      },
    });
    expect(resolver.status(), "admin resolve → 200").toBe(200);

    const [resolvida] = await db
      .select({ status: disputas.status, tipo: disputas.resolucaoTipo, resolvedAt: disputas.resolvedAt })
      .from(disputas)
      .where(eq(disputas.id, disputaId))
      .limit(1);
    expect(resolvida?.status, "disputa deve ficar resolvida").toBe("resolvida");
    expect(resolvida?.tipo, "tipo de resolução deve ser gravado").toBe("meio_termo");
    expect(resolvida?.resolvedAt, "resolvedAt deve ser setado").toBeTruthy();

    // 5. Disputa encerrada não aceita novas mensagens → 409.
    const msgAposResolver = await request.post(`/api/admin/disputas/${disputaId}/mensagens`, {
      data: { texto: "E2E tardia" },
    });
    // Admin ainda pode postar nota interna em disputa resolvida? O endpoint da
    // PARTE barra com 409; o admin pode ter regra própria. Validamos a da parte:
    await logout(request);
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const parteMsgTardia = await request.post(`/api/disputas/${disputaId}/mensagens`, {
      data: { texto: "E2E parte tardia" },
    });
    expect(
      parteMsgTardia.status(),
      "parte não posta em disputa encerrada → 409",
    ).toBe(409);
    // (não asseguramos o comportamento do admin sobre disputa resolvida — fora de escopo)
    void msgAposResolver;
    await logout(request);
  });
});
