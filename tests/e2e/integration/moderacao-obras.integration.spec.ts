import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  loginAs,
  logout,
  liberarCotaObras as liberarCotaObrasBase,
  concluirObra as concluirObraBase,
} from "../helpers";

/**
 * Integração (J36) — G3: moderação de obras (admin).
 *
 * Cobre o fluxo de moderação que decide o que entra no marketplace. Endpoints:
 *   - POST  /api/admin/obras/[id]/aprovar
 *   - POST  /api/admin/obras/[id]/rejeitar   (body { motivo })
 *   - GET   /api/admin/obras/destaque
 *   - PATCH /api/admin/obras/[id]/destaque   (body { destaque, ... })
 *   - GET   /api/admin/obras/[id]/medicoes
 *
 * Asserção-chave: obra APROVADA aparece no marketplace (GET /api/obras como
 * empreiteiro, que filtra visibilidade='publicada' AND statusModeracao='aprovada'),
 * obra pendente/rejeitada NÃO aparece.
 *
 * Descobertas técnicas (ver J36 §10):
 *   - aprovar/rejeitar exigem visibilidade='publicada' (senão 409 OBRA_NAO_PUBLICADA).
 *     Obra recém-criada via POST é rascunho+pendente → publicar via PATCH reseta a
 *     moderação para 'pendente' (app/api/obras/[id]/route.ts). Só então dá pra moderar.
 *   - aprovar é idempotente (2ª vez → 200 sem erro). rejeitar exige motivo ≥ 5 chars.
 *   - guards: aprovar/rejeitar/medições usam requireVerifiedUser+isAdminLike (não-admin
 *     → 403 "Apenas administradores."/"Sem permissão."); destaque usa requireAdmin
 *     (não-admin → 403 "Acesso negado"). Anônimo → 401 em todos.
 *   - COTA: o plano free do contratante seed permite só 1 obra ABERTA. Por isso cada
 *     teste cria a obra que precisa via `comObra`/`comObraPublicada` e a conclui logo
 *     em seguida (não há 3 obras simultâneas). Isolamento: nomes com "E2E".
 *
 * Pré-requisitos (playwright.config.ts): E2E_TEST_AUTH=1; seed com joão (contratante),
 * maria (empreiteiro), admin.
 */

const CONTRATANTE_EMAIL = "joao@construtora.com";
const EMPREITEIRO_EMAIL = "maria@empreiteira.com";
const ADMIN_EMAIL = "admin@xconstrucao.com";

function rows(payload: unknown): Array<Record<string, any>> {
  return Array.isArray(payload) ? payload : ((payload as any)?.rows ?? []);
}

/** Conclui TODAS as obras abertas do contratante (via admin) p/ liberar a cota do plano free. */
async function liberarCotaObras(request: APIRequestContext) {
  await liberarCotaObrasBase(request, {
    contratanteEmail: CONTRATANTE_EMAIL,
    adminEmail: ADMIN_EMAIL,
  });
}

/** Conclui uma obra específica (via admin) para liberar a cota. Best-effort. */
async function concluirObra(request: APIRequestContext, obraId: string) {
  await concluirObraBase(request, obraId, { adminEmail: ADMIN_EMAIL });
}

/** Payload completo de publicação (transição p/ 'publicada' reseta moderação → 'pendente'). */
function payloadPublicar(nome: string) {
  return {
    nome,
    endereco: "Rua E2E Moderação, 123",
    numero: "123",
    visibilidade: "publicada",
    tipo: "Reforma",
    descricao: "Obra E2E de integração para validar o fluxo de moderação (aprovar/rejeitar).",
    cep: "01310-100",
    cidade: "São Paulo",
    uf: "SP",
    modalidade: "empreitada_global",
    materiaisPor: "contratante",
  };
}

/** Cria uma obra do contratante seed no estado dado e devolve o id. Libera cota antes. */
async function criarObra(
  request: APIRequestContext,
  nome: string,
  { publicar }: { publicar: boolean },
): Promise<string> {
  await liberarCotaObras(request);
  await loginAs(request, CONTRATANTE_EMAIL);
  const createRes = await request.post("/api/obras", {
    data: { nome, endereco: "Rua E2E Moderação, 123", visibilidade: "rascunho" },
  });
  expect(createRes.ok(), `criação deve responder ok (status ${createRes.status()}): ${await createRes.text()}`).toBeTruthy();
  const obraId = (await createRes.json()).id as string;
  expect(obraId, "obra criada deve ter id").toBeTruthy();

  if (publicar) {
    const pubRes = await request.patch(`/api/obras/${obraId}`, { data: payloadPublicar(nome) });
    expect(pubRes.ok(), `publicação deve responder ok (status ${pubRes.status()}): ${await pubRes.text()}`).toBeTruthy();
  }
  await logout(request);
  return obraId;
}

