import { test, expect, type APIRequestContext } from "@playwright/test";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obras, contratoAssinaturas, candidaturas } from "@shared/db/schema";
import {
  loginAs,
  logout,
  liberarCotaObras as liberarCotaObrasBase,
  limparObrasE2E,
  concluirObra as concluirObraBase,
  uniqueEmail,
  uniqueUsername,
  waitForVerificationEmail,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  SEED_ADMIN_EMAIL,
} from "../helpers";

/**
 * Integração (J58) — Contrato entre contratante e empreiteiro.
 *
 * Fluxo: aceite NÃO coloca a obra em `em_andamento` (entra em contrato pendente).
 * Contratante assina 1º; empreiteiro só depois; ambos → obra efetiva em_andamento.
 * Cada assinatura grava contrato_assinaturas com ip. Admin observa. Cancelar reabre.
 *
 * Sem mock — endpoints reais + estado no banco. Pré-req: E2E_TEST_AUTH=1; seed
 * joão/maria/admin; template `contrato_obra` seedado no bootstrap.
 */

const CONTRATANTE = SEED_CONTRATANTE_EMAIL;
const EMPREITEIRO = SEED_EMPREITEIRO_EMAIL;
const ADMIN = SEED_ADMIN_EMAIL;

async function liberarCota(request: APIRequestContext) {
  await liberarCotaObrasBase(request, { contratanteEmail: CONTRATANTE, adminEmail: ADMIN });
}
async function concluir(request: APIRequestContext, obraId: string) {
  await concluirObraBase(request, obraId, { adminEmail: ADMIN });
}

const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };
const CPF_VALIDO = "52998224725";
// Empreiteiro se cadastra como pessoa jurídica (registerSchema exige CNPJ).
const CNPJ_VALIDO = "11222333000181";

