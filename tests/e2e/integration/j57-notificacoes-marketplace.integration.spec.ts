import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  loginAs,
  logout,
  liberarCotaObras as liberarCotaObrasBase,
  limparObrasE2E,
  concluirObra as concluirObraBase,
} from "../helpers";

/**
 * Integração (J57) — Notificações & Indicadores do Marketplace.
 *
 * Cobre os gaps que fecham a percepção de "algo aconteceu" entre as visões:
 *   1. Obra aprovada → notificação (sucesso) ao contratante dono.
 *      Obra rejeitada → notificação (alerta) ao contratante com o motivo.
 *   2. Nova proposta → notificação (info) ao contratante.
 *   3. Aceite → notificação (info) aos admins ("Obra contratada").
 *   4. GET /api/obras (contratante) traz candidaturasCount (pendentes).
 *   5. GET /api/contratante/candidaturas/novas-count traz o total pendente.
 *   6. GET das candidaturas do contratante traz cnpj/especialidades/registro
 *      e NÃO traz portfolioDocs (docs podem ser privados).
 *
 * Notificações são fire-and-forget (disparadas após o response), então lemos
 * com um pequeno poll. Todos os dados de teste levam "E2E" no nome (cleanup por
 * convenção). Cota do plano free liberada no início.
 *
 * Pré-requisitos (playwright.config.ts): E2E_TEST_AUTH=1; seed com joão
 * (contratante), maria (empreiteiro), admin.
 */

const CONTRATANTE_EMAIL = "joao@construtora.com";
const EMPREITEIRO_EMAIL = "maria@empreiteira.com";
const ADMIN_EMAIL = "admin@xconstrucao.com";

function rows(payload: unknown): Array<Record<string, any>> {
  return Array.isArray(payload) ? payload : ((payload as any)?.rows ?? []);
}

async function liberarCotaObras(request: APIRequestContext) {
  await liberarCotaObrasBase(request, {
    contratanteEmail: CONTRATANTE_EMAIL,
    adminEmail: ADMIN_EMAIL,
  });
}

async function concluirObra(request: APIRequestContext, obraId: string) {
  await concluirObraBase(request, obraId, { adminEmail: ADMIN_EMAIL });
}

function payloadPublicar(nome: string) {
  return {
    nome,
    endereco: "Rua E2E J57, 123",
    numero: "123",
    visibilidade: "publicada",
    tipo: "Reforma",
    descricao: "Obra E2E de integração J57 para validar notificações e indicadores do marketplace.",
    cep: "01310-100",
    cidade: "São Paulo",
    uf: "SP",
    modalidade: "empreitada_global",
    materiaisPor: "contratante",
  };
}

/** Cria (opcionalmente publica) uma obra do contratante seed e devolve o id. */
async function criarObra(
  request: APIRequestContext,
  nome: string,
  { publicar }: { publicar: boolean },
): Promise<string> {
  await liberarCotaObras(request);
  await loginAs(request, CONTRATANTE_EMAIL);
  const createRes = await request.post("/api/obras", {
    data: { nome, endereco: "Rua E2E J57, 123", visibilidade: "rascunho" },
  });
  expect(createRes.ok(), `criação deve responder ok (status ${createRes.status()})`).toBeTruthy();
  const obraId = (await createRes.json()).id as string;
  expect(obraId, "obra criada deve ter id").toBeTruthy();
  if (publicar) {
    const pubRes = await request.patch(`/api/obras/${obraId}`, { data: payloadPublicar(nome) });
    expect(pubRes.ok(), `publicação deve responder ok (status ${pubRes.status()})`).toBeTruthy();
  }
  await logout(request);
  return obraId;
}

/**
 * Lê as notificações do usuário logado, com poll (as notificações são
 * fire-and-forget). Retorna o item cujo href/predicado casa, ou undefined.
 */
