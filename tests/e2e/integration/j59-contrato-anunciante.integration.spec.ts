import { test, expect, type APIRequestContext } from "@playwright/test";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users, userConsents, legalDocuments } from "@shared/db/schema";
import { uniqueEmail, uniqueUsername, loginAs, logout, SEED_ADMIN_EMAIL } from "../helpers";

/**
 * Integração (J59) — Termo do Anunciante (gate de entrada para anunciar).
 *
 * Fluxo coberto:
 *   1. Garante um termo vigente (seed do bootstrap OU publica via admin).
 *   2. Anunciante recém-registrado (sem aceite) → POST /api/anuncios/pedidos
 *      é bloqueado com 403 CONTRATO_ANUNCIANTE_NAO_ACEITO.
 *   3. GET /api/anunciante/contrato reflete { aceitou:false, documento }.
 *   4. POST /api/anunciante/contrato registra o aceite (user_consents com versão);
 *      depois o POST do pedido passa (201) e GET reflete { aceitou:true }.
 *   5. Bump de versão (admin publica v+1) → o aceite antigo deixa de bastar
 *      (gate volta a bloquear até aceitar a nova versão).
 *
 * Registro via /api/auth/register (acceptTerms = termos/privacidade do signup, NÃO
 * o termo do anunciante). Dados "E2E" no nome. Pré-req: E2E_TEST_AUTH=1; seed admin.
 */

const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };

/** Slot mínimo válido (payment off no E2E → período opcional). */
const SLOT_OK = {
  zona: "sidebar-sup-contratante",
  template: "imagem-card",
  titulo: "Anúncio E2E J59",
  conteudo: { imagemUrl: "https://example.com/c.png" },
};

/** Garante que existe um termo do anunciante vigente; devolve a versão vigente. */
async function garantirTermoVigente(request: APIRequestContext): Promise<number> {
  const [existente] = await db
    .select({ versao: legalDocuments.versao })
    .from(legalDocuments)
    .where(and(eq(legalDocuments.tipo, "termo_anunciante"), eq(legalDocuments.ativo, true)))
    .orderBy(desc(legalDocuments.versao))
    .limit(1);
  if (existente) return existente.versao;

  // Publica v1 via admin (idempotência do bootstrap pode não ter rodado neste boot).
  await loginAs(request, SEED_ADMIN_EMAIL);
  const res = await request.post("/api/admin/legal", {
    data: {
      tipo: "termo_anunciante",
      titulo: "Termo do Anunciante",
      conteudo: "# Termo do Anunciante E2E\n\nCompromisso de teste de integração J59.",
    },
  });
  expect(res.ok(), `publicar termo deve responder ok (status ${res.status()})`).toBeTruthy();
  await logout(request);
  return (await res.json()).documento.versao as number;
}

/**
 * Registra um anunciante E2E e devolve { userId, email }.
 * `/api/auth/register` limita 5 registros/hora/IP — quando a suíte inteira roda,
 * outros specs (anuncio-pagamento) consomem essa cota. Tratamos 429 como skip
 * defensivo (mesma disciplina do 402 em obras-candidatura), preservando a
 * repetibilidade sem mascarar falhas reais.
 */
