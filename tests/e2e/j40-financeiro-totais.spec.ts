import { test, expect, type APIRequestContext } from "@playwright/test";
import { loginAs, logout, liberarCotaObras as liberarCotaObrasBase } from "./helpers";

/**
 * J40 — Totais financeiros (valorTotal e valorPago) após aceite e quitação.
 *
 * Cobre os itens 14 e 15 da Jornada 40:
 *   14. Aceitar candidatura → obras.valorTotal atualizado com valorProposta.
 *   15. Quitar lançamento → obras.valorPago recomputado via SQL.
 *
 * Também verifica (via browser) que os KPI cards em /contratante/minhas-obras/[id]
 * (seção hero + aba Financeiro) exibem valores não-zero depois da quitação.
 *
 * Pré-requisito: E2E_TEST_AUTH=1 (habilita /api/test/login-as).
 *
 * Todos os testes compartilham uma única obra (test.describe.serial) para
 * respeitar o limite de obrasAbertas=1 do plano free do usuário de seed.
 * A obra de teste é deletada no afterAll para não poluir execuções futuras;
 * se o DELETE falhar (FK de financeiro), a próxima execução libera a cota
 * via liberarCotaObras que marca obras como concluída antes de criar uma nova.
 */

const ADMIN_EMAIL = "admin@xconstrucao.com";
const CONTRATANTE_EMAIL = "joao@construtora.com";
const EMPREITEIRO_EMAIL = "maria@empreiteira.com";

const VALOR_PROPOSTA = 75_000;
const VALOR_LANCAMENTO = 25_000;

// Formato BRL: R$ 75.000 ou R$\u00a075.000
const BRL_NONZERO_REGEX = /R\$[\s\u00a0]?(?!0,00)[0-9]/;

/**
 * Marca todas as obras não-concluídas do contratante como 'concluida' (via admin)
 * para liberar a cota de obrasAbertas do plano free antes do teste criar a obra
 * de validação. O contador de obras usa `status <> 'concluida'`, não visibilidade.
 */
async function liberarCotaObras(request: APIRequestContext) {
  await liberarCotaObrasBase(request, {
    contratanteEmail: CONTRATANTE_EMAIL,
    adminEmail: ADMIN_EMAIL,
  });
}

/**
 * Tenta deletar a obra de teste. Falha silenciosamente se houver FK de financeiro
 * (a próxima execução libera a cota via liberarCotaObras). Best-effort.
 */