/** Registra um empreiteiro E2E novo e confirma o email (requireVerifiedUser). */
async function criarEmpreiteiroVerificado(
  request: APIRequestContext,
  tag: string,
): Promise<{ email: string; password: string }> {
  const email = uniqueEmail(`j58-emp-${tag}`);
  const password = "Xconstr@E2E2026!";
  const res = await request.post("/api/auth/register", {
    data: {
      name: `E2E Empreiteiro J58 ${tag}`,
      email,
      username: uniqueUsername(`j58emp${tag}`),
      password,
      role: "empreiteiro",
      phone: "11988880000",
      cpfCnpj: CNPJ_VALIDO,
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect([200, 201].includes(res.status()), `registro E2E empreiteiro: ${res.status()}`).toBeTruthy();

  const captured = await waitForVerificationEmail(request, email);
  const token = new URL(captured.meta?.verificationUrl as string).searchParams.get("token");
  expect(token, `token de verificação para ${email}`).toBeTruthy();
  const ver = await request.get(`/api/auth/verify-email?token=${encodeURIComponent(token!)}`, { maxRedirects: 0 });
  expect(ver.headers()["location"] ?? "", `verify-email de ${email}`).toContain("success=");
  return { email, password };
}

/**
 * Lê as notificações do usuário logado com poll — os dispatchers do contrato são
 * fire-and-forget, então a gravação pode chegar depois da resposta HTTP.
 * (Mesmo padrão do spec da J57.)
 */
async function esperarNotificacaoContrato(
  request: APIRequestContext,
  predicate: (n: Record<string, any>) => boolean,
  tentativas = 8,
): Promise<Record<string, any> | undefined> {
  for (let i = 0; i < tentativas; i++) {
    const res = await request.get("/api/notificacoes?limit=100");
    if (res.ok()) {
      const items = (await res.json()).items as Array<Record<string, any>>;
      const hit = items.find(predicate);
      if (hit) return hit;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return undefined;
}

function payloadPublicar(nome: string) {
  return {
    nome,
    endereco: "Rua E2E J58, 123",
    numero: "123",
    visibilidade: "publicada",
    tipo: "Reforma",
    descricao: "Obra E2E de integração J58 para validar o contrato entre as partes.",
    cep: "01310-100",
    cidade: "São Paulo",
    uf: "SP",
    modalidade: "empreitada_global",
    materiaisPor: "contratante",
  };
}

/** Cria obra publicada+aprovada, candidata (maria) e aceita (joão). Retorna {obraId, candidaturaId} ou null se cota 402. */
async function prepararAceite(request: APIRequestContext, nome: string): Promise<{ obraId: string; candidaturaId: string } | null> {
  await liberarCota(request);
  await loginAs(request, CONTRATANTE);
  const createRes = await request.post("/api/obras", {
    data: { nome, endereco: "Rua E2E J58, 123", visibilidade: "rascunho" },
  });
  expect(createRes.ok()).toBeTruthy();
  const obraId = (await createRes.json()).id as string;
  const pub = await request.patch(`/api/obras/${obraId}`, { data: payloadPublicar(nome) });
  expect(pub.ok(), `publicar: ${await pub.text()}`).toBeTruthy();
  await logout(request);

  await loginAs(request, ADMIN);
  const apr = await request.post(`/api/admin/obras/${obraId}/aprovar`);
  expect(apr.status(), `aprovar: ${await apr.text()}`).toBe(200);
  await logout(request);

  await loginAs(request, EMPREITEIRO);
  const cand = await request.post("/api/empreiteiro/candidaturas", {
    data: { obraId, valorProposta: 50000, prazoEstimado: 4, descricao: "Proposta E2E J58.", atividades: "Fundação; Alvenaria; Acabamento." },
  });
  if (cand.status() === 402) {
    await logout(request);
    return null; // cota mensal esgotada — caller trata como skip
  }
  expect(cand.ok(), `candidatura: ${cand.status()}`).toBeTruthy();
  const candidaturaId = (await cand.json()).id as string;
  await logout(request);

  await loginAs(request, CONTRATANTE);
  const aceitar = await request.post(`/api/contratante/candidaturas/${candidaturaId}/aceitar`, { data: {} });
  expect(aceitar.ok(), `aceite: ${await aceitar.text()}`).toBeTruthy();
  await logout(request);

  return { obraId, candidaturaId };
}

test.describe.serial("Integração — J58: contrato entre as partes", () => {
  const stamp = Date.now().toString(36);

  // Apaga as obras E2E E as candidaturas delas. Concluir a obra libera a cota de
  // OBRAS do contratante, mas não a de PROPOSTAS/mês do empreiteiro — essa conta
  // candidaturas criadas no mês, independente do estado da obra. Sem apagar, a
  // cota free (5/mês) da maria se esgota em ~2 execuções e todo run seguinte
  // skipa em silêncio (falso verde). Roda antes e depois pela mesma razão.
  test.beforeAll(async ({ request }) => {
    await limparObrasE2E(request, { contratanteEmail: CONTRATANTE });
  });

  test.afterAll(async ({ request }) => {
    await limparObrasE2E(request, { contratanteEmail: CONTRATANTE });
    await liberarCota(request);
  });

  test("aceite entra em contrato pendente (não em_andamento); assinatura em ordem efetiva a obra", async ({ request }) => {
    const prep = await prepararAceite(request, `Obra E2E-j58-fluxo ${stamp}`);
    test.skip(!prep, "Cota mensal de propostas (plano free) esgotada — pular");
    const { obraId } = prep!;

    try {
      // 1) Após o aceite: obra NÃO está em_andamento; contratoStatus = pendente_contratante.
      const [o1] = await db.select({ status: obras.status, contratoStatus: obras.contratoStatus }).from(obras).where(eq(obras.id, obraId));
      expect(o1.status, "obra não deve ir a em_andamento no aceite").not.toBe("em_andamento");
      expect(o1.contratoStatus, "deve entrar em contrato pendente_contratante").toBe("pendente_contratante");

      // 2) Empreiteiro tenta assinar antes → 409 (não é a vez).
      await loginAs(request, EMPREITEIRO);
      const cedo = await request.post(`/api/obras/${obraId}/contrato/assinar`, { data: {} });
      expect(cedo.status(), "empreiteiro não pode assinar antes do contratante").toBe(409);
      await logout(request);

      // 3) Contratante assina → pendente_empreiteiro.
      await loginAs(request, CONTRATANTE);
      const a1 = await request.post(`/api/obras/${obraId}/contrato/assinar`, { data: {} });
      expect(a1.ok(), `assinatura contratante: ${await a1.text()}`).toBeTruthy();
      expect((await a1.json()).contratoStatus).toBe("pendente_empreiteiro");
      await logout(request);

      // 4) Empreiteiro assina → assinado E obra em_andamento.
      await loginAs(request, EMPREITEIRO);
      const a2 = await request.post(`/api/obras/${obraId}/contrato/assinar`, { data: {} });
      expect(a2.ok(), `assinatura empreiteiro: ${await a2.text()}`).toBeTruthy();
      const b2 = await a2.json();
      expect(b2.contratoStatus).toBe("assinado");
      expect(b2.efetivada).toBe(true);
      await logout(request);

      const [o2] = await db.select({ status: obras.status, contratoStatus: obras.contratoStatus }).from(obras).where(eq(obras.id, obraId));
      expect(o2.status, "obra deve ficar em_andamento após ambas assinaturas").toBe("em_andamento");
      expect(o2.contratoStatus).toBe("assinado");

      // Assinaturas registradas (2) — ambas com ip.
      const assinaturas = await db.select().from(contratoAssinaturas).where(eq(contratoAssinaturas.obraId, obraId));
      expect(assinaturas.length, "2 assinaturas registradas").toBe(2);
      expect(assinaturas.every((a) => a.ip != null), "assinaturas devem gravar ip").toBeTruthy();

      // J60: a assinatura de contrato aparece na área admin.
      await loginAs(request, ADMIN);
      const lista = await request.get("/api/admin/contratos?documento=contrato_obra");
      expect(lista.ok()).toBeTruthy();
      const linhas = (await lista.json()) as Array<Record<string, any>>;
      expect(linhas.some((l) => l.documento === "contrato_obra"), "contrato de obra deve aparecer no admin").toBeTruthy();
      await logout(request);
    } finally {
      await concluir(request, obraId);
    }
  });

  test("GET do contrato mescla as variáveis; admin observa; empreiteiro não cancela", async ({ request }) => {
    const prep = await prepararAceite(request, `Obra E2E-j58-get ${stamp}`);
    test.skip(!prep, "Cota mensal de propostas esgotada — pular");
    const { obraId } = prep!;

    try {
      // GET como contratante: markdown mesclado com valor da proposta e nome das partes.
      await loginAs(request, CONTRATANTE);
      const get = await request.get(`/api/obras/${obraId}/contrato`);
      expect(get.ok()).toBeTruthy();
      const c = await get.json();
      expect(c.contratoStatus).toBe("pendente_contratante");
      expect(c.podeAssinar, "contratante pode assinar (é a vez)").toBe(true);
      expect(c.conteudo, "template deve estar mesclado (sem {{ }})").not.toContain("{{");
      expect(c.conteudo).toContain("R$"); // valor formatado
      await logout(request);

      // Admin observa (200) mas não é papel de assinatura.
      await loginAs(request, ADMIN);
      const adminGet = await request.get(`/api/obras/${obraId}/contrato`);
      expect(adminGet.status(), "admin observa o contrato").toBe(200);
      expect((await adminGet.json()).podeAssinar, "admin não assina").toBe(false);
      await logout(request);

      // Empreiteiro não pode cancelar (só contratante).
      await loginAs(request, EMPREITEIRO);
      const cancelEmp = await request.post(`/api/obras/${obraId}/contrato/cancelar`, { data: {} });
      expect(cancelEmp.status(), "empreiteiro não cancela").toBe(403);
      await logout(request);

      // Contratante cancela → obra reabre (empreiteiraId nulo, contratoStatus nulo).
      await loginAs(request, CONTRATANTE);
      const cancel = await request.post(`/api/obras/${obraId}/contrato/cancelar`, { data: {} });
      expect(cancel.ok(), `cancelar: ${await cancel.text()}`).toBeTruthy();
      await logout(request);

      const [o] = await db.select({ status: obras.status, contratoStatus: obras.contratoStatus, empreiteiraId: obras.empreiteiraId }).from(obras).where(eq(obras.id, obraId));
      expect(o.contratoStatus, "contrato zerado após cancelar").toBeNull();
      expect(o.empreiteiraId, "vínculo desfeito").toBeNull();
      expect(o.status).toBe("planejamento");
    } finally {
      await concluir(request, obraId);
    }
  });

  /**
   * Regressão das duas correções do cancelamento (gaps §13 da J58):
   *  (a) o empreiteiro perdia o vínculo em SILÊNCIO — nenhuma notificação;
   *  (b) o UPDATE reabria TODAS as candidaturas da obra, ressuscitando como
   *      `pendente` até as que o contratante havia rejeitado manualmente.
   * Cenário: 2 propostas (maria = aceita; segundo empreiteiro = rejeitado à mão
   * ANTES do aceite) → cancelar → só a da maria volta a `pendente`.
   */
  test("cancelar notifica o empreiteiro e não ressuscita candidatura rejeitada à mão", async ({ request }) => {
    const nome = `Obra E2E-j58-cancel ${stamp}`;
    await liberarCota(request);

    // Obra publicada + aprovada.
    await loginAs(request, CONTRATANTE);
    const createRes = await request.post("/api/obras", { data: { nome, endereco: "Rua E2E J58, 123", visibilidade: "rascunho" } });
    expect(createRes.ok()).toBeTruthy();
    const obraId = (await createRes.json()).id as string;
    const pub = await request.patch(`/api/obras/${obraId}`, { data: payloadPublicar(nome) });
    expect(pub.ok(), `publicar: ${await pub.text()}`).toBeTruthy();
    await logout(request);

    await loginAs(request, ADMIN);
    expect((await request.post(`/api/admin/obras/${obraId}/aprovar`)).status()).toBe(200);
    await logout(request);

    try {
      // Empreiteiro A (maria) candidata-se — será a ACEITA.
      await loginAs(request, EMPREITEIRO);
      const candA = await request.post("/api/empreiteiro/candidaturas", {
        data: { obraId, valorProposta: 50000, prazoEstimado: 4, descricao: "Proposta E2E J58 A.", atividades: "Fundação; Alvenaria." },
      });
      test.skip(candA.status() === 402, "Cota mensal de propostas (plano free) esgotada — pular");
      expect(candA.ok(), `candidatura A: ${candA.status()}`).toBeTruthy();
      const candAId = (await candA.json()).id as string;
      await logout(request);

      // Empreiteiro B candidata-se e é REJEITADO À MÃO antes do aceite.
      const empB = await criarEmpreiteiroVerificado(request, `j58cancel${stamp}`);
      await loginAs(request, empB.email);
      const candB = await request.post("/api/empreiteiro/candidaturas", {
        data: { obraId, valorProposta: 61000, prazoEstimado: 6, descricao: "Proposta E2E J58 B.", atividades: "Fundação; Acabamento." },
      });
      expect(candB.ok(), `candidatura B: ${candB.status()} ${await candB.text()}`).toBeTruthy();
      const candBId = (await candB.json()).id as string;
      await logout(request);

      await loginAs(request, CONTRATANTE);
      const rej = await request.post(`/api/contratante/candidaturas/${candBId}/rejeitar`, {
        data: { motivo: "Não atende ao escopo (rejeição manual E2E)" },
      });
      expect(rej.ok(), `rejeitar B: ${await rej.text()}`).toBeTruthy();
      // Aceita a A → entra no fluxo de contrato.
      const aceitar = await request.post(`/api/contratante/candidaturas/${candAId}/aceitar`, { data: {} });
      expect(aceitar.ok(), `aceite: ${await aceitar.text()}`).toBeTruthy();
      // Cancela antes de qualquer assinatura.
      const cancel = await request.post(`/api/obras/${obraId}/contrato/cancelar`, { data: {} });
      expect(cancel.ok(), `cancelar: ${await cancel.text()}`).toBeTruthy();
      await logout(request);

      // (b) A aceita volta a `pendente`; a rejeitada À MÃO permanece `rejeitada`.
      const [cA] = await db.select({ status: candidaturas.status }).from(candidaturas).where(eq(candidaturas.id, candAId));
      const [cB] = await db.select({ status: candidaturas.status, motivo: candidaturas.motivoRejeicao }).from(candidaturas).where(eq(candidaturas.id, candBId));
      expect(cA.status, "a candidatura aceita deve reabrir como pendente").toBe("pendente");
      expect(cB.status, "rejeição MANUAL não pode ser desfeita pelo cancelamento").toBe("rejeitada");
      expect(cB.motivo, "o motivo da rejeição manual deve ser preservado").toContain("rejeição manual E2E");

      // (a) O empreiteiro que perdeu o vínculo foi notificado.
      await loginAs(request, EMPREITEIRO);
      const notif = await esperarNotificacaoContrato(
        request,
        (n) => typeof n.titulo === "string" && n.titulo.includes("Contrato cancelado") && String(n.descricao ?? "").includes(nome),
      );
      expect(notif, "empreiteiro deve ser notificado do cancelamento").toBeTruthy();
      await logout(request);
    } finally {
      await concluir(request, obraId);
    }
  });
});
