import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import {
  completarPerfilOperacional,
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  uniqueEmail,
  uniqueUsername,
} from "./helpers";

const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };
let cnpjSequence = 1;

function proximoCnpjValido() {
  const base = `11222333${String(cnpjSequence++).padStart(4, "0")}`;
  const digito = (digits: string, pesos: number[]) => {
    const soma = [...digits].reduce(
      (total, digit, index) => total + Number(digit) * pesos[index],
      0,
    );
    const resto = soma % 11;
    return String(resto < 2 ? 0 : 11 - resto);
  };
  const primeiro = digito(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digito(
    `${base}${primeiro}`,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  return `${base}${primeiro}${segundo}`;
}

async function registrarEmpreiteiro(request: APIRequestContext) {
  const email = uniqueEmail("xgestao-browser");
  const response = await request.post("/api/auth/register", {
    data: {
      name: "Empreiteiro navegador xgestão",
      email,
      username: uniqueUsername("xgestao_browser"),
      password: "Xconstr@E2E2026!",
      role: "empreiteiro",
      phone: "11988880000",
      cpfCnpj: proximoCnpjValido(),
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(response.status(), await response.text()).toBeLessThan(300);
  return email;
}

async function concederXGestao(request: APIRequestContext, email: string) {
  await loginAs(request, SEED_ADMIN_EMAIL);
  const usuarios = await request.get(`/api/admin/usuarios?q=${encodeURIComponent(email)}`);
  expect(usuarios.status(), await usuarios.text()).toBe(200);
  const payload = (await usuarios.json()) as { rows: Array<{ id: string }> };
  expect(payload.rows).toHaveLength(1);
  const response = await request.patch(`/api/admin/usuarios/${payload.rows[0].id}`, {
    data: { xgestao: true },
  });
  expect(response.status(), await response.text()).toBe(200);
  await logout(request);
}

async function abrirDialog(page: Page, titulo: string) {
  const dialog = page.getByRole("dialog", { name: titulo });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("xgestão — tarefas e etapas no navegador", () => {
  test("preserva etapas e tarefas após recarregar e quando a API falha", async ({
    page,
    request,
  }) => {
    const email = await registrarEmpreiteiro(request);
    await loginAs(request, email);
    await completarPerfilOperacional(request, "empreiteiro");
    await concederXGestao(request, email);
    await loginAs(request, email);

    const obraResponse = await request.post("/api/xgestao/obras", {
      data: {
        nome: `Obra browser ${Date.now()}`,
        endereco: "Rua da Persistência, 303",
      },
    });
    expect(obraResponse.status(), await obraResponse.text()).toBe(201);
    const obra = (await obraResponse.json()) as { id: string };
    await logout(request);

    const pageLogin = await page.request.post("/api/test/login-as", { data: { email } });
    expect(pageLogin.status(), await pageLogin.text()).toBe(200);
    await page.goto(`/xgestao/obras/${obra.id}`);
    await expect(page.getByTestId("hero-minha-obra")).toBeVisible();

    // Tour guiado: abre sozinho na primeira visita, some ao pular e volta pelo
    // botão de ajuda — o guia antigo não tinha caminho de volta.
    await expect(page.getByTestId("guided-tour")).toBeVisible();
    await page.getByRole("button", { name: "Pular" }).click();
    await expect(page.getByTestId("guided-tour")).toHaveCount(0);

    await page.getByTestId("botao-ajuda").click();
    await expect(page.getByTestId("guided-tour")).toBeVisible();
    await page.getByRole("button", { name: "Pular" }).click();
    await expect(page.getByTestId("guided-tour")).toHaveCount(0);

    await page.getByRole("button", { name: "Cronograma", exact: true }).click();
    await expect(page.getByTestId("card-etapas-j06")).toBeVisible();
    await page.getByTestId("button-nova-etapa").click();
    const novaEtapa = await abrirDialog(page, "Nova etapa");
    await novaEtapa.getByTestId("input-etapa-nome").fill("Fundação");
    await novaEtapa.getByTestId("input-etapa-desc").fill("Preparar a base da obra");
    await novaEtapa.getByTestId("input-etapa-responsavel").fill("Equipe de fundação");

    const etapaCriadaPromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/obras/${obra.id}/etapas`) &&
        response.request().method() === "POST",
    );
    const etapasRecarregadasPromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/obras/${obra.id}/etapas`) &&
        response.request().method() === "GET" &&
        response.status() === 200,
    );
    await novaEtapa.getByTestId("button-criar-etapa").click();
    const etapaCriadaResponse = await etapaCriadaPromise;
    expect(etapaCriadaResponse.status()).toBe(201);
    const etapa = (await etapaCriadaResponse.json()) as { id: string };
    await etapasRecarregadasPromise;
    await expect(page.getByTestId(`etapa-${etapa.id}`)).toBeVisible();

    await page.getByTestId(`button-edit-etapa-${etapa.id}`).click();
    const edicaoEtapa = await abrirDialog(page, "Editar etapa");
    await edicaoEtapa.getByTestId("input-etapa-nome").fill("Fundação estrutural");
    await edicaoEtapa.getByTestId("input-etapa-desc").fill("Base estrutural preparada");
    await edicaoEtapa.getByTestId("input-etapa-responsavel").fill("Equipe estrutural");

    await page.route(`**/api/obras/${obra.id}/etapas/${etapa.id}`, async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ message: "Falha simulada ao salvar etapa" }),
        });
        return;
      }
      await route.continue();
    });
    const falhaEtapaPromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/obras/${obra.id}/etapas/${etapa.id}`) &&
        response.request().method() === "PATCH",
    );
    await edicaoEtapa.getByTestId("button-criar-etapa").click();
    expect((await falhaEtapaPromise).status()).toBe(503);
    await expect(edicaoEtapa).toBeVisible();
    await expect(edicaoEtapa.getByTestId("input-etapa-nome")).toHaveValue("Fundação estrutural");
    await expect(edicaoEtapa.getByTestId("input-etapa-desc")).toHaveValue("Base estrutural preparada");
    await expect(edicaoEtapa.getByTestId("input-etapa-responsavel")).toHaveValue("Equipe estrutural");
    await page.unroute(`**/api/obras/${obra.id}/etapas/${etapa.id}`);
    const etapasPersistidas = await page.request.get(`/api/obras/${obra.id}/etapas`);
    expect(etapasPersistidas.status(), await etapasPersistidas.text()).toBe(200);
    expect(
      ((await etapasPersistidas.json()) as { rows: Array<{ id: string; nome: string }> }).rows,
    ).toContainEqual(expect.objectContaining({ id: etapa.id, nome: "Fundação" }));

    const etapaRenomeadaPromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/obras/${obra.id}/etapas/${etapa.id}`) &&
        response.request().method() === "PATCH",
    );
    await edicaoEtapa.getByTestId("button-criar-etapa").click();
    expect((await etapaRenomeadaPromise).status()).toBe(200);
    await expect(page.getByTestId(`etapa-${etapa.id}`).getByText("Fundação estrutural")).toBeVisible();

    await page.getByRole("button", { name: "Tarefas", exact: true }).click();
    await page.getByRole("button", { name: "Nova Tarefa", exact: true }).click();
    const novaTarefa = await abrirDialog(page, "Nova Tarefa");
    const tarefaTitulo = "Comprar materiais estruturais";
    await novaTarefa.getByTestId("input-tarefa-titulo").fill(tarefaTitulo);
    await novaTarefa.getByTestId("select-tarefa-etapa").selectOption({ label: "Fundação estrutural" });
    await novaTarefa.getByTestId("select-tarefa-responsavel").selectOption("A designar");
    await novaTarefa.getByTestId("input-tarefa-prazo").fill("2026-09-15");
    await novaTarefa.getByTestId("select-tarefa-status").selectOption("em_andamento");
    await novaTarefa.getByTestId("radio-tarefa-prioridade-alta").click();
    await novaTarefa.getByTestId("input-tarefa-progresso").fill("65");
    await novaTarefa.getByTestId("input-tarefa-descricao").fill("Comprar cimento e aço para a fundação.");

    const tarefaCriadaPromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/obras/${obra.id}/tarefas`) &&
        response.request().method() === "POST",
    );
    await novaTarefa.getByRole("button", { name: "Criar tarefa" }).click();
    const tarefaCriadaResponse = await tarefaCriadaPromise;
    expect(tarefaCriadaResponse.status()).toBe(201);
    expect(await tarefaCriadaResponse.json()).toMatchObject({
      titulo: tarefaTitulo,
      etapa: "Fundação estrutural",
      responsavel: "A designar",
      prazo: "2026-09-15",
      status: "em_andamento",
      prioridade: "alta",
      progresso: 65,
      descricao: "Comprar cimento e aço para a fundação.",
    });
    await expect(page.getByTestId("task-manager-section").getByText(tarefaTitulo, { exact: true })).toBeVisible();

    const recarga = await page.goto(
      `/api/test/login-as?email=${encodeURIComponent(email)}&to=${encodeURIComponent(`/xgestao/obras/${obra.id}`)}`,
    );
    expect(recarga?.status()).toBe(200);
    await expect(page.getByTestId("hero-minha-obra")).toBeVisible();
    const taskManager = page.getByTestId("task-manager-section");
    await expect(taskManager.getByText(tarefaTitulo, { exact: true })).toBeVisible();
    await expect(
      taskManager.getByRole("heading", { name: /^Fundação estrutural 0\/1 completas$/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cronograma", exact: true }).click();
    await expect(page.getByTestId(`etapa-${etapa.id}`).getByText("Fundação estrutural")).toBeVisible();
    await page.getByRole("button", { name: "Tarefas", exact: true }).click();

    await page.getByRole("button", { name: "Nova Tarefa", exact: true }).click();
    const tarefaComFalha = await abrirDialog(page, "Nova Tarefa");
    const tituloPreservado = "Tarefa digitada deve permanecer";
    const descricaoPreservada = "Observação que não pode desaparecer após a falha.";
    await tarefaComFalha.getByTestId("input-tarefa-titulo").fill(tituloPreservado);
    await tarefaComFalha.getByTestId("select-tarefa-etapa").selectOption({ label: "Fundação estrutural" });
    await tarefaComFalha.getByTestId("select-tarefa-responsavel").selectOption("A designar");
    await tarefaComFalha.getByTestId("input-tarefa-prazo").fill("2026-09-20");
    await tarefaComFalha.getByTestId("select-tarefa-status").selectOption("em_andamento");
    await tarefaComFalha.getByTestId("radio-tarefa-prioridade-baixa").click();
    await tarefaComFalha.getByTestId("input-tarefa-progresso").fill("42");
    await tarefaComFalha.getByTestId("input-tarefa-descricao").fill(descricaoPreservada);

    await page.route(`**/api/obras/${obra.id}/tarefas`, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ message: "Falha simulada ao salvar tarefa" }),
        });
        return;
      }
      await route.continue();
    });
    const falhaTarefaPromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/obras/${obra.id}/tarefas`) &&
        response.request().method() === "POST",
    );
    await tarefaComFalha.getByRole("button", { name: "Criar tarefa" }).click();
    expect((await falhaTarefaPromise).status()).toBe(503);
    await expect(tarefaComFalha).toBeVisible();
    await expect(tarefaComFalha.getByTestId("input-tarefa-titulo")).toHaveValue(tituloPreservado);
    await expect(tarefaComFalha.getByTestId("select-tarefa-etapa")).toHaveValue("Fundação estrutural");
    await expect(tarefaComFalha.getByTestId("select-tarefa-responsavel")).toHaveValue("A designar");
    await expect(tarefaComFalha.getByTestId("input-tarefa-prazo")).toHaveValue("2026-09-20");
    await expect(tarefaComFalha.getByTestId("select-tarefa-status")).toHaveValue("em_andamento");
    await expect(
      tarefaComFalha.getByTestId("radio-tarefa-prioridade-baixa").locator("input"),
    ).toBeChecked();
    await expect(tarefaComFalha.getByTestId("input-tarefa-progresso")).toHaveValue("42");
    await expect(tarefaComFalha.getByTestId("input-tarefa-descricao")).toHaveValue(descricaoPreservada);
    await page.unroute(`**/api/obras/${obra.id}/tarefas`);
  });

  test("mascara datas de ocorrência, valida datas inválidas e preserva edição", async ({
    page,
    request,
  }) => {
    const email = await registrarEmpreiteiro(request);
    await loginAs(request, email);
    await completarPerfilOperacional(request, "empreiteiro");
    await concederXGestao(request, email);
    await loginAs(request, email);

    const obraResponse = await request.post("/api/xgestao/obras", {
      data: {
        nome: `Obra datas ${Date.now()}`,
        endereco: "Rua das Datas, 305",
      },
    });
    expect(obraResponse.status(), await obraResponse.text()).toBe(201);
    const obra = (await obraResponse.json()) as { id: string };
    await logout(request);

    const pageLogin = await page.request.post("/api/test/login-as", { data: { email } });
    expect(pageLogin.status(), await pageLogin.text()).toBe(200);
    await page.goto(`/xgestao/obras/${obra.id}`);
    await expect(page.getByTestId("hero-minha-obra")).toBeVisible();
    const tour = page.getByTestId("guided-tour");
    if (await tour.count()) await page.getByRole("button", { name: "Pular" }).click();

    await page.getByRole("button", { name: "Ocorrências", exact: true }).click();
    await page.getByRole("button", { name: "Reportar Problema", exact: true }).click();
    const dialog = await abrirDialog(page, "Reportar problema");
    await dialog.getByRole("textbox", { name: /Título/ }).fill("Atraso no fornecedor");
    await dialog.getByRole("textbox", { name: /Descrição/ }).fill("O material da etapa ainda não foi entregue.");
    await dialog.getByRole("textbox", { name: /Responsável/ }).fill("Equipe de compras");

    const dataAbertura = dialog.getByTestId("input-data-abertura-ocorrencia");
    const prazo = dialog.getByTestId("input-prazo-ocorrencia");
    await dataAbertura.fill("10062025");
    await expect(dataAbertura).toHaveValue("10/06/2025");
    await dataAbertura.fill("10/06/2025");
    await expect(dataAbertura).toHaveValue("10/06/2025");

    // Uma data impossível aparece formatada, mas bloqueia o envio.
    await prazo.fill("31022025");
    await expect(prazo).toHaveValue("31/02/2025");
    await dialog.getByRole("button", { name: "Reportar problema" }).click();
    await expect(dialog.getByText("Informe uma data válida (DD/MM/AAAA)")).toBeVisible();
    await expect(dialog).toBeVisible();

    // O prazo opcional pode ficar vazio; a máscara continua ativa na edição.
    await prazo.fill("");
    await dialog.getByRole("button", { name: "Reportar problema" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText("Atraso no fornecedor", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Atualizar status", exact: true }).click();
    const editDialog = await abrirDialog(page, "Editar ocorrência");
    await expect(editDialog.getByTestId("input-data-abertura-ocorrencia")).toHaveValue("10/06/2025");
    await expect(editDialog.getByTestId("input-prazo-ocorrencia")).toHaveValue("");
    await editDialog.getByTestId("input-prazo-ocorrencia").fill("15062025");
    await expect(editDialog.getByTestId("input-prazo-ocorrencia")).toHaveValue("15/06/2025");
    await editDialog.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Prazo: 15/06/2025", { exact: true })).toBeVisible();
  });

  test("edição reflete nos detalhes da obra e no link público", async ({ page, request }) => {
    const email = await registrarEmpreiteiro(request);
    await loginAs(request, email);
    await completarPerfilOperacional(request, "empreiteiro");
    await concederXGestao(request, email);
    await loginAs(request, email);

    const obraResponse = await request.post("/api/xgestao/obras", {
      data: { nome: `Obra detalhes ${Date.now()}`, endereco: "Rua dos Detalhes, 45" },
    });
    expect(obraResponse.status(), await obraResponse.text()).toBe(201);
    const obra = (await obraResponse.json()) as { id: string };
    await logout(request);

    const pageLogin = await page.request.post("/api/test/login-as", { data: { email } });
    expect(pageLogin.status(), await pageLogin.text()).toBe(200);

    // Preenche pela própria tela de edição — é o caminho que o usuário faz.
    await page.goto(`/xgestao/obras/${obra.id}/editar`);
    await expect(page.getByTestId("xgestao-editar-obra-page")).toBeVisible();
    await page.getByRole("button", { name: "Pular" }).click();

    await page.locator("#obra-tipo").fill("Reforma comercial");
    await page.locator("#obra-descricao").fill("Escopo detalhado da execução.");
    await page.locator("#obra-area").fill("250");
    await page.locator("#obra-cidade").fill("Campinas");
    await page.locator("#obra-uf").fill("SP");
    await page.locator("#obra-numero").fill("45");
    await page.locator("#obra-status").selectOption("pausada");

    const salvo = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/obras/${obra.id}`) &&
        response.request().method() === "PATCH",
    );
    await page.getByTestId("xgestao-salvar-obra").click();
    expect((await salvo).status()).toBe(200);

    // O que foi editado precisa reaparecer no console — era exatamente o que
    // sumia: descrição e área não voltavam, e "Pausada" virava "Com pendências".
    await page.goto(`/xgestao/obras/${obra.id}`);
    const detalhes = page.getByTestId("detalhes-obra-card");
    await expect(detalhes).toBeVisible();
    await expect(detalhes).toContainText("Escopo detalhado da execução.");
    await expect(detalhes).toContainText("250 m²");
    await expect(detalhes).toContainText("Reforma comercial");
    await expect(page.getByTestId("badge-status")).toHaveText("Pausada");

    // E o mesmo conteúdo precisa chegar ao cliente pelo link público.
    const link = await page.request.post(`/api/xgestao/obras/${obra.id}/share`);
    expect(link.status(), await link.text()).toBe(201);
    const { share } = (await link.json()) as { share: { path: string } };

    const anonima = await page.context().browser()!.newContext();
    const publica = await anonima.newPage();
    await publica.goto(share.path);
    await expect(publica.getByTestId("obra-publica-status")).toHaveText("Pausada");
    // A seção de detalhes fica fora do `obra-publica-shell`, que marca só o hero.
    await expect(publica.locator("body")).toContainText("Escopo detalhado da execução.");
    await expect(publica.locator("body")).toContainText("250 m²");
    await expect(publica.locator("body")).toContainText("Reforma comercial");
    await anonima.close();
  });
});