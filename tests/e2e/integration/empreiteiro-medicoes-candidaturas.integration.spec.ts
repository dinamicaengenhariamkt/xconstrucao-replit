import { test, expect } from "@playwright/test";
import { eq, inArray } from "drizzle-orm";
import { db } from "@shared/db/db";
import { medicoes, candidaturas, candidaturaAnexos, userFiles, financeiro, obras } from "@shared/db/schema";
import { loginAs, logout, SEED_CONTRATANTE_EMAIL, SEED_EMPREITEIRO_EMAIL } from "../helpers";
import { criarObraVinculadaE2E, limparObraVinculadaE2E, type ObraVinculada } from "../helpers-marketplace";

/**
 * Integração (J36) — Medições do empreiteiro + anexos/cancelamento de
 * candidatura + KPIs de pagamentos/medições + moderação de candidaturas pelo
 * contratante.
 *
 * Endpoints:
 *   POST/GET /api/empreiteiro/medicoes
 *   POST     /api/empreiteiro/candidaturas/[id]/anexos
 *   DELETE   /api/empreiteiro/candidaturas/[id]/anexos/[anexoId]
 *   POST     /api/empreiteiro/candidaturas/[id]/cancelar
 *   GET      /api/empreiteiro/pagamentos · /kpi
 *   POST     /api/contratante/medicoes/[id]/contestar
 *   GET      /api/contratante/medicoes/kpi
 *   GET      /api/contratante/pagamentos/kpi
 *   GET      /api/contratante/obras/[id]/candidaturas
 *   POST     /api/contratante/candidaturas/[id]/rejeitar
 *
 * Setup: obra E2E vinculada (contratante+empreiteiro seed) via
 * `criarObraVinculadaE2E`. Medição e candidatura de teste são inseridas
 * diretamente via Drizzle (não há endpoint de candidatura pronto reaproveitável
 * sem custo de cota do plano free — ver `obras-candidatura.integration.spec.ts`),
 * marcadas com "E2E" e removidas no cleanup.
 */

async function limparMedicoesDaObra(obraId: string | null | undefined): Promise<void> {
  if (!obraId) return;
  // Aprovar uma medição gera o lançamento financeiro correspondente. Ele
  // precisa sair ANTES: `financeiro.obra_id` não tem CASCADE, então a linha
  // sobreviveria e depois bloquearia o DELETE da obra no cleanup seguinte.
  await db.delete(financeiro).where(eq(financeiro.obraId, obraId)).catch(() => {});
  await db.delete(medicoes).where(eq(medicoes.obraId, obraId)).catch(() => {});
}

async function limparCandidaturasDaObra(obraId: string | null | undefined): Promise<void> {
  if (!obraId) return;
  const rows = await db.select({ id: candidaturas.id }).from(candidaturas).where(eq(candidaturas.obraId, obraId));
  const ids = rows.map((r) => r.id);
  if (ids.length > 0) {
    await db.delete(candidaturaAnexos).where(inArray(candidaturaAnexos.candidaturaId, ids)).catch(() => {});
    await db.delete(candidaturas).where(inArray(candidaturas.id, ids)).catch(() => {});
  }
}

/** Insere uma candidatura E2E pendente diretamente no banco. */
async function criarCandidaturaE2E(args: {
  obraId: string;
  empreiteiroUserId: string;
  tag: string;
}): Promise<string> {
  const [c] = await db
    .insert(candidaturas)
    .values({
      obraId: args.obraId,
      empreiteiroId: args.empreiteiroUserId,
      valorProposta: "1000.00",
      prazoEstimado: 10,
      descricao: `E2E ${args.tag} — candidatura de teste`,
      status: "pendente",
    })
    .returning({ id: candidaturas.id });
  return c!.id;
}

/** Insere um user_files E2E (kind=candidatura_anexo) para o owner informado. */
async function criarUserFileE2E(args: { ownerUserId: string; tag: string }): Promise<string> {
  const [f] = await db
    .insert(userFiles)
    .values({
      ownerUserId: args.ownerUserId,
      kind: "candidatura_anexo",
      visibility: "private",
      bucketKey: `e2e/${args.tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`,
      originalName: `${args.tag}.pdf`,
      mime: "application/pdf",
      sizeBytes: 1024,
    })
    .returning({ id: userFiles.id });
  return f!.id;
}

async function limparUserFile(fileId: string | null | undefined): Promise<void> {
  if (!fileId) return;
  await db.delete(userFiles).where(eq(userFiles.id, fileId)).catch(() => {});
}

