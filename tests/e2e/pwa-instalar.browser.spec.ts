import { expect, test, type Page } from '@playwright/test';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

/**
 * PWA (11/11/2026) — instalar o xgestão no celular: manifesto e ícones, a seção
 * da home, a página /instalar (destino do QR code) em cada aparelho, e o painel
 * (faixa no celular, item no menu, nada disso dentro do app instalado).
 *
 * O navegador de teste não instala app de verdade; o convite do Android é
 * simulado com o mesmo evento que o Chrome dispara (`beforeinstallprompt`).
 */
const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  instagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 340.0.0.22.109',
};
const CELULAR = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

/** O que o Chrome do Android faz quando o site pode ser instalado. */
async function prepararConviteAndroid(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __dispararConvite: () => void }).__dispararConvite = () => {
      const e = new Event('beforeinstallprompt', { cancelable: true }) as Event & Record<string, unknown>;
      e.prompt = async () => {
        const w = window as unknown as { __promptChamado?: number };
        w.__promptChamado = (w.__promptChamado ?? 0) + 1;
      };
      e.userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(e);
    };
  });
}

/** Simula o app aberto pelo ícone da tela inicial. */
async function comoAppInstalado(page: Page) {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (q: string) => (q.includes('display-mode: standalone')
      ? ({ matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false } as unknown as MediaQueryList)
      : original(q));
  });
}

async function entrar(page: Page, email: string, destino: string) {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (chave: string) {
      return chave.startsWith('xgestao-tour-') ? '1' : original.call(this, chave);
    };
  });
  await page.goto(`/login?perfil=xgestao&next=${encodeURIComponent(destino)}`);
  await page.getByTestId('input-email').fill(email);
  await page.getByTestId('input-password').fill('Xconstr@E2E2026!');
  await page.waitForTimeout(3500);
  const login = page.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
  await page.getByTestId('button-login').click();
  expect((await login).status()).toBe(200);
  await page.waitForURL('**/xgestao/**');
  const legal = page.getByRole('dialog', { name: 'Atualizamos nossos documentos' });
  await legal.waitFor({ state: 'visible', timeout: 3000 }).catch(() => undefined);
  if (await legal.isVisible()) await legal.getByRole('button', { name: 'Agora não' }).click();
}

test.describe('PWA — manifesto e ícones', () => {
  test('manifesto abre o xgestão, ícones respondem e a página aponta para eles', async ({ request }) => {
    const r = await request.get('/manifest.webmanifest');
    expect(r.status()).toBe(200);
    expect(r.headers()['content-type']).toContain('application/manifest+json');
    const m = await r.json();
    expect(m).toMatchObject({ short_name: 'xgestão', start_url: '/xgestao/dashboard', scope: '/', display: 'standalone' });
    for (const icone of [...m.icons.map((i: { src: string }) => i.src), '/apple-icon.png', '/icon.png']) {
      const img = await request.get(icone);
      expect(img.status(), icone).toBe(200);
      expect(img.headers()['content-type'], icone).toContain('image/png');
    }
    const html = await (await request.get('/instalar')).text();
    expect(html).toContain('rel="manifest"');
    expect(html).toContain('apple-touch-icon');
    expect(html).toContain('name="theme-color"');
    expect(html).toContain('beforeinstallprompt');
  });
});

