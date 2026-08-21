import { expect, test, chromium, type APIRequestContext } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolvePostLoginRedirect } from '@features/auth/utils/redirect-by-role';
import {
  loginAs,
  logout,
  SEED_ADMIN_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  BROWSER_DISPONIVEL,
  MOTIVO_BROWSER_INDISPONIVEL,
  uniqueEmail,
  uniqueUsername,
} from '../helpers';

const BROWSER_E2E_DISPONIVEL = BROWSER_DISPONIVEL && existsSync(chromium.executablePath());

async function setMarketplaceVisibility(request: APIRequestContext, marketplaceVisivel: boolean) {
  const response = await request.patch('/api/admin/configuracoes', {
    data: { chave: 'plataforma', valor: { marketplaceVisivel } },
  });
  expect(response.status(), await response.text()).toBe(200);
}

test.describe('xgestão — marketplace oculto de forma reversível', () => {
  test('redirecionamento OAuth de um empreiteiro xgestão respeita o entitlement e destino seguro', () => {
    expect(resolvePostLoginRedirect('empreiteiro', '/xgestao/obras', ['empreiteiro', 'xgestao']))
      .toBe('/xgestao/obras');
    expect(resolvePostLoginRedirect('empreiteiro', '/xgestao/obras', ['empreiteiro']))
      .toBe('/empreiteiro/dashboard');
  });

  test.describe('jornada visual', () => {
    // O skip é declarado no describe para não inicializar a fixture `page`
    // quando este runner não possui Chromium instalado.
    test.skip(!BROWSER_E2E_DISPONIVEL, MOTIVO_BROWSER_INDISPONIVEL);

    test('a experiência pública e a navegação do empreiteiro acompanham o toggle', async ({ page }) => {
    const request = page.context().request;

    await loginAs(request, SEED_ADMIN_EMAIL);
    const configuracoes = await request.get('/api/admin/configuracoes');
    expect(configuracoes.status(), await configuracoes.text()).toBe(200);
    const original = ((await configuracoes.json()) as {
      plataforma: { marketplaceVisivel?: boolean };
    }).plataforma.marketplaceVisivel !== false;

    try {
      await setMarketplaceVisibility(request, false);
      await logout(request);

      await page.goto('/');
      await expect(page.getByTestId('link-acessar-xgestao')).toBeVisible();
      await expect(page.getByTestId('link-criar-conta-xgestao')).toBeVisible();
      await expect(page.getByTestId('link-sou-empreiteiro')).toHaveCount(0);
      await expect(page.getByTestId('link-marketplace-em-breve')).toHaveCount(0);
      await expect(page.getByTestId('link-acessar-marketplace')).toHaveCount(0);

      await page.goto('/acesso-plataforma');
      await expect(page.getByTestId('link-login-xgestao')).toBeVisible();
      await expect(page.getByTestId('link-cadastro-xgestao')).toBeVisible();
      await expect(page.getByTestId('card-marketplace-em-breve')).toHaveCount(0);

      await loginAs(request, SEED_EMPREITEIRO_EMAIL);
      await page.goto('/empreiteiro/dashboard');
      await expect(page.getByText('Novas Obras Disponíveis', { exact: true })).toHaveCount(0);
      await expect(page.getByText('Obras Salvas', { exact: true })).toHaveCount(0);
      await expect(page.getByText('Minhas Candidaturas', { exact: true })).toHaveCount(0);
      await expect(page.getByText('Meus Recebimentos', { exact: true })).toHaveCount(0);
      await expect(page.getByText('Meu Saldo', { exact: true })).toHaveCount(0);
      await expect(page.getByText('Minhas Obras', { exact: true })).toBeVisible();

      await logout(request);
      await loginAs(request, SEED_ADMIN_EMAIL);
      await setMarketplaceVisibility(request, true);
      await logout(request);

      await page.goto('/');
      await expect(page.getByTestId('link-sou-empreiteiro')).toBeVisible();
      await expect(page.getByTestId('link-acessar-xgestao')).toHaveCount(0);
    } finally {
      await logout(request);
      await loginAs(request, SEED_ADMIN_EMAIL);
      await setMarketplaceVisibility(request, original);
      await logout(request);
    }
    });
  });

  test('cadastro iniciado pelo xgestão preserva a conta empreiteiro e concede o entitlement', async ({ request }) => {
    const email = uniqueEmail('xgestao-cadastro');
    const response = await request.post('/api/auth/register', {
      data: {
        name: 'Empreiteira xgestão',
        email,
        username: uniqueUsername('xgestaocadastro'),
        password: 'Xconstr@E2E2026!',
        role: 'empreiteiro',
        xgestao: true,
        phone: '11988880000',
        acceptTerms: true,
        website: '',
        mountedAt: Date.now() - 5_000,
      },
    });
    expect(response.status(), await response.text()).toBe(201);

    await loginAs(request, email);
    const me = await request.get('/api/auth/me');
    expect(me.status(), await me.text()).toBe(200);
    expect((await me.json()) as { role: string; roles: string[] }).toMatchObject({
      role: 'empreiteiro',
      roles: expect.arrayContaining(['empreiteiro', 'xgestao']),
    });
    await logout(request);
  });

  test('oculta a descoberta sem desligar APIs e restaura o toggle sem deploy', async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const configuracoes = await request.get('/api/admin/configuracoes');
    expect(configuracoes.status(), await configuracoes.text()).toBe(200);
    const original = ((await configuracoes.json()) as {
      plataforma: { marketplaceVisivel?: boolean };
    }).plataforma.marketplaceVisivel !== false;

    try {
      await setMarketplaceVisibility(request, false);
      await logout(request);

      const oculto = await request.get('/api/plataforma/public-config');
      expect(oculto.status(), await oculto.text()).toBe(200);
      expect((await oculto.json()) as { marketplaceVisivel: boolean }).toMatchObject({
        marketplaceVisivel: false,
      });
      const sitemapOculto = await request.get('/sitemap.xml');
      expect(sitemapOculto.status(), await sitemapOculto.text()).toBe(200);
      expect(await sitemapOculto.text()).not.toContain('/acesso-plataforma');

      // A visibilidade é apenas de apresentação: o endpoint legado segue vivo
      // e utilizável por uma sessão de marketplace já existente.
      await loginAs(request, SEED_EMPREITEIRO_EMAIL);
      const obrasMarketplace = await request.get('/api/obras');
      expect(obrasMarketplace.status(), await obrasMarketplace.text()).toBe(200);
      await logout(request);

      await loginAs(request, SEED_ADMIN_EMAIL);
      await setMarketplaceVisibility(request, true);
      await logout(request);

      const reativado = await request.get('/api/plataforma/public-config');
      expect(reativado.status(), await reativado.text()).toBe(200);
      expect((await reativado.json()) as { marketplaceVisivel: boolean }).toMatchObject({
        marketplaceVisivel: true,
      });
      const sitemapReativado = await request.get('/sitemap.xml');
      expect(sitemapReativado.status(), await sitemapReativado.text()).toBe(200);
      expect(await sitemapReativado.text()).toContain('/acesso-plataforma');
    } finally {
      // A suíte nunca deixa o ambiente compartilhado oculto se uma asserção falhar.
      await logout(request);
      await loginAs(request, SEED_ADMIN_EMAIL);
      await setMarketplaceVisibility(request, original);
      await logout(request);
    }
  });
});