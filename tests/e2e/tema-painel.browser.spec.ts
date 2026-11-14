import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { loginAs, SEED_ADMIN_EMAIL } from './helpers';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';
import {
  OBRA_STATUS_DB_BADGE_CLASSES,
  STATUS_BADGE_CLASSES_XGESTAO,
  corMembroLegivel,
} from '@shared/constants/status';
import {
  contrasteDeClasses,
  estadoDoTema,
  fecharDocumentosLegais,
  medirTema,
  pularTourEAvisos,
  type ProblemaContraste,
  type SuperficieClara,
} from './helpers-tema-painel';

/**
 * PRD 55 — tema claro/escuro do painel (empreiteiro, admin xgestão e link público).
 *
 * 1. A preferência (Claro, Escuro, Automático) vale na hora, sobrevive ao
 *    recarregar e o Automático segue o celular.
 * 2. Fora do painel (site, login, admin do marketplace) nunca fica escuro.
 * 3. No escuro, todas as telas passam no contraste AA e não sobra cartão claro.
 *
 * `FOTOS_TEMA=<pasta>` guarda as fotos de cada tela (revisão visual).
 */
const origemUI = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';
const pastaFotos = process.env.FOTOS_TEMA;

async function escolherTema(page: Page, rotulo: 'Claro' | 'Escuro' | 'Automático') {
  const opcao = page.getByRole('menuitemradio', { name: rotulo });
  // O menu fecha ao escolher; reabrir logo em seguida às vezes pega a animação de saída.
  await expect(async () => {
    if (!(await opcao.isVisible())) await page.locator('[aria-label="Abrir menu da conta"]').click();
    await expect(opcao).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15_000 });
  await opcao.click();
  await expect(opcao).toBeHidden();
}

async function esperarTela(page: Page) {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await expect(page.locator('[data-slot="skeleton"], .animate-pulse').first()).toBeHidden({ timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(400);
}

interface Resultado {
  tela: string;
  contraste: ProblemaContraste[];
  superficiesClaras: SuperficieClara[];
}

async function varrer(page: Page, tela: string, largura: number, resultados: Resultado[]) {
  await esperarTela(page);
  const medida = await medirTema(page);
  resultados.push({ tela: `${tela} @${largura}`, ...medida });
  if (pastaFotos) {
    mkdirSync(pastaFotos, { recursive: true });
    await page.screenshot({ path: `${pastaFotos}/${tela.replace(/[^\w-]+/g, '_')}-${largura}.png`, fullPage: true });
  }
}

function relatorio(resultados: Resultado[]) {
  const linhas: string[] = [];
  for (const r of resultados) {
    for (const c of r.contraste) linhas.push(`${r.tela} | contraste ${c.razao} < ${c.minimo} | "${c.texto}" ${c.cor} sobre ${c.fundo} | ${c.onde}`);
    for (const s of r.superficiesClaras) linhas.push(`${r.tela} | superfície clara ${s.fundo} ${s.largura}x${s.altura} | ${s.onde}`);
  }
  return linhas;
}

test.describe('PRD 55 — preferência de tema', () => {
  test('Escuro, Claro e Automático no painel do empreiteiro; site e login seguem claros', async ({ page }) => {
    test.setTimeout(180_000);
    await novoAssinanteHomologacao(page.request, 'tema-pref');
    await pularTourEAvisos(page);
    await page.emulateMedia({ colorScheme: 'light' });

    await page.goto(`${origemUI}/xgestao/dashboard`);
    await fecharDocumentosLegais(page);
    // Padrão: Automático, celular claro → claro, e o navegador proibido de inverter.
    await expect.poll(() => estadoDoTema(page)).toEqual({ escuro: false, painel: true, colorScheme: 'only light' });

    await escolherTema(page, 'Escuro');
    await expect.poll(() => estadoDoTema(page)).toEqual({ escuro: true, painel: true, colorScheme: 'dark' });

    // Recarregar mantém, e o escuro já está no HTML antes do React (sem piscar claro).
    await page.goto(`${origemUI}/xgestao/obras`, { waitUntil: 'domcontentloaded' });
    expect(await estadoDoTema(page)).toMatchObject({ escuro: true, painel: true });

    await escolherTema(page, 'Claro');
    await expect.poll(() => estadoDoTema(page)).toEqual({ escuro: false, painel: true, colorScheme: 'only light' });

    // Automático acompanha o celular, inclusive se ele mudar com a tela aberta.
    await escolherTema(page, 'Automático');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => estadoDoTema(page)).toMatchObject({ escuro: true });
    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() => estadoDoTema(page)).toMatchObject({ escuro: false });

    // Escolha Escuro e saia pelo menu: a página de fora não herda o escuro.
    await escolherTema(page, 'Escuro');
    await expect.poll(() => estadoDoTema(page)).toMatchObject({ escuro: true });
    await page.getByRole('button', { name: 'Abrir menu da conta' }).click();
    await page.getByTestId('xgestao-topbar-logout').click();
    await page.waitForURL((url) => !url.pathname.startsWith('/xgestao/'));
    await expect.poll(() => estadoDoTema(page)).toEqual({ escuro: false, painel: false, colorScheme: '' });

    await page.goto(`${origemUI}/`);
    expect(await estadoDoTema(page)).toEqual({ escuro: false, painel: false, colorScheme: '' });
  });

  test('admin: o tema vale no xgestão e não passa para o resto do /admin', async ({ page }) => {
    test.setTimeout(120_000);
    await loginAs(page.request, SEED_ADMIN_EMAIL);
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(`${origemUI}/admin/xgestao`);
    await fecharDocumentosLegais(page);
    await escolherTema(page, 'Escuro');
    await expect.poll(() => estadoDoTema(page)).toEqual({ escuro: true, painel: true, colorScheme: 'dark' });

    await page.goto(`${origemUI}/admin/saude`);
    await page.waitForLoadState('domcontentloaded');
    await expect.poll(() => estadoDoTema(page)).toEqual({ escuro: false, painel: false, colorScheme: '' });
    // Fora do xgestão o menu da conta não oferece tema.
    await page.locator('[aria-label="Abrir menu da conta"]').click();
    await expect(page.getByRole('menuitemradio', { name: 'Escuro' })).toHaveCount(0);
  });
});

