import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import {
  completarPerfilOperacional,
  fetchCapturedEmails,
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
  test("presets da equipe mudam imediatamente as abas, o financeiro e a leitura por obra", async ({
    page,
    request,
    browser,
  }, testInfo) => {
    const dono = await registrarEmpreiteiro(request);
    await loginAs(request, dono);
    await completarPerfilOperacional(request, "empreiteiro");
    await concederXGestao(request, dono);
    await loginAs(request, dono);

    const nomeA = `Obra editável ${Date.now()}`;
    const nomeB = `Obra leitura ${Date.now()}`;
    const criar = async (nome: string) => {
      const response = await request.post("/api/xgestao/obras", {
        data: { nome, endereco: "Rua das Permissões, 10" },
      });
      expect(response.status(), await response.text()).toBe(201);
      return ((await response.json()) as { id: string }).id;
    };
    const obraA = await criar(nomeA);
    const obraB = await criar(nomeB);
    const linkResponse = await request.post(`/api/xgestao/obras/${obraB}/share`, {
      data: { nome: "Cliente leitura" },
    });
    expect(linkResponse.status(), await linkResponse.text()).toBe(201);
    const linkB = (await linkResponse.json()) as { share: { id: string; path: string } };
    const etapa = await request.post(`/api/obras/${obraB}/etapas`, {
      data: { nome: "Etapa visível somente para leitura" },
    });
    expect(etapa.status(), await etapa.text()).toBe(201);
    const material = await request.post(`/api/obras/${obraA}/financeiro`, {
      data: { tipo: "saida", categoria: "material", descricao: "Material privado", valor: 99, data: "2026-01-04" },
    });
    expect(material.status(), await material.text()).toBe(201);
    const maoDeObra = await request.post(`/api/obras/${obraA}/financeiro`, {
      data: { tipo: "saida", categoria: "mao_de_obra", descricao: "Pagamento da equipe", valor: 125, data: "2026-01-04" },
    });
    expect(maoDeObra.status(), await maoDeObra.text()).toBe(201);
    await logout(request);

    expect((await page.request.post("/api/test/login-as", { data: { email: dono } })).status()).toBe(200);
    await page.goto("/xgestao/equipe");
    await expect(page.getByTestId("xgestao-equipe-page")).toBeVisible();
    await page.getByRole("button", { name: /Convidar (primeira )?pessoa/ }).first().click();
    const convite = page.getByRole("dialog", { name: "Convidar pessoa" });
    const membroEmail = uniqueEmail("xgestao-browser-member");
    await convite.locator("#member-name").fill("Membro navegador");
    await convite.locator("#member-email").fill(membroEmail);
    await convite.getByText(nomeA, { exact: true }).click();
    await convite.getByText(nomeB, { exact: true }).click();
    await convite.getByRole("combobox", { name: `Permissão para ${nomeA}` }).selectOption("editar");
    const enviado = page.waitForResponse((res) => res.url().endsWith("/api/xgestao/membros") && res.request().method() === "POST");
    await convite.getByRole("button", { name: "Enviar convite" }).click();
    expect((await enviado).status()).toBe(201);
    await expect(convite).toHaveCount(0);

    const emails = await fetchCapturedEmails(page.request, membroEmail);
    const setupUrl = emails.find((email) => email.meta?.kind === "password-setup")?.meta?.setupUrl;
    expect(typeof setupUrl).toBe("string");
    const setup = await page.request.post("/api/auth/definir-senha-inicial", {
      data: {
        token: new URL(setupUrl as string).searchParams.get("token"),
        password: "Xconstr@E2E2026!",
        confirmPassword: "Xconstr@E2E2026!",
      },
    });
    expect(setup.status(), await setup.text()).toBe(200);

    const editarPermissoes = async (preset: string) => {
      await page.getByRole("button", { name: "Permissões" }).click();
      const dialog = page.getByRole("dialog", { name: "Permissões de Membro navegador" });
      await expect(dialog).toBeVisible();
      await dialog.locator("#member-access-preset").selectOption(preset);
      const salvo = page.waitForResponse((res) =>
        res.url().includes("/api/xgestao/membros/") && res.request().method() === "PATCH");
      await dialog.getByRole("button", { name: "Salvar permissões" }).click();
      expect((await salvo).status()).toBe(200);
      await expect(dialog).toHaveCount(0);
    };
    await editarPermissoes("mao_de_obra");
    await expect(page.getByText("Áreas: Financeiro · Financeiro: Mão de obra")).toBeVisible();

    const membroContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
      const membro = await membroContext.newPage();
      expect((await membro.request.post("/api/test/login-as", { data: { email: membroEmail } })).status()).toBe(200);
      const abas = membro.locator('[data-tour="abas-obra"]');
      await membro.goto(`/xgestao/obras/${obraA}`);
      await expect(membro.getByTestId("hero-minha-obra")).toBeVisible();
      const legal = membro.getByRole("dialog", { name: "Atualizamos nossos documentos" });
      if (await legal.isVisible()) await legal.getByRole("button", { name: "Agora não" }).click();
      const tour = membro.getByTestId("guided-tour");
      if (await tour.isVisible()) await tour.getByRole("button", { name: "Pular" }).click();
      await expect(membro.getByRole("link", { name: "Equipe", exact: true })).toHaveCount(0);
      await membro.getByRole("button", { name: "Abrir menu da conta" }).click();
      await expect(membro.getByRole("menuitem", { name: "Equipe" })).toHaveCount(0);
      await membro.keyboard.press("Escape");
      await expect(abas.getByRole("button", { name: "Financeiro" })).toBeVisible();
      for (const nome of ["Etapas", "Cronograma", "Diário", "Fotos", "Ocorrências", "Documentos"]) {
        await expect(abas.getByRole("button", { name: nome, exact: true })).toHaveCount(0);
      }
      await abas.getByRole("button", { name: "Financeiro" }).click();
      await expect(membro.getByText("Acesso limitado aos lançamentos de saída da categoria Mão de obra.")).toBeVisible();
      await expect(membro.getByText("Pagamento da equipe", { exact: true })).toBeVisible();
      await expect(membro.getByText("Material privado", { exact: true })).toHaveCount(0);
      await expect(membro.getByTestId("button-nova-entrada")).toHaveCount(0);
      await expect(membro.getByTestId("button-nova-saida")).toBeVisible();
      await expect(membro.getByTestId("detalhes-link-publico")).toHaveCount(0);
      // A navegação pode renovar a sessão com cookie Secure; reemita o cookie
      // HTTP de teste antes das chamadas diretas pelo APIRequestContext.
      expect((await membro.request.post("/api/test/login-as", { data: { email: membroEmail } })).status()).toBe(200);
      const linksRestritos = await membro.request.get(`/api/xgestao/obras/${obraA}/share`);
      expect(linksRestritos.status()).toBe(404);

      // O membro mantém a mesma sessão; a próxima navegação deve ler o preset salvo.
      await editarPermissoes("encarregado");
      await membro.reload();
      await expect(membro.getByTestId("hero-minha-obra")).toBeVisible();
      if (await legal.isVisible()) await legal.getByRole("button", { name: "Agora não" }).click();
      await expect(abas.getByRole("button", { name: "Financeiro" })).toHaveCount(0);
      await expect(abas.getByRole("button", { name: "Etapas" })).toBeVisible();
      await expect(abas.getByRole("button", { name: "Diário" })).toBeVisible();
      await abas.getByRole("button", { name: "Etapas" }).click();
      await expect(membro.getByTestId("button-nova-etapa")).toBeVisible();

      await editarPermissoes("completo");
      await membro.goto(`/xgestao/obras/${obraB}`);
      await expect(membro.getByTestId("hero-minha-obra")).toBeVisible();
      if (await legal.isVisible()) await legal.getByRole("button", { name: "Agora não" }).click();
      await expect(abas.getByRole("button", { name: "Financeiro" })).toBeVisible();
      await abas.getByRole("button", { name: "Etapas" }).click();
      await expect(membro.getByText("Etapa visível somente para leitura")).toBeVisible();
      await expect(membro.getByTestId("button-nova-etapa")).toHaveCount(0);
      await expect(membro.getByTestId(/^input-progresso-/)).toHaveCount(0);
      await abas.getByRole("button", { name: "Diário" }).click();
      await expect(membro.getByTestId("input-diario-texto")).toHaveCount(0);
      await abas.getByRole("button", { name: "Checklists" }).click();
      await expect(membro.getByRole("button", { name: "Novo Checklist" })).toHaveCount(0);
      await abas.getByRole("button", { name: "Documentos" }).click();
      await expect(membro.getByRole("button", { name: "Enviar Documento" })).toHaveCount(0);
      await abas.getByRole("button", { name: "Financeiro" }).click();
      await expect(membro.getByTestId("button-nova-saida")).toHaveCount(0);
      await expect(membro.getByTestId("detalhes-editar-informacoes")).toHaveCount(0);
      await expect(membro.getByTestId("detalhes-excluir-obra")).toHaveCount(0);
      expect((await membro.request.post("/api/test/login-as", { data: { email: membroEmail } })).status()).toBe(200);
      const lista = await membro.request.get(`/api/xgestao/obras/${obraB}/share`);
      expect(lista.status(), await lista.text()).toBe(200);
      expect(await lista.json()).toMatchObject({
        shares: [{ id: linkB.share.id, path: linkB.share.path }],
      });
      await expect(membro.getByTestId("detalhes-link-publico")).toBeVisible();
      await expect(membro.getByTestId(`detalhes-link-${linkB.share.id}`)).toContainText("Cliente leitura");
      await expect(membro.getByTestId("detalhes-link-url")).toHaveValue(
        new RegExp(`${linkB.share.path}$`),
      );
      await expect(membro.getByTestId("detalhes-link-gerenciar")).toHaveCount(0);

      const criarLink = await membro.request.post(`/api/xgestao/obras/${obraB}/share`, {
        data: { nome: "Não permitido" },
      });
      expect(criarLink.status()).toBe(404);
      const alterarLink = await membro.request.patch(`/api/xgestao/obras/${obraB}/share/${linkB.share.id}`, {
        data: { nome: "Não permitido" },
      });
      expect(alterarLink.status()).toBe(404);
      const revogarLink = await membro.request.delete(`/api/xgestao/obras/${obraB}/share/${linkB.share.id}`);
      expect(revogarLink.status()).toBe(404);
      const linkPreservado = await membro.request.get(`/api/xgestao/obras/${obraB}/share`);
      expect(await linkPreservado.json()).toMatchObject({ shares: [{ id: linkB.share.id }] });

      // Retirar apenas Links mantém a concessão visualizar para a obra B e
      // não revoga a capability pública já entregue ao cliente.
      await page.getByRole("button", { name: "Permissões" }).click();
      const dialogLinks = page.getByRole("dialog", { name: "Permissões de Membro navegador" });
      await expect(dialogLinks.locator("#member-access-preset")).toHaveValue("completo");
      await expect(dialogLinks.getByRole("checkbox", { name: "Links públicos" })).toBeChecked();
      await dialogLinks.getByRole("checkbox", { name: "Links públicos" }).uncheck();
      await expect(dialogLinks.getByRole("checkbox", { name: "Financeiro" })).toBeChecked();
      const salvoSemLinks = page.waitForResponse((res) =>
        res.url().includes("/api/xgestao/membros/") && res.request().method() === "PATCH");
      await dialogLinks.getByRole("button", { name: "Salvar permissões" }).click();
      expect((await salvoSemLinks).status()).toBe(200);
      await expect(dialogLinks).toHaveCount(0);

      // A mesma sessão perde a leitura da lista antes de qualquer reload.
      const listaSemLinks = await membro.request.get(`/api/xgestao/obras/${obraB}/share`);
      expect(listaSemLinks.status(), await listaSemLinks.text()).toBe(404);
      await membro.reload();
      await expect(membro.getByTestId("hero-minha-obra")).toBeVisible();
      if (await legal.isVisible()) await legal.getByRole("button", { name: "Agora não" }).click();
      await expect(abas.getByRole("button", { name: "Financeiro" })).toBeVisible();
      await expect(membro.getByTestId("detalhes-link-publico")).toHaveCount(0);

      // Com Links restaurado, a revogação somente da obra B deve ser uma
      // transição independente da permissão por área e da sessão do membro.
      await page.getByRole("button", { name: "Permissões" }).click();
      const dialogObras = page.getByRole("dialog", { name: "Permissões de Membro navegador" });
      await dialogObras.getByRole("checkbox", { name: "Links públicos" }).check();
      const acessoA = dialogObras.getByRole("checkbox", { name: nomeA, exact: true });
      const acessoB = dialogObras.getByRole("checkbox", { name: nomeB, exact: true });
      await expect(acessoA).toBeChecked();
      await expect(acessoB).toBeChecked();
      await expect(dialogObras.getByRole("combobox", { name: `Permissão para ${nomeB}` })).toHaveValue("visualizar");
      const salvoComLinks = page.waitForResponse((res) =>
        res.url().includes("/api/xgestao/membros/") && res.request().method() === "PATCH");
      await dialogObras.getByRole("button", { name: "Salvar permissões" }).click();
      expect((await salvoComLinks).status()).toBe(200);
      await expect(dialogObras).toHaveCount(0);
      // O reload anterior pode substituir o cookie HTTP de teste por um Secure.
      // Reponha-o antes da transição sob teste; depois da revogação, não faça login novamente.
      expect((await membro.request.post("/api/test/login-as", { data: { email: membroEmail } })).status()).toBe(200);
      const listaRestaurada = await membro.request.get(`/api/xgestao/obras/${obraB}/share`);
      expect(listaRestaurada.status(), await listaRestaurada.text()).toBe(200);
      expect(await listaRestaurada.json()).toMatchObject({ shares: [{ id: linkB.share.id }] });

      await page.getByRole("button", { name: "Permissões" }).click();
      const dialogRevogacao = page.getByRole("dialog", { name: "Permissões de Membro navegador" });
      await expect(dialogRevogacao.getByRole("checkbox", { name: "Links públicos" })).toBeChecked();
      await dialogRevogacao.getByRole("checkbox", { name: nomeB, exact: true }).uncheck();
      await expect(dialogRevogacao.getByRole("checkbox", { name: nomeA, exact: true })).toBeChecked();
      const salvoSemObra = page.waitForResponse((res) =>
        res.url().includes("/api/xgestao/membros/") && res.request().method() === "PATCH");
      await dialogRevogacao.getByRole("button", { name: "Salvar permissões" }).click();
      expect((await salvoSemObra).status()).toBe(200);
      await expect(dialogRevogacao).toHaveCount(0);

      const listaSemObra = await membro.request.get(`/api/xgestao/obras/${obraB}/share`);
      expect(listaSemObra.status(), await listaSemObra.text()).toBe(404);
      const outraObraPreservada = await membro.request.get(`/api/xgestao/obras/${obraA}/share`);
      expect(outraObraPreservada.status(), await outraObraPreservada.text()).toBe(200);
      const obraRevogada = await membro.reload();
      expect(obraRevogada?.status()).toBe(404);
      await expect(membro.getByTestId("detalhes-link-publico")).toHaveCount(0);
      await expect(membro.getByTestId(`detalhes-link-${linkB.share.id}`)).toHaveCount(0);

      const destinatarioContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
      try {
        const destinatario = await destinatarioContext.newPage();
        const publica = await destinatario.goto(linkB.share.path);
        expect(publica?.status()).toBe(200);
        await expect(destinatario.getByTestId("obra-publica-shell")).toBeVisible();
        await expect(destinatario.getByTestId("obra-publica-shell")).toContainText(nomeB);
      } finally {
        await destinatarioContext.close();
      }
    } finally {
      await membroContext.close();
    }
  });

  test("revogar membro remove acesso à obra sem desativar o link público do cliente", async ({
    page,
    request,
    browser,
  }, testInfo) => {
    const dono = await registrarEmpreiteiro(request);
    await loginAs(request, dono);
    await completarPerfilOperacional(request, "empreiteiro");
    await concederXGestao(request, dono);
    await loginAs(request, dono);

    const nomeObra = `Obra compartilhada ${Date.now()}`;
    const criada = await request.post("/api/xgestao/obras", {
      data: { nome: nomeObra, endereco: "Rua do Cliente, 10" },
    });
    expect(criada.status(), await criada.text()).toBe(201);
    const obraId = ((await criada.json()) as { id: string }).id;
    const criadoLink = await request.post(`/api/xgestao/obras/${obraId}/share`, {
      data: { nome: "Link enviado ao cliente" },
    });
    expect(criadoLink.status(), await criadoLink.text()).toBe(201);
    const { share } = (await criadoLink.json()) as { share: { id: string; path: string } };
    await logout(request);

    expect((await page.request.post("/api/test/login-as", { data: { email: dono } })).status()).toBe(200);
    await page.goto("/xgestao/equipe");
    await expect(page.getByTestId("xgestao-equipe-page")).toBeVisible();
    await page.getByRole("button", { name: /Convidar (primeira )?pessoa/ }).first().click();
    const convite = page.getByRole("dialog", { name: "Convidar pessoa" });
    const membroEmail = uniqueEmail("xgestao-browser-revoked-member");
    await convite.locator("#member-name").fill("Membro revogado");
    await convite.locator("#member-email").fill(membroEmail);
    await convite.getByText(nomeObra, { exact: true }).click();
    const enviado = page.waitForResponse((res) =>
      res.url().endsWith("/api/xgestao/membros") && res.request().method() === "POST");
    await convite.getByRole("button", { name: "Enviar convite" }).click();
    expect((await enviado).status()).toBe(201);
    await expect(convite).toHaveCount(0);

    const emails = await fetchCapturedEmails(page.request, membroEmail);
    const setupUrl = emails.find((email) => email.meta?.kind === "password-setup")?.meta?.setupUrl;
    expect(typeof setupUrl).toBe("string");
    const setup = await page.request.post("/api/auth/definir-senha-inicial", {
      data: {
        token: new URL(setupUrl as string).searchParams.get("token"),
        password: "Xconstr@E2E2026!",
        confirmPassword: "Xconstr@E2E2026!",
      },
    });
    expect(setup.status(), await setup.text()).toBe(200);

    const membroContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    const destinatarioContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
      const membro = await membroContext.newPage();
      expect((await membro.request.post("/api/test/login-as", { data: { email: membroEmail } })).status()).toBe(200);
      await membro.goto(`/xgestao/obras/${obraId}`);
      await expect(membro.getByTestId("hero-minha-obra")).toBeVisible();
      const legal = membro.getByRole("dialog", { name: "Atualizamos nossos documentos" });
      if (await legal.isVisible()) await legal.getByRole("button", { name: "Agora não" }).click();
      const tour = membro.getByTestId("guided-tour");
      if (await tour.isVisible()) await tour.getByRole("button", { name: "Pular" }).click();
      await expect(membro.getByTestId(`detalhes-link-${share.id}`)).toContainText("Link enviado ao cliente");
      // A navegação pode trocar o cookie HTTP de teste por um Secure.
      // Reponha-o antes da transição; não refaça login depois da revogação.
      expect((await membro.request.post("/api/test/login-as", { data: { email: membroEmail } })).status()).toBe(200);
      const listaAntes = await membro.request.get(`/api/xgestao/obras/${obraId}/share`);
      expect(listaAntes.status(), await listaAntes.text()).toBe(200);
      expect(await listaAntes.json()).toMatchObject({ shares: [{ id: share.id, path: share.path }] });

      const destinatario = await destinatarioContext.newPage();
      const antes = await destinatario.goto(share.path);
      expect(antes?.status()).toBe(200);
      await expect(destinatario.getByTestId("obra-publica-shell")).toContainText(nomeObra);

      // Revoga a participação inteira pela tela de Equipe, não a concessão
      // de uma obra nem o próprio link público.
      page.once("dialog", (dialog) => dialog.accept());
      const revogado = page.waitForResponse((res) =>
        /\/api\/xgestao\/membros\/[^/]+$/.test(new URL(res.url()).pathname) &&
        res.request().method() === "DELETE");
      await page.getByRole("button", { name: "Revogar", exact: true }).click();
      expect((await revogado).status()).toBe(200);
      await expect(page.getByText("Acesso revogado", { exact: true })).toBeVisible();

      const listaDepois = await membro.request.get(`/api/xgestao/obras/${obraId}/share`);
      expect(listaDepois.status(), await listaDepois.text()).toBe(403);
      await membro.reload();
      await expect(membro).toHaveURL(/\/login\?perfil=xgestao/);
      await expect(membro.getByTestId("hero-minha-obra")).toHaveCount(0);
      await expect(membro.getByTestId(`detalhes-link-${share.id}`)).toHaveCount(0);

      const depois = await destinatario.reload();
      expect(depois?.status()).toBe(200);
      await expect(destinatario.getByTestId("obra-publica-shell")).toContainText(nomeObra);
    } finally {
      await membroContext.close();
      await destinatarioContext.close();
    }
  });

  test("cadastro evita envio duplicado e preserva dados durante o bloqueio", async ({
    page,
  }) => {
    let registerRequests = 0;
    await page.route("**/api/auth/register", async (route) => {
      registerRequests += 1;
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        headers: { "Retry-After": "120" },
        body: JSON.stringify({
          message: "Muitas tentativas. Tente novamente em 2 minutos.",
          retryAfterSeconds: 120,
          retryAt: new Date(Date.now() + 120_000).toISOString(),
        }),
      });
    });

    await page.goto("/cadastro?perfil=xgestao");
    await page.getByTestId("input-name").fill("Pessoa Cadastro");
    await page.getByTestId("input-email").fill("pessoa.cadastro@example.com");
    await page.getByTestId("input-username").fill("pessoa_cadastro");
    await page.getByTestId("input-phone").fill("11999990000");
    await page.getByTestId("input-password").fill("SenhaForte#2026");
    await page.getByTestId("checkbox-terms").check();

    // requestSubmit duas vezes no mesmo tick reproduz clique/Enter concorrentes
    // antes que o estado visual consiga desabilitar o botão.
    await page.locator("form").evaluate((form) => {
      (form as HTMLFormElement).requestSubmit();
      (form as HTMLFormElement).requestSubmit();
    });

    await expect(
      page.getByText("Muitas tentativas. Tente novamente em 2 minutos.", { exact: true }),
    ).toBeVisible();
    expect(registerRequests).toBe(1);
    await expect(page.getByTestId("button-register")).toBeDisabled();
    await expect(page.getByTestId("button-register")).toHaveText("Tente novamente em 2 minutos");
    await expect(page.getByTestId("input-email")).toHaveValue("pessoa.cadastro@example.com");
    await expect(page.getByTestId("input-password")).toHaveValue("SenhaForte#2026");
  });

  test("preserva etapas e o percentual manual após recarregar", async ({
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

    // A aba é "Etapas": `card-etapas-j06` é o cadastro de etapas. "Cronograma"
    // é a aba vizinha, que desenha o Gantt (`gantt-svg`) — clicar nela e
    // esperar o card de etapas passava só porque o teste nunca chegou aqui
    // verde. Desde a XG10 são duas abas distintas.
    await page.getByRole("button", { name: "Etapas", exact: true }).click();
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

    /*
     * XG23 — o trecho de tarefas saiu daqui.
     *
     * Este spec roda em contexto xgestão, e a aba Tarefas não existe mais lá:
     * "exclui essa aba atualizações, exclui essa aba tarefas". As rotas
     * `/api/obras/[id]/tarefas/**` continuam cobertas no nível de integração,
     * onde o marketplace, o contratante e o admin as usam.
     *
     * No lugar entra o que substituiu as tarefas: a porcentagem manual da
     * etapa. É o gesto que o cliente pediu — "uma barrinha de cursor ali
     * mesmo" — e o que ele exige de verdade é persistência, então o assert
     * que importa vem depois do F5.
     */
    const inputProgresso = page.getByTestId(`input-progresso-${etapa.id}`);
    await expect(inputProgresso).toBeVisible();

    const progressoPatchPromise = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/obras/${obra.id}/etapas/${etapa.id}`) &&
        response.request().method() === "PATCH",
    );
    await inputProgresso.fill("45");
    await inputProgresso.blur();
    expect((await progressoPatchPromise).status()).toBe(200);

    await page.reload();
    await page.getByRole("button", { name: "Etapas", exact: true }).click();
    await expect(page.getByTestId(`input-progresso-${etapa.id}`)).toHaveValue("45");
    await expect(page.getByTestId(`slider-progresso-${etapa.id}`)).toHaveValue("45");
  });

  /**
   * XG12 — o teste antigo exercitava `OcorrenciasSection`: máscara de data,
   * validação de 31/02, preservação da edição. Tudo real na tela e nada no
   * banco — o componente era `useState` puro, sem nenhuma mutation. Cobertura
   * de UI não é prova de persistência; o assert que faltava era um F5.
   *
   * A aba agora renderiza `OcorrenciasJ06Card`, que salva de verdade, e este
   * teste verifica o que importa: a ocorrência sobrevive ao recarregamento.
   */
  test("ocorrência criada na aba persiste após recarregar e pode ser resolvida", async ({
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
    await expect(page.getByTestId("card-ocorrencias-j06")).toBeVisible();

    await page.getByTestId("button-nova-ocorrencia").click();
    await page.getByTestId("input-ocorr-titulo").fill("Atraso no fornecedor");
    await page
      .getByTestId("input-ocorr-desc")
      .fill("O material da etapa ainda não foi entregue.");

    const criada = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/obras/${obra.id}/ocorrencias`) &&
        response.request().method() === "POST",
    );
    await page.getByTestId("button-criar-ocorrencia").click();
    expect((await criada).status()).toBeLessThan(300);

    await expect(page.getByText("Atraso no fornecedor", { exact: true })).toBeVisible();

    // O assert que o teste antigo não podia fazer: a ocorrência existe fora
    // do estado do React.
    await page.reload();
    const tourDepois = page.getByTestId("guided-tour");
    if (await tourDepois.count()) await page.getByRole("button", { name: "Pular" }).click();
    await page.getByRole("button", { name: "Ocorrências", exact: true }).click();
    await expect(
      page.getByText("Atraso no fornecedor", { exact: true }),
      "a ocorrência sobrevive ao F5",
    ).toBeVisible();

    // Resolver também precisa persistir.
    const resolver = page.getByTestId(/^button-resolver-/).first();
    await expect(resolver).toBeVisible();
    const resolvida = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/obras/${obra.id}/ocorrencias/`) &&
        response.url().endsWith("/resolver") &&
        response.request().method() === "POST",
    );
    await resolver.click();
    expect((await resolvida).status()).toBeLessThan(300);
    await expect(resolver).toHaveCount(0);
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

    // XG18 — preenche pelos modais do console. A tela `/editar` foi removida;
    // os mesmos campos, com as mesmas validações, vivem aqui agora.
    await page.goto(`/xgestao/obras/${obra.id}`);
    await expect(page.getByTestId("detalhes-obra-card")).toBeVisible();
    const tour = page.getByTestId("guided-tour");
    if (await tour.isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Pular" }).click();
    }

    await page.getByTestId("detalhes-editar-informacoes").click();
    await page.locator("#modal-obra-tipo").fill("Reforma comercial");
    await page.locator("#modal-obra-descricao").fill("Escopo detalhado da execução.");
    await page.locator("#modal-obra-area").fill("250");
    await page.locator("#modal-obra-status").selectOption("pausada");

    const salvoInfo = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/obras/${obra.id}`) &&
        response.request().method() === "PATCH",
    );
    await page.getByTestId("modal-salvar-informacoes").click();
    expect((await salvoInfo).status()).toBe(200);

    // Endereço mora no seu próprio modal, aberto pelo card de localização.
    await page.getByTestId("btn-editar-localizacao").click();
    await page.locator("#modal-obra-cidade").fill("Campinas");
    await page.locator("#modal-obra-uf").fill("SP");
    await page.locator("#modal-obra-numero").fill("45");

    const salvoLocal = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/obras/${obra.id}`) &&
        response.request().method() === "PATCH",
    );
    await page.getByTestId("modal-salvar-localizacao").click();
    expect((await salvoLocal).status()).toBe(200);

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

  /**
   * XG24 — o teste que faltava. Até aqui os specs só dispensavam o tour para
   * chegar na tela; nenhum percorria o roteiro. Foi assim que dois `data-tour`
   * órfãos sobreviveram no código: passo com alvo inexistente não quebra nada,
   * só centraliza o balão sem spotlight.
   *
   * A obra é criada vazia de propósito — sem etapas, sem contrato, sem
   * lançamento. É o estado de quem acabou de entrar no produto, que é
   * exatamente quem vê o tour, e o mais provável de deixar um passo sem alvo.
   */
  test("tour completo percorre todos os passos com spotlight, em obra vazia", async ({
    page,
    request,
  }) => {
    const email = await registrarEmpreiteiro(request);
    await loginAs(request, email);
    await completarPerfilOperacional(request, "empreiteiro");
    await concederXGestao(request, email);
    await loginAs(request, email);

    const obraResponse = await request.post("/api/xgestao/obras", {
      data: { nome: `Obra tour ${Date.now()}`, endereco: "Rua do Tour, 24" },
    });
    expect(obraResponse.status(), await obraResponse.text()).toBe(201);
    const obra = (await obraResponse.json()) as { id: string };
    await logout(request);

    const pageLogin = await page.request.post("/api/test/login-as", { data: { email } });
    expect(pageLogin.status(), await pageLogin.text()).toBe(200);
    await page.goto(`/xgestao/obras/${obra.id}`);
    await expect(page.getByTestId("hero-minha-obra")).toBeVisible();

    const tour = page.getByTestId("guided-tour");
    await expect(tour).toBeVisible();

    const contador = tour.getByText(/^Passo \d+ de \d+$/);
    const total = Number((await contador.textContent())!.match(/de (\d+)/)![1]);
    expect(total, "o roteiro cobre a obra inteira, não só as etapas").toBeGreaterThanOrEqual(12);

    const vistos = new Set<number>();
    for (let volta = 0; volta < total * 2; volta += 1) {
      if (!(await tour.isVisible().catch(() => false))) break;

      const atual = Number((await contador.textContent())!.match(/Passo (\d+)/)![1]);
      vistos.add(atual);

      // O spotlight é o ring desenhado sobre o alvo. Sem ele o passo é um
      // balão órfão: o alvo não existe e a explicação não tem a que se referir.
      // Um passo pulado por alvo ausente não chega a ser visto aqui — o
      // componente avança sozinho —, então basta assertar o que está na tela.
      await expect(
        tour.locator(".ring-primary"),
        `passo ${atual} de ${total} exibe spotlight sobre o alvo`,
      ).toBeVisible();

      await page.getByTestId("guided-tour-next").click();
    }

    // Concluir o último passo fecha o tour e grava a preferência.
    await expect(tour).toHaveCount(0);
    expect(vistos.size, "nenhum passo trava o roteiro no meio").toBeGreaterThanOrEqual(12);

    // Concluído não reaparece no F5, e "Ajuda" reabre do começo.
    await page.reload();
    await expect(page.getByTestId("hero-minha-obra")).toBeVisible();
    await expect(tour).toHaveCount(0);

    await page.getByTestId("botao-ajuda").click();
    await expect(tour).toBeVisible();
    await expect(contador).toHaveText(`Passo 1 de ${total}`);
  });

  /**
   * XG25 — a barra do cronograma fica vermelha quando o prazo venceu.
   *
   * As datas saem de `Date.now()`, e não de constantes como no spec de
   * integração da XG10 (que fixa 2026-10-01/20): um fixture com data absoluta
   * "passa a atrasar" sozinho quando o calendário alcança a data, e o teste
   * diria a verdade por acidente.
   */
  test("barra do cronograma fica vermelha quando o prazo venceu", async ({
    page,
    request,
  }) => {
    const email = await registrarEmpreiteiro(request);
    await loginAs(request, email);
    await completarPerfilOperacional(request, "empreiteiro");
    await concederXGestao(request, email);
    await loginAs(request, email);

    const obraResponse = await request.post("/api/xgestao/obras", {
      data: { nome: `Obra atraso ${Date.now()}`, endereco: "Rua do Prazo, 60" },
    });
    expect(obraResponse.status(), await obraResponse.text()).toBe(201);
    const obra = (await obraResponse.json()) as { id: string };

    const emDias = (dias: number) =>
      new Date(Date.now() + dias * 86_400_000).toISOString();

    /**
     * O POST de etapa não aceita `status` — ela sempre nasce `pendente`, e é o
     * PATCH que define o resto. Sem o segundo passo, todas as barras sairiam
     * cinza e o teste mediria outra coisa.
     */
    const criarEtapa = async (
      nome: string,
      dataInicio: string,
      prazo: string,
      status: string,
    ) => {
      const criada = await request.post(`/api/obras/${obra.id}/etapas`, {
        data: { nome, dataInicio, prazo },
      });
      expect(criada.status(), await criada.text()).toBe(201);
      const etapa = (await criada.json()) as { id: string };

      const ajustada = await request.patch(`/api/obras/${obra.id}/etapas/${etapa.id}`, {
        data: { status },
      });
      expect(ajustada.status(), await ajustada.text()).toBe(200);
      return etapa;
    };

    // Vencida e em andamento: o caso exato do print do cliente.
    const vencida = await criarEtapa("Gesso liso", emDias(-30), emDias(-5), "em_andamento");
    // No prazo: continua azul, e é o contraste que prova que a cor veio da
    // data e não de uma mudança global.
    const noPrazo = await criarEtapa("Pintura", emDias(-2), emDias(20), "em_andamento");
    // Concluída com prazo vencido: entregou atrasado, mas entregou. Fica verde.
    const concluida = await criarEtapa("Demolição", emDias(-40), emDias(-10), "concluido");
    // Bloqueada E vencida: a decisão de precedência. Sai como atrasada.
    const bloqueadaVencida = await criarEtapa(
      "Impermeabilização",
      emDias(-25),
      emDias(-3),
      "bloqueado",
    );
    await logout(request);

    const pageLogin = await page.request.post("/api/test/login-as", { data: { email } });
    expect(pageLogin.status(), await pageLogin.text()).toBe(200);
    await page.goto(`/xgestao/obras/${obra.id}`);
    await expect(page.getByTestId("hero-minha-obra")).toBeVisible();

    const tour = page.getByTestId("guided-tour");
    if (await tour.isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Pular" }).click();
    }

    await page.getByRole("button", { name: "Cronograma", exact: true }).click();
    await expect(page.getByTestId("gantt-svg")).toBeVisible();

    const ATRASADA = "#b91c1c";
    const BLOQUEADO = "#ef4444";
    const EM_ANDAMENTO = "#3b82f6";
    const CONCLUIDO = "#10b981";

    /** Cor do trilho da barra — o primeiro `rect` do grupo da etapa. */
    const corDaBarra = (id: string) =>
      page.getByTestId(`gantt-etapa-${id}`).locator("rect").first();

    await expect(corDaBarra(vencida.id), "prazo vencido pinta de vermelho").toHaveAttribute(
      "fill",
      ATRASADA,
    );
    await expect(corDaBarra(noPrazo.id), "dentro do prazo segue azul").toHaveAttribute(
      "fill",
      EM_ANDAMENTO,
    );
    await expect(
      corDaBarra(concluida.id),
      "concluída não atrasa, mesmo com o prazo para trás",
    ).toHaveAttribute("fill", CONCLUIDO);
    await expect(
      corDaBarra(bloqueadaVencida.id),
      "atraso vence sobre bloqueado",
    ).toHaveAttribute("fill", ATRASADA);
    await expect(corDaBarra(bloqueadaVencida.id)).not.toHaveAttribute("fill", BLOQUEADO);

    // O contorno é o que separa atrasada de bloqueada sem depender do matiz.
    await expect(corDaBarra(vencida.id)).toHaveAttribute("stroke", "#7f1d1d");
    await expect(corDaBarra(noPrazo.id)).not.toHaveAttribute("stroke", /.+/);

    // O status original não se perde: fica no tooltip, junto da contagem. A
    // contagem é assertada por padrão, e não no número exato: as datas do
    // fixture são deslocamentos em horas e o arredondamento para dias vira na
    // fronteira, o que faria o teste piscar conforme a hora em que roda.
    const titulo = page.getByTestId(`gantt-etapa-${bloqueadaVencida.id}`).locator("title");
    await expect(titulo).toContainText("Bloqueado");
    await expect(titulo).toContainText(/Atrasada há \d+ dias?/);

    // A legenda ganhou a entrada. Escopado nela, e não na página: "Atrasada"
    // também aparece nos tooltips das barras.
    await expect(
      page.getByTestId("gantt-legenda").getByText("Atrasada", { exact: true }),
    ).toBeVisible();
  });
});