/** Executa fn com uma obra publicada+pendente descartável; conclui a obra ao final. */
async function comObraPublicada(
  request: APIRequestContext,
  nome: string,
  fn: (obraId: string) => Promise<void>,
): Promise<void> {
  const obraId = await criarObra(request, nome, { publicar: true });
  try {
    await fn(obraId);
  } finally {
    await concluirObra(request, obraId);
  }
}

/** true se a obra aparece no marketplace (GET /api/obras como empreiteiro). */
async function apareceNoMarketplace(request: APIRequestContext, obraId: string): Promise<boolean> {
  await loginAs(request, EMPREITEIRO_EMAIL);
  const res = await request.get("/api/obras");
  const found = res.ok() && rows(await res.json()).some((o) => o.id === obraId);
  await logout(request);
  return found;
}

/** Busca a obra na listagem admin filtrada por status_moderacao (via admin). */
async function obraNaListagemAdmin(
  request: APIRequestContext,
  obraId: string,
  statusModeracao: string,
): Promise<Record<string, any> | undefined> {
  await loginAs(request, ADMIN_EMAIL);
  const res = await request.get(`/api/admin/obras?status_moderacao=${statusModeracao}&pageSize=100`);
  const hit = res.ok() ? rows(await res.json()).find((o) => o.id === obraId) : undefined;
  await logout(request);
  return hit;
}

const UUID_INEXISTENTE = "00000000-0000-0000-0000-000000000000";

