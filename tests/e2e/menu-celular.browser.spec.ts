import { expect, test, type Page } from '@playwright/test';
import { loginAs, SEED_ADMIN_EMAIL } from './helpers';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

/**
 * 13/11/2026 — no celular o menu lateral é uma gaveta. Ao tocar num item ela
 * precisa fechar, senão parece que o toque não funcionou (relato do Guilherme).
 */
const origemUI = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';
const gaveta = (page: Page) => page.locator('[data-sidebar="sidebar"][data-mobile="true"]');

async function pularTourEAvisos(page: Page) {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (chave: string) {
      if (chave.startsWith('xgestao-tour-') || chave === 'xgestao:instalar-app-dispensado') return '1';
      return original.call(this, chave);
    };
  });
}

async function fecharDocumentosLegais(page: Page) {
  const legal = page.getByRole('dialog', { name: 'Atualizamos nossos documentos' });
  await legal.waitFor({ state: 'visible', timeout: 3000 }).catch(() => undefined);
  if (await legal.isVisible()) await legal.getByRole('button', { name: 'Agora não' }).click();
}

test.describe('menu lateral no celular', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('xgestão: tocar num item fecha a gaveta e abre a tela, inclusive no item da tela atual', async ({ page }) => {
    const { email } = await novoAssinanteHomologacao(page.request, 'menu-celular');
    await pularTourEAvisos(page);
    await page.goto(`${origemUI}/login?perfil=xgestao&next=${encodeURIComponent('/xgestao/dashboard')}`);
    await page.getByTestId('input-email').fill(email);
    await page.getByTestId('input-password').fill('Xconstr@E2E2026!');
    await page.waitForTimeout(3500);
    await page.getByTestId('button-login').click();
    await page.waitForURL('**/xgestao/**');
    await fecharDocumentosLegais(page);

    await page.locator('[data-sidebar="trigger"]').click();
    await expect(gaveta(page)).toBeVisible();
    await gaveta(page).getByRole('link', { name: 'Minhas Obras' }).click();
    await expect(page).toHaveURL(/\/xgestao\/obras/);
    await expect(gaveta(page)).toBeHidden();

    // Tocar no item da tela em que já está também fecha (antes ficava aberta).
    await page.locator('[data-sidebar="trigger"]').click();
    await expect(gaveta(page)).toBeVisible();
    await gaveta(page).getByRole('link', { name: 'Minhas Obras' }).click();
    await expect(gaveta(page)).toBeHidden();
  });

  test('admin: tocar num item fecha a gaveta', async ({ page }) => {
    await loginAs(page.request, SEED_ADMIN_EMAIL);
    await page.goto(`${origemUI}/admin/xgestao`);
    await fecharDocumentosLegais(page);
    await page.locator('[data-sidebar="trigger"]').first().click();
    await expect(gaveta(page)).toBeVisible();
    const link = gaveta(page).getByRole('link').nth(1);
    await link.click();
    await expect(gaveta(page)).toBeHidden();
  });
});