test('PRD 55 — selos de status e iniciais da equipe passam no AA, no claro e no escuro', async ({ page }) => {
  test.setTimeout(120_000);
  await novoAssinanteHomologacao(page.request, 'tema-selos');
  await pularTourEAvisos(page);
  // Cores que o servidor sorteia para os membros (`build-detalhe-server.ts`).
  const avatares = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-cyan-500']
    .map((cor) => `${corMembroLegivel(cor)} text-white`);
  const combinacoes = [...Object.values(OBRA_STATUS_DB_BADGE_CLASSES), ...Object.values(STATUS_BADGE_CLASSES_XGESTAO), ...avatares];
  for (const esquema of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: esquema });
    await page.goto(`${origemUI}/xgestao/dashboard`);
    await fecharDocumentosLegais(page);
    await expect.poll(() => estadoDoTema(page)).toMatchObject({ escuro: esquema === 'dark' });
    const ruins = (await contrasteDeClasses(page, combinacoes)).filter((r) => r.razao < 4.5);
    expect(ruins, `${esquema}: ${JSON.stringify(ruins)}`).toEqual([]);
  }
});

test.describe('PRD 55 — escuro em todas as telas', () => {
  for (const largura of [390, 1280]) {
    test(`empreiteiro e link público no escuro, ${largura}px: contraste AA e sem cartão claro`, async ({ page }) => {
      test.setTimeout(300_000);
      await page.setViewportSize({ width: largura, height: largura < 500 ? 844 : 900 });
      await novoAssinanteHomologacao(page.request, `tema-escuro-${largura}`, { assinar: 'premium' });
      const criada = await page.request.post('/api/xgestao/obras', {
        data: { nome: 'E2E tema escuro', endereco: 'Rua Augusta 1500', cidade: 'São Paulo', uf: 'SP' },
      });
      expect(criada.status(), await criada.text()).toBe(201);
      const { id: obraId } = (await criada.json()) as { id: string };
      // O link público é emitido já aqui, com a sessão da API recém-criada.
      const emitido = await page.request.post(`/api/xgestao/obras/${obraId}/share`, {
        data: {
          nome: 'Cliente',
          secoes: { etapas: true, cronograma: true, fotos: true, pagamentos: true, diario: true, ocorrencias: true, tarefas: true, localizacao: true },
        },
      });
      expect(emitido.status(), await emitido.text()).toBe(201);
      const { share } = (await emitido.json()) as { share: { path: string } };

      await pularTourEAvisos(page);
      await page.emulateMedia({ colorScheme: 'dark' });
      const resultados: Resultado[] = [];

      for (const [tela, caminho] of [
        ['painel', '/xgestao/dashboard'],
        ['minhas-obras', '/xgestao/obras'],
        ['equipe', '/xgestao/equipe'],
        ['config-perfil', '/xgestao/configuracoes?tab=perfil'],
        ['config-empresa', '/xgestao/configuracoes?tab=empresa'],
        ['config-notificacoes', '/xgestao/configuracoes?tab=notificacoes'],
        ['config-seguranca', '/xgestao/configuracoes?tab=seguranca'],
        ['config-plano', '/xgestao/configuracoes?tab=plano'],
        ['planos', '/xgestao/planos'],
      ] as const) {
        await page.goto(`${origemUI}${caminho}`);
        await fecharDocumentosLegais(page);
        expect(await estadoDoTema(page)).toMatchObject({ escuro: true });
        await varrer(page, tela, largura, resultados);
      }

      await page.goto(`${origemUI}/xgestao/obras/${obraId}`);
      await esperarTela(page);
      const abas = page.locator('[data-tour="abas-obra"] button');
      const nomes = await abas.allInnerTexts();
      for (const nome of nomes) {
        await abas.filter({ hasText: nome.trim() }).first().click();
        await varrer(page, `obra-${nome.trim().toLowerCase()}`, largura, resultados);
      }

      // Modais e menus abrem no body: também precisam estar escuros.
      await page.getByRole('button', { name: 'Abrir menu da conta' }).click();
      await varrer(page, 'menu-conta', largura, resultados);
      await page.keyboard.press('Escape');
      if (largura < 500) {
        await page.locator('[data-sidebar="trigger"]').click();
        await varrer(page, 'menu-lateral', largura, resultados);
        await page.keyboard.press('Escape');
      }
      await page.goto(`${origemUI}/xgestao/obras`);
      await page.getByRole('button', { name: /Nova obra/ }).first().click();
      await varrer(page, 'modal-nova-obra', largura, resultados);
      await page.keyboard.press('Escape');

      // Link público: segue o celular de quem abre, sem botão.
      await page.goto(`${origemUI}${share.path}`);
      await expect(page.getByTestId('obra-publica-shell')).toBeVisible();
      expect(await estadoDoTema(page)).toMatchObject({ escuro: true });
      await varrer(page, 'link-publico', largura, resultados);
      await page.emulateMedia({ colorScheme: 'light' });
      await expect.poll(() => estadoDoTema(page)).toMatchObject({ escuro: false });

      const problemas = relatorio(resultados);
      console.log(`[tema-escuro ${largura}] ${resultados.length} telas, ${problemas.length} problemas`);
      for (const linha of problemas) console.log(linha);
      expect(problemas).toEqual([]);
    });
  }

  test('admin xgestão no escuro, 1280px: contraste AA e sem cartão claro', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    const { userId } = await novoAssinanteHomologacao(page.request, 'tema-escuro-admin');
    await loginAs(page.request, SEED_ADMIN_EMAIL);
    await page.emulateMedia({ colorScheme: 'dark' });
    const resultados: Resultado[] = [];
    for (const [tela, caminho] of [
      ['admin-visao', '/admin/xgestao'],
      ['admin-assinantes', '/admin/xgestao/assinantes'],
      ['admin-assinante', `/admin/xgestao/assinantes/${userId}`],
      ['admin-obras', '/admin/xgestao/obras'],
      ['admin-conversao', '/admin/xgestao/conversao'],
      ['admin-financeiro', '/admin/xgestao/financeiro'],
      ['admin-engajamento', '/admin/xgestao/engajamento'],
      ['admin-historico', '/admin/xgestao/historico'],
    ] as const) {
      await page.goto(`${origemUI}${caminho}`);
      await fecharDocumentosLegais(page);
      expect(await estadoDoTema(page)).toMatchObject({ escuro: true });
      await varrer(page, tela, 1280, resultados);
    }
    const problemas = relatorio(resultados);
    console.log(`[tema-escuro admin] ${resultados.length} telas, ${problemas.length} problemas`);
    for (const linha of problemas) console.log(linha);
    expect(problemas).toEqual([]);
  });
});