test.describe.serial("Integração — G3: moderação de obras (admin)", () => {
  const stamp = Date.now().toString(36);

  test.afterAll(async ({ request }) => {
    // Garante que nenhuma obra E2E fique aberta ao final (cota + marketplace limpos).
    await liberarCotaObras(request);
  });

  // ---- authz transversal (não precisa de obra publicada) --------------------

  test("aprovar: anônimo → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post(`/api/admin/obras/${UUID_INEXISTENTE}/aprovar`);
    expect(res.status()).toBe(401);
  });

  test("aprovar: não-admin (contratante) → 403", async ({ request }) => {
    await loginAs(request, CONTRATANTE_EMAIL);
    const res = await request.post(`/api/admin/obras/${UUID_INEXISTENTE}/aprovar`);
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("aprovar: obra inexistente → 404", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);
    const res = await request.post(`/api/admin/obras/${UUID_INEXISTENTE}/aprovar`);
    expect(res.status()).toBe(404);
    await logout(request);
  });

  test("rejeitar: não-admin → 403", async ({ request }) => {
    await loginAs(request, CONTRATANTE_EMAIL);
    const res = await request.post(`/api/admin/obras/${UUID_INEXISTENTE}/rejeitar`, {
      data: { motivo: "Motivo válido de rejeição E2E" },
    });
    expect(res.status()).toBe(403);
    await logout(request);
  });

  // ---- aprovar: 409 não-publicada -------------------------------------------

  test("aprovar: obra em rascunho (não publicada) → 409 OBRA_NAO_PUBLICADA", async ({ request }) => {
    const obraId = await criarObra(request, `Obra E2E-mod-rascunho ${stamp}`, { publicar: false });
    try {
      await loginAs(request, ADMIN_EMAIL);
      const res = await request.post(`/api/admin/obras/${obraId}/aprovar`);
      expect(res.status()).toBe(409);
      expect((await res.json()).error).toBe("OBRA_NAO_PUBLICADA");
      await logout(request);
    } finally {
      await concluirObra(request, obraId);
    }
  });

  // ---- aprovar: fluxo feliz + idempotência + marketplace ---------------------

  test("aprovar: fluxo feliz → 200, grava aprovada, é idempotente e entra no marketplace", async ({ request }) => {
    await comObraPublicada(request, `Obra E2E-mod-aprovar ${stamp}`, async (obraId) => {
      // Antes de aprovar (pendente), NÃO aparece no marketplace.
      expect(await apareceNoMarketplace(request, obraId), "pendente não deve aparecer no marketplace").toBe(false);

      await loginAs(request, ADMIN_EMAIL);
      const res = await request.post(`/api/admin/obras/${obraId}/aprovar`);
      expect(res.status(), `aprovar deveria dar 200; corpo: ${await res.text()}`).toBe(200);
      const obra = await res.json();
      expect(obra.statusModeracao).toBe("aprovada");
      expect(obra.moderadoEm, "moderadoEm deve ser setado").toBeTruthy();
      expect(obra.moderadoPor, "moderadoPor deve ser setado").toBeTruthy();

      // Idempotência: aprovar de novo → 200, não erro.
      const again = await request.post(`/api/admin/obras/${obraId}/aprovar`);
      expect(again.status(), "2ª aprovação deve ser idempotente (200)").toBe(200);
      expect((await again.json()).statusModeracao).toBe("aprovada");
      await logout(request);

      // Estado no banco confirmado pela listagem admin filtrada.
      expect(await obraNaListagemAdmin(request, obraId, "aprovada"), "obra deve aparecer em status_moderacao=aprovada").toBeTruthy();

      // Efeito de negócio: agora aparece no marketplace.
      expect(await apareceNoMarketplace(request, obraId), "aprovada deve aparecer no marketplace").toBe(true);
    });
  });

  // ---- rejeitar: validação + fluxo feliz + marketplace ----------------------

  test("rejeitar: motivo curto (<5) → 400; feliz → 200 grava rejeitada+motivo e não entra no marketplace", async ({ request }) => {
    await comObraPublicada(request, `Obra E2E-mod-rejeitar ${stamp}`, async (obraId) => {
      await loginAs(request, ADMIN_EMAIL);

      // motivo curto → 400.
      const curto = await request.post(`/api/admin/obras/${obraId}/rejeitar`, { data: { motivo: "abc" } });
      expect(curto.status()).toBe(400);

      // feliz → 200 + grava.
      const motivo = "Documentação insuficiente (rejeição E2E de integração).";
      const res = await request.post(`/api/admin/obras/${obraId}/rejeitar`, { data: { motivo } });
      expect(res.status(), `rejeitar deveria dar 200; corpo: ${await res.text()}`).toBe(200);
      const obra = await res.json();
      expect(obra.statusModeracao).toBe("rejeitada");
      expect(obra.motivoModeracao).toBe(motivo);
      await logout(request);

      expect(await obraNaListagemAdmin(request, obraId, "rejeitada"), "obra deve aparecer em status_moderacao=rejeitada").toBeTruthy();
      expect(await apareceNoMarketplace(request, obraId), "rejeitada não deve aparecer no marketplace").toBe(false);
    });
  });

  // ---- destaque (GET + PATCH) ----------------------------------------------

  test("destaque GET: não-admin → 403; admin → 200 { rows, count, limite }", async ({ request }) => {
    await loginAs(request, CONTRATANTE_EMAIL);
    const naoAdmin = await request.get("/api/admin/obras/destaque");
    expect(naoAdmin.status()).toBe(403);
    await logout(request);

    await loginAs(request, ADMIN_EMAIL);
    const res = await request.get("/api/admin/obras/destaque");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.rows)).toBe(true);
    expect(typeof body.limite).toBe("number");
    await logout(request);
  });

  test("destaque PATCH: não-admin → 403; admin desliga destaque → 200 { ok: true }", async ({ request }) => {
    await comObraPublicada(request, `Obra E2E-mod-destaque ${stamp}`, async (obraId) => {
      await loginAs(request, CONTRATANTE_EMAIL);
      const naoAdmin = await request.patch(`/api/admin/obras/${obraId}/destaque`, { data: { destaque: false } });
      expect(naoAdmin.status()).toBe(403);
      await logout(request);

      // Desligar não exige capa (o ligar exigiria fotoCapaFileId válido) → caminho feliz simples.
      await loginAs(request, ADMIN_EMAIL);
      const res = await request.patch(`/api/admin/obras/${obraId}/destaque`, { data: { destaque: false } });
      expect(res.status(), `destaque off deveria dar 200; corpo: ${await res.text()}`).toBe(200);
      expect((await res.json()).ok).toBe(true);
      await logout(request);
    });
  });

  // ---- medições -------------------------------------------------------------

  test("medições GET: não-admin → 403; inexistente → 404; admin em obra válida → 200 (array)", async ({ request }) => {
    // não-admin e inexistente não precisam de obra publicada.
    await loginAs(request, CONTRATANTE_EMAIL);
    const naoAdmin = await request.get(`/api/admin/obras/${UUID_INEXISTENTE}/medicoes`);
    expect(naoAdmin.status()).toBe(403);
    await logout(request);

    await loginAs(request, ADMIN_EMAIL);
    const inexistente = await request.get(`/api/admin/obras/${UUID_INEXISTENTE}/medicoes`);
    expect(inexistente.status()).toBe(404);
    await logout(request);

    await comObraPublicada(request, `Obra E2E-mod-medicoes ${stamp}`, async (obraId) => {
      await loginAs(request, ADMIN_EMAIL);
      const res = await request.get(`/api/admin/obras/${obraId}/medicoes`);
      expect(res.status(), `medições deveria dar 200; corpo: ${await res.text()}`).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body) || Array.isArray(body?.rows)).toBeTruthy();
      await logout(request);
    });
  });
});