async function esperarNotificacao(
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

test.describe.serial("Integração — J57: notificações & indicadores do marketplace", () => {
  const stamp = Date.now().toString(36);

  // Apaga obras E2E + candidaturas delas. Concluir a obra devolve a cota de OBRAS
  // do contratante, mas não a de PROPOSTAS/mês do empreiteiro — essa conta
  // candidaturas criadas no mês, independente do estado da obra. Sem isto a cota
  // free esgota após poucas execuções e os testes passam a skipar em silêncio.
  test.beforeAll(async ({ request }) => {
    await limparObrasE2E(request, { contratanteEmail: CONTRATANTE_EMAIL });
  });

  test.afterAll(async ({ request }) => {
    await limparObrasE2E(request, { contratanteEmail: CONTRATANTE_EMAIL });
    await liberarCotaObras(request);
  });

  // ---- obras-health: mapa de saúde do portfólio inteiro (admin-only) --------

  test("GET /api/admin/obras-health: admin recebe o mapa; não-admin é barrado", async ({ request }) => {
    // Contratante não enxerga a saúde do portfólio inteiro.
    await loginAs(request, CONTRATANTE_EMAIL);
    const negado = await request.get("/api/admin/obras-health");
    expect(negado.status(), "contratante deve receber 403").toBe(403);
    await logout(request);

    await loginAs(request, ADMIN_EMAIL);
    const res = await request.get("/api/admin/obras-health");
    expect(res.status(), `admin: ${await res.text()}`).toBe(200);

    // O contrato é um mapa obraId → ObraHealth, não uma lista.
    const mapa = (await res.json()) as Record<string, unknown>;
    expect(Array.isArray(mapa), "resposta deve ser um objeto-mapa, não array").toBeFalsy();
    expect(typeof mapa, "resposta deve ser objeto").toBe("object");
    await logout(request);
  });

  // ---- Item 1: aprovação notifica o contratante ----------------------------

  test("obra aprovada gera notificação de sucesso ao contratante dono", async ({ request }) => {
    const nome = `Obra E2E-j57-aprovar ${stamp}`;
    const obraId = await criarObra(request, nome, { publicar: true });
    try {
      await loginAs(request, ADMIN_EMAIL);
      const res = await request.post(`/api/admin/obras/${obraId}/aprovar`);
      expect(res.status(), `aprovar deveria dar 200; corpo: ${await res.text()}`).toBe(200);
      await logout(request);

      await loginAs(request, CONTRATANTE_EMAIL);
      const notif = await esperarNotificacao(
        request,
        (n) => n.href === `/contratante/minhas-obras/${obraId}` && n.tipo === "sucesso",
      );
      expect(notif, "contratante deve receber notificação de obra aprovada").toBeTruthy();
      await logout(request);
    } finally {
      await concluirObra(request, obraId);
    }
  });

  // ---- Item 1: rejeição notifica o contratante (com motivo) ----------------

  test("obra rejeitada gera notificação de alerta ao contratante com o motivo", async ({ request }) => {
    const nome = `Obra E2E-j57-rejeitar ${stamp}`;
    const obraId = await criarObra(request, nome, { publicar: true });
    const motivo = "Documentação insuficiente (rejeição E2E J57).";
    try {
      await loginAs(request, ADMIN_EMAIL);
      const res = await request.post(`/api/admin/obras/${obraId}/rejeitar`, { data: { motivo } });
      expect(res.status(), `rejeitar deveria dar 200; corpo: ${await res.text()}`).toBe(200);
      await logout(request);

      await loginAs(request, CONTRATANTE_EMAIL);
      const notif = await esperarNotificacao(
        request,
        (n) => n.href === `/contratante/minhas-obras/${obraId}` && n.tipo === "alerta",
      );
      expect(notif, "contratante deve receber notificação de obra rejeitada").toBeTruthy();
      expect(notif?.descricao ?? "", "descrição deve conter o motivo").toContain("Documentação insuficiente");
      await logout(request);
    } finally {
      await concluirObra(request, obraId);
    }
  });

  // ---- Itens 2/3/4/5/6 num só fluxo: candidatura → aceite ------------------

  test("proposta notifica contratante; aceite notifica admin; counts e dados do candidato", async ({ request }) => {
    const nome = `Obra E2E-j57-proposta ${stamp}`;
    const obraId = await criarObra(request, nome, { publicar: true });
    try {
      // Aprova para entrar no marketplace.
      await loginAs(request, ADMIN_EMAIL);
      const apr = await request.post(`/api/admin/obras/${obraId}/aprovar`);
      expect(apr.status(), `aprovar: ${await apr.text()}`).toBe(200);
      await logout(request);

      // Empreiteiro candidata.
      await loginAs(request, EMPREITEIRO_EMAIL);
      const candRes = await request.post("/api/empreiteiro/candidaturas", {
        data: { obraId, valorProposta: 50000, prazoEstimado: 4, descricao: "Proposta E2E J57." },
      });
      test.skip(
        candRes.status() === 402,
        "Cota mensal de propostas (plano free) esgotada nesta execução — pular",
      );
      expect(candRes.ok(), `candidatura: ${candRes.status()}`).toBeTruthy();
      const candidaturaId = (await candRes.json()).id as string;
      await logout(request);

      // Item 2: contratante recebe notificação de nova proposta (info). O href
      // carrega ?proposta=1 (distinto do href da moderação — ver dispatcher).
      await loginAs(request, CONTRATANTE_EMAIL);
      const notifProposta = await esperarNotificacao(
        request,
        (n) => n.href === `/contratante/minhas-obras/${obraId}?proposta=1` && n.titulo === "Nova proposta recebida",
      );
      expect(notifProposta, "contratante deve ser notificado da nova proposta").toBeTruthy();

      // Item 4: GET /api/obras traz candidaturasCount ≥ 1 para a obra.
      const listRes = await request.get("/api/obras?pageSize=100");
      expect(listRes.ok()).toBeTruthy();
      const obra = rows(await listRes.json()).find((o) => o.id === obraId);
      expect(obra, "obra deve estar na listagem do contratante").toBeTruthy();
      expect(typeof obra?.candidaturasCount, "candidaturasCount deve vir na API").toBe("number");
      expect(obra?.candidaturasCount, "candidaturasCount deve contar a proposta pendente").toBeGreaterThanOrEqual(1);

      // Item 5: novas-count reflete a proposta pendente.
      const countRes = await request.get("/api/contratante/candidaturas/novas-count");
      expect(countRes.ok()).toBeTruthy();
      const { total } = await countRes.json();
      expect(typeof total, "novas-count deve responder { total }").toBe("number");
      expect(total, "deve haver ≥ 1 proposta pendente").toBeGreaterThanOrEqual(1);

      // Item 6: dados de confiança do candidato — cnpj/especialidades/registro
      // presentes; portfolioDocs NÃO exposto.
      const candListRes = await request.get(`/api/contratante/obras/${obraId}/candidaturas`);
      expect(candListRes.ok()).toBeTruthy();
      const candRows = (await candListRes.json()) as Array<Record<string, any>>;
      const alvo = candRows.find((c) => c.id === candidaturaId) ?? candRows[0];
      expect(alvo, "candidatura deve aparecer na listagem do dono").toBeTruthy();
      expect("empreiteiraCnpj" in alvo, "deve expor empreiteiraCnpj").toBeTruthy();
      expect("empreiteiraEspecialidades" in alvo, "deve expor empreiteiraEspecialidades").toBeTruthy();
      expect("empreiteiraRegistroProfissional" in alvo, "deve expor registroProfissional").toBeTruthy();
      expect("portfolioDocs" in alvo, "NÃO deve expor portfolioDocs").toBeFalsy();
      expect("empreiteiraPortfolioDocs" in alvo, "NÃO deve expor portfolioDocs (alias)").toBeFalsy();

      // Item 4 (blindagem): empreiteiro NÃO deve ver candidaturasCount na sua listagem.
      await logout(request);
      await loginAs(request, EMPREITEIRO_EMAIL);
      const empList = await request.get("/api/obras?pageSize=100");
      const obraEmp = rows(await empList.json()).find((o) => o.id === obraId);
      if (obraEmp) {
        expect("candidaturasCount" in obraEmp, "empreiteiro não deve ver candidaturasCount").toBeFalsy();
      }
      await logout(request);

      // Contratante aceita → item 3: admins notificados de "Obra contratada".
      await loginAs(request, CONTRATANTE_EMAIL);
      const aceitarRes = await request.post(`/api/contratante/candidaturas/${candidaturaId}/aceitar`, {
        data: {},
      });
      expect(aceitarRes.ok(), `aceite: ${await aceitarRes.text()}`).toBeTruthy();
      await logout(request);

      await loginAs(request, ADMIN_EMAIL);
      const notifAdmin = await esperarNotificacao(
        request,
        (n) => n.href === "/admin/obras" && n.titulo === "Obra contratada",
      );
      expect(notifAdmin, "admin deve ser notificado da obra contratada").toBeTruthy();
      await logout(request);
    } finally {
      await concluirObra(request, obraId);
    }
  });
});