async function registrarAnunciante(request: APIRequestContext, tag: string) {
  const email = uniqueEmail(`j59-${tag}`);
  const res = await request.post("/api/auth/register", {
    data: {
      name: `E2E Anunciante J59 ${tag}`,
      email,
      username: uniqueUsername(`j59${tag}`),
      password: "Xconstr@E2E2026!",
      role: "anunciante",
      phone: "11955550000",
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  test.skip(res.status() === 429, "Rate-limit de registro (5/h/IP) esgotado nesta execução — pular");
  expect([200, 201].includes(res.status()), `registro recebeu ${res.status()}`).toBeTruthy();
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  expect(row?.id, "anunciante deve existir no banco").toBeTruthy();
  // Verifica o email no banco: `login-as` autentica mas não verifica, e
  // `requireVerifiedUser` (403 EMAIL_NOT_VERIFIED) dispararia ANTES do gate J59.
  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, row.id));
  return { userId: row.id, email };
}

async function criarPedido(request: APIRequestContext) {
  return request.post("/api/anuncios/pedidos", { data: { slots: [SLOT_OK] } });
}

test.describe.serial("Integração — J59: Termo do Anunciante (gate)", () => {
  let vigente = 0;

  test.beforeAll(async ({ request }) => {
    vigente = await garantirTermoVigente(request);
    expect(vigente, "deve haver uma versão vigente do termo").toBeGreaterThanOrEqual(1);
  });

  // Bloqueio → aceite → liberação num só teste (1 registro, respeita o rate-limit
  // de 5 registros/hora/IP em /api/auth/register).
  test("bloqueia sem aceite, registra o consent e libera o pedido após aceitar", async ({ request }) => {
    const { userId, email } = await registrarAnunciante(request, "ciclo");
    await loginAs(request, email);

    // 1) Sem aceite → 403 com o code do gate.
    const bloqueado = await criarPedido(request);
    expect(bloqueado.status(), "pedido sem aceite deve dar 403").toBe(403);
    expect((await bloqueado.json()).code, "code do gate").toBe("CONTRATO_ANUNCIANTE_NAO_ACEITO");

    // 2) GET reflete não-aceito + documento vigente presente.
    const st1 = await request.get("/api/anunciante/contrato");
    expect(st1.ok()).toBeTruthy();
    const st1Body = await st1.json();
    expect(st1Body.aceitou, "aceitou deve ser false").toBe(false);
    expect(st1Body.documento?.versao, "documento vigente deve vir").toBe(vigente);

    // 3) Aceita → grava user_consents com a versão vigente (com ip).
    const aceite = await request.post("/api/anunciante/contrato", { data: {} });
    expect(aceite.ok(), `aceite deve responder ok (status ${aceite.status()})`).toBeTruthy();
    expect((await aceite.json()).versao).toBe(vigente);
    const consents = await db
      .select({ versao: userConsents.versao })
      .from(userConsents)
      .where(and(eq(userConsents.userId, userId), eq(userConsents.documento, "termo_anunciante")));
    expect(consents.some((c) => Math.floor(Number(c.versao)) >= vigente), "consent da versão vigente").toBeTruthy();

    // 4) GET reflete aceito e o pedido passa.
    expect((await (await request.get("/api/anunciante/contrato")).json()).aceitou, "aceitou vira true").toBe(true);
    const ped = await criarPedido(request);
    expect([200, 201].includes(ped.status()), `pedido após aceite deve criar (status ${ped.status()}): ${await ped.text()}`).toBeTruthy();
    await logout(request);
  });

  test("bump de versão → aceite antigo não basta (gate volta a bloquear)", async ({ request }) => {
    const { email } = await registrarAnunciante(request, "bump");
    await loginAs(request, email);
    // Aceita a versão atual.
    expect((await request.post("/api/anunciante/contrato", { data: {} })).ok()).toBeTruthy();
    expect((await criarPedido(request)).status() < 400, "passa com a versão aceita").toBeTruthy();
    await logout(request);

    // Admin publica uma nova versão.
    await loginAs(request, SEED_ADMIN_EMAIL);
    const pub = await request.post("/api/admin/legal", {
      data: {
        tipo: "termo_anunciante",
        titulo: "Termo do Anunciante",
        conteudo: `# Termo do Anunciante E2E v-nova ${Date.now()}\n\nNova versão para forçar re-aceite.`,
      },
    });
    expect(pub.ok(), `publicar nova versão (status ${pub.status()})`).toBeTruthy();
    const novaVersao = (await pub.json()).documento.versao as number;
    expect(novaVersao, "nova versão deve ser maior").toBeGreaterThan(vigente);
    await logout(request);

    // O mesmo anunciante (aceitou só a antiga) volta a ser bloqueado.
    await loginAs(request, email);
    const res = await criarPedido(request);
    expect(res.status(), "gate deve bloquear até aceitar a nova versão").toBe(403);
    expect((await res.json()).code).toBe("CONTRATO_ANUNCIANTE_NAO_ACEITO");
    await logout(request);

    vigente = novaVersao; // demais asserts (se houver) usam a nova vigente
  });
});