test.describe('PWA — home no computador', () => {
  test('seção "Leve o xgestão no celular" com QR code que aponta para /instalar', async ({ page }) => {
    await page.goto('/');
    const secao = page.getByTestId('secao-instalar-app');
    await secao.scrollIntoViewIfNeeded();
    await expect(secao.getByRole('heading', { name: /Leve o xgestão/ })).toBeVisible();
    const qr = secao.getByTestId('instalar-app-qrcode');
    await expect(qr).toBeVisible();
    expect(await qr.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    await expect(secao).toContainText('/instalar');
    await expect(secao).toContainText('Abra a câmera do celular');
  });
});

test.describe('PWA — /instalar no iPhone', () => {
  test.use({ ...CELULAR, userAgent: UA.iphone });
  test('mostra os passos do Compartilhar do Safari', async ({ page }) => {
    await page.goto('/instalar');
    const passos = page.getByTestId('instalar-app-ios');
    await expect(passos).toContainText('na barra de baixo do Safari');
    await expect(passos).toContainText('Adicionar à Tela de Início');
    await expect(page.getByTestId('instalar-app-qrcode')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test.describe('PWA — /instalar no Android', () => {
  test.use({ ...CELULAR, userAgent: UA.android });
  test('sem convite mostra o menu do Chrome; com convite, 1 toque instala', async ({ page }) => {
    await prepararConviteAndroid(page);
    await page.goto('/instalar');
    await expect(page.getByTestId('instalar-app-android-passos')).toContainText('Instalar app');

    await page.evaluate(() => (window as unknown as { __dispararConvite: () => void }).__dispararConvite());
    await page.getByTestId('button-instalar-app').click();
    await expect(page.getByTestId('instalar-app-pronto')).toContainText('Pronto!');
    expect(await page.evaluate(() => (window as unknown as { __promptChamado?: number }).__promptChamado)).toBe(1);
  });
});

test.describe('PWA — /instalar dentro do Instagram', () => {
  test.use({ ...CELULAR, userAgent: UA.instagram });
  test('pede para abrir no navegador', async ({ page }) => {
    await page.goto('/instalar');
    await expect(page.getByTestId('instalar-app-navegador-interno')).toContainText('Abrir no navegador');
  });
});

test.describe('PWA — /instalar aberto pelo app instalado', () => {
  test.use({ ...CELULAR, userAgent: UA.android });
  test('segue direto para o xgestão (login, sem sessão)', async ({ page }) => {
    await comoAppInstalado(page);
    await page.goto('/instalar');
    await page.waitForURL(/\/login\?perfil=xgestao/);
  });
});

test.describe('PWA — painel do xgestão no celular', () => {
  test.use({ ...CELULAR, userAgent: UA.android });
  test('faixa "Instalar" usa o convite do Android e, fechada, não volta', async ({ page, request }) => {
    const { email } = await novoAssinanteHomologacao(request, 'pwa-celular');
    await prepararConviteAndroid(page);
    await entrar(page, email, '/xgestao/dashboard');

    const faixa = page.getByTestId('xgestao-aviso-instalar-app');
    await expect(faixa).toContainText('Use o xgestão como app no celular.');
    await page.evaluate(() => (window as unknown as { __dispararConvite: () => void }).__dispararConvite());
    await page.getByTestId('link-aviso-instalar-app').click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __promptChamado?: number }).__promptChamado)).toBe(1);
    await expect(faixa).toHaveCount(0);

    // Instalou: a faixa não volta. Quem só fecha também não vê de novo.
    await page.reload();
    await expect(page.getByTestId('xgestao-aviso-instalar-app')).toHaveCount(0);
    await page.evaluate(() => window.localStorage.removeItem('xgestao:instalar-app-dispensado'));
    await page.reload();
    await page.getByRole('button', { name: 'Fechar aviso de instalar o app' }).click();
    await expect(faixa).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('dialog-instalar-app')).toHaveCount(0);
    await expect(page.getByTestId('xgestao-aviso-instalar-app')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test.describe('PWA — painel do xgestão no computador', () => {
  test('"Instalar app" no menu abre o QR code', async ({ page, request }) => {
    const { email } = await novoAssinanteHomologacao(request, 'pwa-desktop');
    await entrar(page, email, '/xgestao/dashboard');
    await expect(page.getByTestId('xgestao-aviso-instalar-app')).toHaveCount(0);
    await page.getByTestId('xgestao-sidebar-instalar-app').click();
    const dialogo = page.getByTestId('dialog-instalar-app');
    await expect(dialogo.getByRole('heading', { name: 'Instalar o app no celular' })).toBeVisible();
    await expect(dialogo.getByTestId('instalar-app-qrcode')).toBeVisible();
  });
});

test.describe('PWA — dentro do app instalado', () => {
  test.use({ ...CELULAR, userAgent: UA.android });
  test('nada de "instalar" aparece e dá para navegar e voltar pelas telas', async ({ page, request }) => {
    const { email } = await novoAssinanteHomologacao(request, 'pwa-standalone');
    await comoAppInstalado(page);
    await entrar(page, email, '/xgestao/dashboard');
    await expect(page.getByTestId('xgestao-aviso-instalar-app')).toHaveCount(0);

    await page.getByRole('button', { name: 'Toggle Sidebar' }).first().click();
    await expect(page.getByTestId('xgestao-sidebar-instalar-app')).toHaveCount(0);
    await page.getByRole('link', { name: 'Minhas Obras' }).click();
    await page.waitForURL('**/xgestao/obras');
    await page.goto('/xgestao/configuracoes?tab=plano');
    await expect(page.getByText('Plano', { exact: false }).first()).toBeVisible();
    await page.goBack();
    await page.waitForURL('**/xgestao/obras');
  });
});