async function deletarObra(request: APIRequestContext, obraId: string) {
  try {
    await loginAs(request, CONTRATANTE_EMAIL);
    await request.delete(`/api/obras/${obraId}`);
    await logout(request);
  } catch {
    // cleanup best-effort
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite principal — obra única compartilhada entre todos os casos
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial("J40 Financeiro — valorTotal e valorPago", () => {
  let obraId = "";
  let candidaturaId = "";

  // ── Setup: libera cota, cria obra, candidatura, aceite ────────────────────

  test("setup — libera cota, cria obra, candidatura e aceite", async ({ request }) => {
    const timestamp = Date.now().toString(36);

    await liberarCotaObras(request);

    await loginAs(request, CONTRATANTE_EMAIL);
    const createRes = await request.post("/api/obras", {
      data: {
        nome: `Obra J40 ${timestamp}`,
        endereco: "Rua dos Testes Financeiros, 123",
        visibilidade: "rascunho",
      },
    });
    expect(
      createRes.ok(),
      `Criação da obra deve retornar ok (status: ${createRes.status()})`,
    ).toBeTruthy();
    const obra = await createRes.json();
    obraId = obra.id;

    const publishRes = await request.patch(`/api/obras/${obraId}`, {
      data: {
        nome: `Obra J40 ${timestamp}`,
        endereco: "Rua dos Testes Financeiros, 123",
        visibilidade: "publicada",
        tipo: "Reforma",
        descricao: "Reforma para validação automatizada de totais financeiros J40.",
        cep: "01310-100",
        cidade: "São Paulo",
        uf: "SP",
        modalidade: "empreitada_global",
        materiaisPor: "contratante",
      },
    });
    expect(
      publishRes.ok(),
      `Publicação da obra deve retornar ok (status: ${publishRes.status()})`,
    ).toBeTruthy();
    await logout(request);

    await loginAs(request, EMPREITEIRO_EMAIL);
    const candidaturaRes = await request.post("/api/empreiteiro/candidaturas", {
      data: {
        obraId,
        valorProposta: VALOR_PROPOSTA,
        prazoEstimado: 3,
        descricao: "Proposta J40 para verificar valorTotal após aceite.",
      },
    });
    expect(
      candidaturaRes.ok(),
      `Criação de candidatura deve retornar ok (status: ${candidaturaRes.status()})`,
    ).toBeTruthy();
    const candidatura = await candidaturaRes.json();
    candidaturaId = candidatura.id;
    await logout(request);

    await loginAs(request, CONTRATANTE_EMAIL);
    const aceitarRes = await request.post(
      `/api/contratante/candidaturas/${candidaturaId}/aceitar`,
      { data: {} },
    );
    expect(
      aceitarRes.ok(),
      `Aceite da candidatura deve retornar ok (status: ${aceitarRes.status()})`,
    ).toBeTruthy();
    const aceitarBody = await aceitarRes.json();
    expect(aceitarBody.ok, "Resposta do aceite deve ter ok=true").toBe(true);
    await logout(request);
  });

  // ── Item 14: aceitar candidatura atualiza obras.valorTotal ─────────────────

  test("Item 14 — valorTotal da obra fica igual ao valorProposta aceito", async ({ request }) => {
    expect(obraId, "obraId deve estar preenchido pelo setup").toBeTruthy();

    await loginAs(request, CONTRATANTE_EMAIL);
    const obraRes = await request.get(`/api/obras/${obraId}`);
    expect(obraRes.ok(), "GET /api/obras/[id] deve retornar ok").toBeTruthy();
    const obra = await obraRes.json();

    const valorTotalDb = Number(obra.valorTotal ?? 0);
    expect(
      valorTotalDb,
      `obras.valorTotal (${valorTotalDb}) deve ser igual ao valorProposta (${VALOR_PROPOSTA})`,
    ).toBe(VALOR_PROPOSTA);

    await logout(request);
  });

  // ── Item 15: quitar lançamento atualiza obras.valorPago ────────────────────

  test("Item 15 — valorPago da obra fica igual ao valor do lançamento quitado", async ({
    request,
  }) => {
    expect(obraId, "obraId deve estar preenchido pelo setup").toBeTruthy();

    const today = new Date().toISOString().slice(0, 10);

    await loginAs(request, CONTRATANTE_EMAIL);

    const lancRes = await request.post("/api/financeiro", {
      data: {
        obraId,
        tipo: "saida",
        descricao: "Serviço J40 — verificação valorPago",
        valor: String(VALOR_LANCAMENTO),
        data: today,
        status: "pendente",
        categoria: "Serviços",
      },
    });
    expect(
      lancRes.ok(),
      `Criação do lançamento deve retornar ok (status: ${lancRes.status()})`,
    ).toBeTruthy();
    const lancamento = await lancRes.json();
    const lancamentoId: string = lancamento.id;
    expect(lancamentoId, "Lançamento deve ter um id").toBeTruthy();

    // valorPago deve ser zero antes de quitar
    const obraAntesRes = await request.get(`/api/obras/${obraId}`);
    const obraAntes = await obraAntesRes.json();
    expect(
      Number(obraAntes.valorPago ?? 0),
      "valorPago deve ser zero antes de quitar",
    ).toBe(0);

    // Quita o lançamento via endpoint de pagamentos do contratante
    const quitarRes = await request.post(
      `/api/contratante/pagamentos/${lancamentoId}/quitar`,
      {
        data: {
          metodoPagamento: "PIX",
          dataPagamento: today,
        },
      },
    );
    expect(
      quitarRes.ok(),
      `Quitação deve retornar ok (status: ${quitarRes.status()})`,
    ).toBeTruthy();
    const quitarBody = await quitarRes.json();
    expect(quitarBody.ok, "Resposta da quitação deve ter ok=true").toBe(true);

    // Verifica que obras.valorPago foi recomputado pela SQL subquery em quitarLancamento
    const obraDepoisRes = await request.get(`/api/obras/${obraId}`);
    const obraDepois = await obraDepoisRes.json();
    const valorPagoDb = Number(obraDepois.valorPago ?? 0);
    expect(
      valorPagoDb,
      `obras.valorPago (${valorPagoDb}) deve ser igual ao lançamento quitado (${VALOR_LANCAMENTO})`,
    ).toBe(VALOR_LANCAMENTO);

    await logout(request);
  });

  // ── Verificação de shape de dados (alimenta os KPI cards) ─────────────────

  test("API shape — GET /api/obras/[id] retorna campos corretos para renderizar os KPI cards", async ({
    request,
  }) => {
    expect(obraId, "obraId deve estar preenchido pelo setup").toBeTruthy();

    await loginAs(request, CONTRATANTE_EMAIL);
    const obraRes = await request.get(`/api/obras/${obraId}`);
    expect(obraRes.ok(), "GET /api/obras/[id] deve retornar ok").toBeTruthy();
    const obra = await obraRes.json();

    // TabFinanceiro.tsx mapeia:
    //   "Valor Contratado" ← financeiro.valorContratado = toNumber(obra.valorTotal)
    //   "Total Pago"       ← financeiro.valorPago       = toNumber(obra.valorPago)
    //   "A Liberar"        ← valorTotal - valorPago

    const valorTotal = Number(obra.valorTotal ?? 0);
    const valorPago = Number(obra.valorPago ?? 0);

    expect(valorTotal, `valorTotal deve ser ${VALOR_PROPOSTA}`).toBe(VALOR_PROPOSTA);
    expect(valorPago, `valorPago deve ser ${VALOR_LANCAMENTO}`).toBe(VALOR_LANCAMENTO);

    const saldo = valorTotal - valorPago;
    expect(saldo, `Saldo A Liberar deve ser ${VALOR_PROPOSTA - VALOR_LANCAMENTO}`).toBe(
      VALOR_PROPOSTA - VALOR_LANCAMENTO,
    );

    const pct = Math.round((valorPago / valorTotal) * 100);
    expect(pct, `Percentual de execução (${pct}%) deve ser > 0`).toBeGreaterThan(0);

    await logout(request);
  });

  // ── UI browser: KPI cards na página exibem valores não-zero ───────────────
  //
  // Navega para /contratante/minhas-obras/[id], clica na aba Financeiro e
  // verifica que os cards "Valor Contratado", "Total Pago" e "A Liberar"
  // mostram valores em BRL não-zero.
  //
  // data-testid utilizados (adicionados nesta task):
  //   kpi-valor-pago        — card hero "Valor Pago" (sempre visível na página)
  //   text-valor-pago       — texto do valor dentro do card hero
  //   tab-financeiro        — botão da aba Financeiro
  //   tab-content-financeiro — container da aba (TabFinanceiro)
  //   kpi-value-valor-contratado — valor "Valor Contratado" no TabFinanceiro
  //   kpi-value-total-pago       — valor "Total Pago" no TabFinanceiro
  //   kpi-value-a-liberar        — valor "A Liberar" no TabFinanceiro

  test("UI — KPI cards em /contratante/minhas-obras/[id] exibem valores não-zero após quitação", async ({
    page,
    request,
  }) => {
    expect(obraId, "obraId deve estar preenchido pelo setup").toBeTruthy();

    // 1. Autentica no contexto de browser do Playwright
    const loginRes = await page.request.post("/api/test/login-as", {
      data: { email: CONTRATANTE_EMAIL },
    });
    expect(loginRes.ok(), "Login no browser deve retornar ok").toBeTruthy();

    // 2. Navega para a página de detalhe da obra
    await page.goto(`/contratante/minhas-obras/${obraId}`);
    await expect(page.getByTestId("obra-detalhe-page")).toBeVisible({
      timeout: 15_000,
    });

    // 3. Card hero "Valor Pago" deve exibir valor não-zero já antes da aba
    const heroValorPago = page.getByTestId("kpi-valor-pago");
    await expect(heroValorPago).toBeVisible();
    const heroPagoText = page.getByTestId("text-valor-pago");
    await expect(heroPagoText).toBeVisible();
    const heroPagoStr = await heroPagoText.textContent();
    expect(
      heroPagoStr,
      `Hero "Valor Pago" não deve ser R$ 0,00 — got "${heroPagoStr}"`,
    ).toMatch(BRL_NONZERO_REGEX);

    // 4. Clica na aba Financeiro
    const tabFinanceiro = page.getByTestId("tab-financeiro");
    await expect(tabFinanceiro).toBeVisible();
    await tabFinanceiro.click();

    // 5. Aguarda o conteúdo da aba ser renderizado
    const tabContent = page.getByTestId("tab-content-financeiro");
    await expect(tabContent).toBeVisible({ timeout: 10_000 });

    // 6. "Valor Contratado" deve exibir R$ 75.000 (ou equivalente não-zero)
    const valorContratadoEl = page.getByTestId("kpi-value-valor-contratado");
    await expect(valorContratadoEl).toBeVisible();
    const valorContratadoStr = await valorContratadoEl.textContent();
    expect(
      valorContratadoStr,
      `"Valor Contratado" não deve ser R$ 0,00 — got "${valorContratadoStr}"`,
    ).toMatch(BRL_NONZERO_REGEX);

    // 7. "Total Pago" deve exibir R$ 25.000 (ou equivalente não-zero)
    const totalPagoEl = page.getByTestId("kpi-value-total-pago");
    await expect(totalPagoEl).toBeVisible();
    const totalPagoStr = await totalPagoEl.textContent();
    expect(
      totalPagoStr,
      `"Total Pago" não deve ser R$ 0,00 — got "${totalPagoStr}"`,
    ).toMatch(BRL_NONZERO_REGEX);

    // 8. "A Liberar" deve exibir R$ 50.000 (ou equivalente não-zero, pois VALOR_PROPOSTA > VALOR_LANCAMENTO)
    const aLiberarEl = page.getByTestId("kpi-value-a-liberar");
    await expect(aLiberarEl).toBeVisible();
    const aLiberarStr = await aLiberarEl.textContent();
    expect(
      aLiberarStr,
      `"A Liberar" não deve ser R$ 0,00 — got "${aLiberarStr}"`,
    ).toMatch(BRL_NONZERO_REGEX);

    await page.request.post("/api/auth/logout").catch(() => {});
  });

  // ── Cleanup: remove a obra de teste para liberar cota em próximas execuções

  test.afterAll(async ({ request }) => {
    if (obraId) {
      await deletarObra(request, obraId);
    }
  });
});
