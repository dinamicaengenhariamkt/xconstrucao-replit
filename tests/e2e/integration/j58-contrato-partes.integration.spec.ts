import { test, expect, type APIRequestContext } from "@playwright/test";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obras, contratoAssinaturas } from "@shared/db/schema";
import {
  loginAs,
  logout,
  liberarCotaObras as liberarCotaObrasBase,
  concluirObra as concluirObraBase,
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

  test.afterAll(async ({ request }) => {
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
});
