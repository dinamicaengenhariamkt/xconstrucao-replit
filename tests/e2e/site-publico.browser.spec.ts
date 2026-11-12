import { expect, test } from '@playwright/test';

/**
 * Site público (12/11/2026) — facelift leve: tema claro/escuro só do site,
 * rodapé com o link certo, e nada quebrando no celular.
 */
const PAGINAS = ['/', '/xgestao-inteligente', '/politica-privacidade', '/termos'];

test.describe('site público — tema claro/escuro', () => {
  test('troca, fica guardado, vale no login e não escurece o app', async ({ page }) => {
    await page.goto('/');
    const raiz = page.locator('[data-site-tema]');
    await expect(raiz).toHaveAttribute('data-site-tema', 'light');
    await page.getByTestId('button-tema-site').first().click();
    await expect(raiz).toHaveAttribute('data-site-tema', 'dark');
    await expect(raiz).toHaveClass(/\bdark\b/);

    // Vale nas outras páginas do site.
    await page.goto('/xgestao-inteligente');
    await expect(page.locator('[data-site-tema]')).toHaveAttribute('data-site-tema', 'dark');

    // O tema do site não toca no <html> (onde mora o tema do app).
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);
    // Rodada 2: as telas de conta seguem o tema do site, mas o <html> continua claro.
    await page.goto('/login?perfil=xgestao');
    await expect(page.locator('[data-site-tema]')).toHaveAttribute('data-site-tema', 'dark');
    expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);

    // Volta para o claro.
    await page.goto('/');
    await page.getByTestId('button-tema-site').first().click();
    await expect(page.locator('[data-site-tema]')).toHaveAttribute('data-site-tema', 'light');
  });
});

test.describe('site público — rodapé', () => {
  test('"Desenvolvido por Ramon Gomes" leva ao site certo, em nova aba', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: 'Ramon Gomes' });
    await expect(link).toHaveAttribute('href', 'https://ramongomessilva.com.br/');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
  });
});

test.describe('site público — celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('sem rolagem lateral e com os botões principais em todas as páginas', async ({ page }) => {
    for (const url of PAGINAS) {
      await page.goto(url);
      await page.evaluate(async () => {
        document.documentElement.style.scrollBehavior = 'auto';
        for (let y = 0; y < document.body.scrollHeight; y += 500) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 150));
        }
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), url).toBe(true);
      // Tudo que entra com animação aparece depois de rolar.
      expect(await page.evaluate(() => [...document.querySelectorAll('main *')].filter((e) => getComputedStyle(e).opacity === '0').length), url).toBe(0);
    }
    await page.goto('/');
    await expect(page.getByTestId('link-acessar-xgestao')).toBeVisible();
    await expect(page.getByTestId('solution-card-xgestao')).toBeAttached();
    await page.goto('/xgestao-inteligente');
    await expect(page.getByTestId('link-testar-gratis')).toBeVisible();
  });
});

test.describe('site público — topo das páginas internas', () => {
  const COM_MIGALHA = [
    { url: '/login?perfil=xgestao', atual: 'Entrar' },
    { url: '/cadastro?perfil=xgestao', atual: 'Criar conta' },
    { url: '/politica-privacidade', atual: 'Política de Privacidade' },
    { url: '/termos', atual: 'Termos' },
  ];
  for (const { url, atual } of COM_MIGALHA) {
    test(`${url} tem migalha com Início e a página atual`, async ({ page }) => {
      await page.goto(url);
      const migalha = page.getByTestId('site-breadcrumb');
      await expect(migalha).toBeVisible();
      await expect(migalha.getByRole('link', { name: /Início/ })).toHaveAttribute('href', '/');
      await expect(migalha).toContainText(atual);
      await expect(page.locator('[data-site-tema]')).toHaveCount(1);
    });
  }

  test('privacidade e termos não mostram "Versão" e têm índice', async ({ page }) => {
    for (const url of ['/politica-privacidade', '/termos']) {
      await page.goto(url);
      await expect(page.locator('main')).not.toContainText(/Versão\s*\d/);
      await expect(page.getByTestId('indice-documento')).toBeAttached();
    }
  });
});
