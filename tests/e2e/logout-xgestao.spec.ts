import { expect, test } from '@playwright/test';
import { loginAs, SEED_ADMIN_EMAIL } from './helpers';

test.describe('logout pelos menus do xgestão', () => {
  test('admin sai pelo menu da conta e retorna ao login xgestão', async ({ page }) => {
    await loginAs(page.request, SEED_ADMIN_EMAIL);
    await page.goto('/admin/xgestao');

    await page.getByLabel('Abrir menu da conta').click();
    await page.getByTestId('admin-topbar-logout').click();

    await expect(page).toHaveURL(/\/login\?perfil=xgestao(?:&|$)/);
    await expect(page.getByTestId('text-perfil-badge')).toHaveText('xgestão');
  });

  test('admin sai pela barra lateral e retorna ao login xgestão', async ({ page }) => {
    await loginAs(page.request, SEED_ADMIN_EMAIL);
    await page.goto('/admin/xgestao');

    await page.getByTestId('admin-sidebar-logout').click();

    await expect(page).toHaveURL(/\/login\?perfil=xgestao(?:&|$)/);
  });
});