// ---------------------------------------------------------------------------
// Guards de autenticação / role
// ---------------------------------------------------------------------------

test.describe("J36 — medições/candidaturas/pagamentos: guards", () => {
  test("GET /api/empreiteiro/medicoes sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/empreiteiro/medicoes");
    expect(res.status()).toBe(401);
  });

  test("POST /api/empreiteiro/medicoes sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post("/api/empreiteiro/medicoes", { data: {} });
    expect(res.status()).toBe(401);
  });

  test("GET /api/empreiteiro/medicoes como contratante → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.get("/api/empreiteiro/medicoes");
    expect(res.status(), "contratante não pode listar medições do empreiteiro").toBe(403);
    await logout(request);
  });

  test("POST /api/empreiteiro/medicoes como contratante → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.post("/api/empreiteiro/medicoes", { data: {} });
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("GET /api/empreiteiro/pagamentos sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/empreiteiro/pagamentos");
    expect(res.status()).toBe(401);
  });

  test("GET /api/empreiteiro/pagamentos como contratante → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.get("/api/empreiteiro/pagamentos");
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("GET /api/empreiteiro/pagamentos/kpi sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/empreiteiro/pagamentos/kpi");
    expect(res.status()).toBe(401);
  });

  test("GET /api/empreiteiro/pagamentos/kpi como contratante → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.get("/api/empreiteiro/pagamentos/kpi");
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("GET /api/empreiteiro/pagamentos/kpi como empreiteiro → 200", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const res = await request.get("/api/empreiteiro/pagamentos/kpi");
    expect(res.status()).toBe(200);
    await logout(request);
  });

  test("GET /api/contratante/medicoes/kpi sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/contratante/medicoes/kpi");
    expect(res.status()).toBe(401);
  });

  test("GET /api/contratante/medicoes/kpi como empreiteiro → 403", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const res = await request.get("/api/contratante/medicoes/kpi");
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("GET /api/contratante/medicoes/kpi como contratante → 200", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.get("/api/contratante/medicoes/kpi");
    expect(res.status()).toBe(200);
    await logout(request);
  });

  test("GET /api/contratante/pagamentos/kpi sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/contratante/pagamentos/kpi");
    expect(res.status()).toBe(401);
  });

  test("GET /api/contratante/pagamentos/kpi como empreiteiro → 403", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const res = await request.get("/api/contratante/pagamentos/kpi");
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("GET /api/contratante/pagamentos/kpi como contratante → 200", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.get("/api/contratante/pagamentos/kpi");
    expect(res.status()).toBe(200);
    await logout(request);
  });

  test("POST /api/contratante/medicoes/[id]/contestar sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post("/api/contratante/medicoes/inexistente/contestar", {
      data: { motivo: "motivo qualquer com mais de dez caracteres" },
    });
    expect(res.status()).toBe(401);
  });

  test("POST /api/contratante/candidaturas/[id]/rejeitar sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post("/api/contratante/candidaturas/inexistente/rejeitar", { data: {} });
    expect(res.status()).toBe(401);
  });

  test("GET /api/contratante/obras/[id]/candidaturas sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/contratante/obras/inexistente/candidaturas");
    expect(res.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Validação — POST /api/empreiteiro/medicoes
// ---------------------------------------------------------------------------

test.describe("J36 — POST /api/empreiteiro/medicoes: validação", () => {
  test("body inválido (percentual ausente) → 400", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const res = await request.post("/api/empreiteiro/medicoes", {
      data: { obraId: "x", etapa: "Fundação" },
    });
    expect(res.status(), "payload sem percentual deve retornar 400").toBe(400);
    await logout(request);
  });

  test("obra inexistente → 404", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const res = await request.post("/api/empreiteiro/medicoes", {
      data: { obraId: "00000000-0000-0000-0000-000000000000", etapa: "Fundação", percentual: 10 },
    });
    expect(res.status(), "obra inexistente deve retornar 404").toBe(404);
    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// Fluxo feliz — medições
// ---------------------------------------------------------------------------

test.describe("J36 — medições: fluxo ponta-a-ponta", () => {
  let obra: ObraVinculada;

  test.beforeEach(async () => {
    obra = await criarObraVinculadaE2E("medicoes-fluxo");
  });

  test.afterEach(async () => {
    await limparMedicoesDaObra(obra?.obraId);
    await limparObraVinculadaE2E(obra?.obraId);
  });

  test("empreiteiro registra medição → aparece em GET → contratante contesta → KPIs refletem", async ({
    request,
  }) => {
    // 1. Empreiteiro registra medição na obra vinculada.
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const criar = await request.post("/api/empreiteiro/medicoes", {
      data: {
        obraId: obra.obraId,
        etapa: "E2E Fundação",
        descricao: "Medição E2E de teste",
        percentual: 20,
        valor: 5000,
      },
    });
    expect(criar.status(), "criar medição deve retornar 201").toBe(201);
    const medicao = (await criar.json()) as { id: string; status: string; numero: number };
    expect(medicao.id, "medição deve ter id").toBeTruthy();
    expect(medicao.status, "medição nasce pendente").toBe("pendente");
    const medicaoId = medicao.id;

    // Grava de fato: aparece em GET /api/empreiteiro/medicoes.
    const listar = await request.get("/api/empreiteiro/medicoes");
    expect(listar.status()).toBe(200);
    const lista = (await listar.json()) as Array<{ id: string }>;
    expect(lista.some((m) => m.id === medicaoId), "medição criada deve aparecer na listagem").toBeTruthy();

    // Percentual estourando 100% (soma já em 20%, + 90% > 100) → 422.
    const estourar = await request.post("/api/empreiteiro/medicoes", {
      data: { obraId: obra.obraId, etapa: "E2E excesso", percentual: 90 },
    });
    expect(estourar.status(), "percentual que ultrapassa 100% deve retornar 422").toBe(422);

    // KPI de pagamentos do empreiteiro reflete o valor aguardando aprovação.
    const kpiEmp = await request.get("/api/empreiteiro/pagamentos/kpi");
    expect(kpiEmp.status()).toBe(200);
    const kpiEmpBody = (await kpiEmp.json()) as { aguardandoAprovacao: number };
    expect(
      kpiEmpBody.aguardandoAprovacao,
      "KPI do empreiteiro deve contabilizar valor aguardando aprovação",
    ).toBeGreaterThanOrEqual(5000);

    // Lista de pagamentos do empreiteiro também mostra a medição aguardando.
    const pagamentosEmp = await request.get("/api/empreiteiro/pagamentos");
    expect(pagamentosEmp.status()).toBe(200);
    const pagamentosEmpBody = (await pagamentosEmp.json()) as Array<{ id: string; status: string }>;
    expect(
      pagamentosEmpBody.some((p) => p.id === medicaoId && p.status === "aguardando_aprovacao"),
      "medição pendente deve aparecer como aguardando_aprovacao na lista de pagamentos",
    ).toBeTruthy();
    await logout(request);

    // 2. Contratante contesta a medição.
    await loginAs(request, SEED_CONTRATANTE_EMAIL);

    // Validação: motivo curto → 400.
    const contestarInvalido = await request.post(`/api/contratante/medicoes/${medicaoId}/contestar`, {
      data: { motivo: "curto" },
    });
    expect(contestarInvalido.status(), "motivo curto deve retornar 400").toBe(400);

    const kpiContratanteAntes = await request.get("/api/contratante/medicoes/kpi");
    expect(kpiContratanteAntes.status()).toBe(200);
    const kpiContratanteAntesBody = (await kpiContratanteAntes.json()) as { countAguardando: number };
    expect(
      kpiContratanteAntesBody.countAguardando,
      "KPI do contratante deve contar a medição aguardando aprovação",
    ).toBeGreaterThanOrEqual(1);

    const contestar = await request.post(`/api/contratante/medicoes/${medicaoId}/contestar`, {
      data: { motivo: "Medição não reflete o serviço executado em campo." },
    });
    expect(contestar.status(), "contestar medição válida deve retornar 200").toBe(200);
    const contestada = (await contestar.json()) as { status: string; motivoContestacao: string };
    expect(contestada.status, "medição deve ficar contestada").toBe("contestada");

    // Estado no banco.
    const [apos] = await db
      .select({ status: medicoes.status, motivo: medicoes.motivoContestacao, decidedBy: medicoes.decidedBy })
      .from(medicoes)
      .where(eq(medicoes.id, medicaoId))
      .limit(1);
    expect(apos?.status, "status no banco deve ser contestada").toBe("contestada");
    expect(apos?.motivo, "motivo da contestação deve ser persistido").toBeTruthy();
    expect(apos?.decidedBy, "decidedBy deve ser setado").toBeTruthy();

    // Contestar de novo (já não está mais pendente) → 409.
    const contestarDeNovo = await request.post(`/api/contratante/medicoes/${medicaoId}/contestar`, {
      data: { motivo: "Segunda tentativa de contestação sobre a mesma medição." },
    });
    expect(contestarDeNovo.status(), "contestar medição já decidida deve retornar 409").toBe(409);

    // KPI de pagamentos do contratante responde 200 (fluxo básico de leitura).
    const kpiPagamentosContratante = await request.get("/api/contratante/pagamentos/kpi");
    expect(kpiPagamentosContratante.status()).toBe(200);

    await logout(request);
  });

  /**
   * Aprovação de medição — caminho FELIZ.
   *
   * Havia uma lacuna real aqui: só existiam os caminhos negativos de
   * `POST /api/contratante/medicoes/[id]/aprovar` (role errada, medição
   * inexistente) em `financeiro-webhook.integration.spec.ts`. O sucesso —
   * que move dinheiro — não era exercitado por nenhum teste.
   *
   * A rota faz quatro coisas numa transação só: muda o status, cria o
   * lançamento financeiro (fatura), recalcula o progresso da obra e registra
   * as atividades. O teste assere as quatro, não só o 200.
   */
  test("contratante aprova medição → status muda, gera lançamento financeiro e recalcula progresso", async ({
    request,
  }) => {
    // 1. Empreiteiro registra a medição.
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const criar = await request.post("/api/empreiteiro/medicoes", {
      data: {
        obraId: obra.obraId,
        etapa: "E2E Alvenaria",
        descricao: "Medição E2E para aprovação",
        percentual: 30,
        valor: 7500,
      },
    });
    expect(criar.status(), "criar medição deve retornar 201").toBe(201);
    const { id: medicaoId } = (await criar.json()) as { id: string };
    await logout(request);

    // 2. Contratante aprova.
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const aprovar = await request.post(`/api/contratante/medicoes/${medicaoId}/aprovar`, {
      data: {},
    });
    expect(
      aprovar.status(),
      `aprovar medição pendente deve retornar 200; corpo: ${await aprovar.text()}`,
    ).toBe(200);

    // 3. Estado no banco: aprovada, com quem decidiu e quando.
    const [apos] = await db
      .select({
        status: medicoes.status,
        decidedBy: medicoes.decidedBy,
        decidedAt: medicoes.decidedAt,
      })
      .from(medicoes)
      .where(eq(medicoes.id, medicaoId))
      .limit(1);
    expect(apos?.status, "status no banco deve ser aprovada").toBe("aprovada");
    expect(apos?.decidedBy, "decidedBy deve registrar o contratante").toBeTruthy();
    expect(apos?.decidedAt, "decidedAt deve ser preenchido").toBeTruthy();

    // 4. A fatura foi criada e está amarrada à medição (UNIQUE medicao_id).
    const [lancamento] = await db
      .select({ id: financeiro.id, valor: financeiro.valor, status: financeiro.status })
      .from(financeiro)
      .where(eq(financeiro.medicaoId, medicaoId))
      .limit(1);
    expect(lancamento?.id, "aprovar deve gerar o lançamento financeiro da medição").toBeTruthy();
    expect(Number(lancamento?.valor), "valor do lançamento deve espelhar a medição").toBe(7500);
    expect(lancamento?.status, "lançamento nasce pendente de pagamento").toBe("pendente");

    // 5. Progresso da obra recalculado a partir das medições aprovadas.
    const [obraApos] = await db
      .select({ progresso: obras.progresso })
      .from(obras)
      .where(eq(obras.id, obra.obraId))
      .limit(1);
    expect(
      Number(obraApos?.progresso),
      "progresso da obra deve refletir os 30% aprovados",
    ).toBe(30);

    // 6. Idempotência: aprovar de novo não duplica fatura nem reabre a medição.
    const aprovarDeNovo = await request.post(`/api/contratante/medicoes/${medicaoId}/aprovar`, {
      data: {},
    });
    expect(
      aprovarDeNovo.status(),
      "aprovar medição já decidida deve ser recusado (409)",
    ).toBe(409);

    const faturas = await db
      .select({ id: financeiro.id })
      .from(financeiro)
      .where(eq(financeiro.medicaoId, medicaoId));
    expect(faturas.length, "não pode haver fatura duplicada para a mesma medição").toBe(1);

    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// Fluxo feliz — candidaturas: anexos + cancelamento + moderação
// ---------------------------------------------------------------------------

test.describe("J36 — candidatura: anexos + cancelamento + moderação do contratante", () => {
  let obra: ObraVinculada;
  let candidaturaId = "";
  let fileId = "";

  test.beforeEach(async () => {
    obra = await criarObraVinculadaE2E("candidatura-fluxo");
    candidaturaId = await criarCandidaturaE2E({
      obraId: obra.obraId,
      empreiteiroUserId: obra.empreiteiroUserId,
      tag: "candidatura-fluxo",
    });
    fileId = await criarUserFileE2E({ ownerUserId: obra.empreiteiroUserId, tag: "candidatura-fluxo" });
  });

  test.afterEach(async () => {
    await limparCandidaturasDaObra(obra?.obraId);
    await limparUserFile(fileId);
    await limparObraVinculadaE2E(obra?.obraId);
  });

  test("empreiteiro anexa arquivo → contratante lista/vê anexo → empreiteiro remove", async ({ request }) => {
    // Guard: outro role não anexa.
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const anexarComoContratante = await request.post(`/api/empreiteiro/candidaturas/${candidaturaId}/anexos`, {
      data: { fileId },
    });
    expect(anexarComoContratante.status(), "contratante não pode anexar em candidatura de empreiteiro").toBe(403);
    await logout(request);

    // 1. Empreiteiro dono anexa o arquivo.
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);

    // Validação: fileId ausente → 400.
    const anexarInvalido = await request.post(`/api/empreiteiro/candidaturas/${candidaturaId}/anexos`, {
      data: {},
    });
    expect(anexarInvalido.status(), "fileId ausente deve retornar 400").toBe(400);

    const anexar = await request.post(`/api/empreiteiro/candidaturas/${candidaturaId}/anexos`, {
      data: { fileId },
    });
    expect(anexar.status(), "anexar arquivo válido deve retornar 201").toBe(201);
    const anexo = (await anexar.json()) as { id: string; fileId: string };
    expect(anexo.id, "anexo deve ter id").toBeTruthy();
    const anexoId = anexo.id;

    // Estado no banco.
    const [anexoDb] = await db
      .select({ id: candidaturaAnexos.id, candidaturaId: candidaturaAnexos.candidaturaId })
      .from(candidaturaAnexos)
      .where(eq(candidaturaAnexos.id, anexoId))
      .limit(1);
    expect(anexoDb?.candidaturaId, "anexo deve estar vinculado à candidatura").toBe(candidaturaId);

    // GET lista o anexo recém-criado.
    const listarAnexos = await request.get(`/api/empreiteiro/candidaturas/${candidaturaId}/anexos`);
    expect(listarAnexos.status()).toBe(200);
    const listaAnexos = (await listarAnexos.json()) as Array<{ id: string }>;
    expect(listaAnexos.some((a) => a.id === anexoId), "anexo deve aparecer na listagem").toBeTruthy();
    await logout(request);

    // 2. Contratante vê a candidatura (com anexo embutido) na obra.
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const candidaturasDaObra = await request.get(`/api/contratante/obras/${obra.obraId}/candidaturas`);
    expect(candidaturasDaObra.status()).toBe(200);
    const listaCandidaturas = (await candidaturasDaObra.json()) as Array<{
      id: string;
      anexos: Array<{ id: string }>;
    }>;
    const candidaturaEncontrada = listaCandidaturas.find((c) => c.id === candidaturaId);
    expect(candidaturaEncontrada, "candidatura E2E deve aparecer na listagem do contratante").toBeTruthy();
    expect(
      candidaturaEncontrada?.anexos.some((a) => a.id === anexoId),
      "anexo deve estar embutido na resposta de candidaturas da obra",
    ).toBeTruthy();
    await logout(request);

    // 3. Empreiteiro remove o anexo.
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const remover = await request.delete(`/api/empreiteiro/candidaturas/${candidaturaId}/anexos/${anexoId}`);
    expect(remover.status(), "remover anexo deve retornar 200").toBe(200);

    const [anexoAposDelete] = await db
      .select({ id: candidaturaAnexos.id })
      .from(candidaturaAnexos)
      .where(eq(candidaturaAnexos.id, anexoId))
      .limit(1);
    expect(anexoAposDelete, "anexo deve ser removido do banco").toBeUndefined();

    const [fileAposDelete] = await db
      .select({ deletedAt: userFiles.deletedAt })
      .from(userFiles)
      .where(eq(userFiles.id, fileId))
      .limit(1);
    expect(fileAposDelete?.deletedAt, "user_files deve ficar soft-deleted").toBeTruthy();

    // Remover de novo → 404 (já não existe mais).
    const removerDeNovo = await request.delete(`/api/empreiteiro/candidaturas/${candidaturaId}/anexos/${anexoId}`);
    expect(removerDeNovo.status(), "remover anexo já removido deve retornar 404").toBe(404);
    await logout(request);
  });

  test("empreiteiro cancela a própria candidatura pendente", async ({ request }) => {
    // Guard: outro empreiteiro (ou role errada) não cancela.
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const cancelarComoContratante = await request.post(`/api/empreiteiro/candidaturas/${candidaturaId}/cancelar`);
    expect(cancelarComoContratante.status(), "contratante não pode cancelar candidatura").toBe(403);
    await logout(request);

    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const cancelar = await request.post(`/api/empreiteiro/candidaturas/${candidaturaId}/cancelar`);
    expect(cancelar.status(), "cancelar própria candidatura pendente deve retornar 200").toBe(200);
    const cancelada = (await cancelar.json()) as { status: string; canceladaPeloEmpreiteiro: boolean };
    expect(cancelada.status, "status vira rejeitada").toBe("rejeitada");
    expect(cancelada.canceladaPeloEmpreiteiro, "flag de cancelamento pelo empreiteiro deve ser true").toBe(true);

    const [apos] = await db
      .select({ status: candidaturas.status, cancelada: candidaturas.canceladaPeloEmpreiteiro })
      .from(candidaturas)
      .where(eq(candidaturas.id, candidaturaId))
      .limit(1);
    expect(apos?.status, "status no banco deve ser rejeitada").toBe("rejeitada");
    expect(apos?.cancelada, "flag no banco deve ser true").toBe(true);

    // Cancelar de novo (já não pendente) → 409.
    const cancelarDeNovo = await request.post(`/api/empreiteiro/candidaturas/${candidaturaId}/cancelar`);
    expect(cancelarDeNovo.status(), "cancelar candidatura já decidida deve retornar 409").toBe(409);
    await logout(request);
  });

  test("contratante rejeita candidatura pendente da própria obra", async ({ request }) => {
    // Guard: role errada não rejeita.
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const rejeitarComoEmpreiteiro = await request.post(`/api/contratante/candidaturas/${candidaturaId}/rejeitar`, {
      data: {},
    });
    expect(rejeitarComoEmpreiteiro.status(), "empreiteiro não pode rejeitar candidatura").toBe(403);
    await logout(request);

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const rejeitar = await request.post(`/api/contratante/candidaturas/${candidaturaId}/rejeitar`, {
      data: { motivo: "Proposta E2E fora do orçamento previsto." },
    });
    expect(rejeitar.status(), "rejeitar candidatura pendente deve retornar 200").toBe(200);
    const rejeitada = (await rejeitar.json()) as { status: string; motivoRejeicao: string };
    expect(rejeitada.status, "status vira rejeitada").toBe("rejeitada");
    expect(rejeitada.motivoRejeicao, "motivo deve ser persistido na resposta").toBeTruthy();

    const [apos] = await db
      .select({ status: candidaturas.status, motivo: candidaturas.motivoRejeicao })
      .from(candidaturas)
      .where(eq(candidaturas.id, candidaturaId))
      .limit(1);
    expect(apos?.status, "status no banco deve ser rejeitada").toBe("rejeitada");
    expect(apos?.motivo, "motivo deve ser persistido no banco").toBeTruthy();

    // Rejeitar de novo → 409 (não mais pendente).
    const rejeitarDeNovo = await request.post(`/api/contratante/candidaturas/${candidaturaId}/rejeitar`, {
      data: {},
    });
    expect(rejeitarDeNovo.status(), "rejeitar candidatura já decidida deve retornar 409").toBe(409);
    await logout(request);
  });

  test("role errada (empreiteiro) não acessa candidaturas do endpoint do contratante → 403", async ({
    request,
  }) => {
    // Não há um segundo perfil contratante fixo no seed compartilhado por este
    // arquivo para exercitar o ramo "contratante não-dono → 404"; esse caminho
    // já é coberto por `obras-candidatura.integration.spec.ts` (guard de
    // ownership em `/aceitar`, mesmo padrão de anti-enumeração). Aqui cobrimos
    // o guard de role do próprio endpoint.
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const res = await request.get(`/api/contratante/obras/${obra.obraId}/candidaturas`);
    expect(res.status(), "role errada (empreiteiro) não acessa candidaturas do contratante").toBe(403);
    await logout(request);
  });
});
