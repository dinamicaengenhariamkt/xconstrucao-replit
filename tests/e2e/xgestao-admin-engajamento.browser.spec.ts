import { expect, test } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { sessions, users } from '@shared/db/schema';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

const origem = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';

/**
 * XG46 — o admin chega a quem parou de usar e ao mês a mês só clicando:
 * home → Engajamento → assinante parado → lista filtrada "Sem uso" → menu
 * "Mês a mês". Um único login de UI.
 */
test('XG46 admin: home leva ao engajamento, ao assinante parado e ao mês a mês', async ({ page, request }) => {
  test.setTimeout(240_000);
  const { userId } = await novoAssinanteHomologacao(request, 'xg46-ui');
  // Parado há 25 dias, ainda no teste: risco de não assinar.
  const quando = new Date(Date.now() - 25 * 24 * 60 * 60_000);
  await db.update(users).set({ lastLoginAt: quando }).where(eq(users.id, userId));
  await db.update(sessions).set({ lastUsedAt: quando }).where(eq(sessions.userId, userId));

  const admin = await novoAssinanteHomologacao(request, 'xg46-admin', { iniciarTeste: false });
  await db.update(users).set({ role: 'superadmin' }).where(eq(users.id, admin.userId));
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  try {
    await page.goto(`${origem}/login?next=%2Fadmin%2Fxgestao`);
    await page.getByTestId('input-email').fill(admin.email);
    await page.getByTestId('input-password').fill('Xconstr@E2E2026!');
    await page.waitForTimeout(3500);
    const login = page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
    await page.getByTestId('button-login').click();
    expect((await login).status()).toBe(200);
    await page.waitForURL('**/admin/xgestao');

    // Home: o número de quem parou leva ao Engajamento.
    await expect(page.getByTestId('xgestao-comercial-ativos')).toContainText('Pagantes ativos na semana');
    await page.getByTestId('xgestao-comercial-sem-uso').click();
    await page.waitForURL('**/admin/xgestao/engajamento');
    await expect(page.getByTestId('xgestao-engajamento-pagantes')).toBeVisible();
    await expect(page.getByTestId('xgestao-engajamento-teste')).toBeVisible();
    await expect(page.getByTestId(`xgestao-engajamento-${userId}`)).toHaveAttribute('data-nivel', 'ativo_30d');
    const parado = page.getByTestId(`xgestao-sem-uso-${userId}`);
    await expect(parado).toContainText('há 25 dias');

    // Do parado para o detalhe: o motivo aparece na atenção e o uso no cartão.
    await parado.click();
    await page.waitForURL(`**/admin/xgestao/assinantes/${userId}`);
    await expect(page.getByTestId('xgestao-assinante-detalhe-atencao')).toContainText('Sem usar há 25 dias');
    await expect(page.getByTestId('xgestao-assinante-engajamento')).toHaveAttribute('data-nivel', 'ativo_30d');
    await expect(page.getByTestId('xgestao-assinante-engajamento-registros')).toContainText('0');

    // A lista filtrada por "Sem uso" também o traz.
    await page.goto(`${origem}/admin/xgestao/engajamento`);
    await page.getByTestId('xgestao-sem-uso-ver-lista').click();
    await page.waitForURL(/\/admin\/xgestao\/assinantes\?situacao=sem_uso$/);
    await expect(page.getByTestId('xgestao-assinantes-filtro-sem_uso')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId(`xgestao-assinante-${userId}`)).toBeVisible();

    // Mês a mês pelo menu lateral: 12 linhas, o mês corrente presente.
    await page.getByRole('link', { name: 'Mês a mês xgestão' }).first().click();
    await page.waitForURL('**/admin/xgestao/historico');
    const mes = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 7);
    const linhaMes = page.getByTestId(`xgestao-historico-${mes}`);
    await expect(linhaMes).toBeVisible();
    expect(Number(await linhaMes.locator('[data-campo="testesIniciados"]').innerText())).toBeGreaterThanOrEqual(1);
    await expect(page.getByTestId('xgestao-historico-tabela').locator('tbody tr')).toHaveCount(12);
    await expect(page.getByTestId('xgestao-historico-grafico')).toBeVisible();

    // Celular: as duas páginas cabem na largura.
    await page.setViewportSize({ width: 390, height: 844 });
    for (const rota of ['historico', 'engajamento']) {
      await page.goto(`${origem}/admin/xgestao/${rota}`);
      await expect(page.getByTestId(`xgestao-${rota}-page`)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390 + 1);
    }

    expect(erros).toEqual([]);
  } finally {
    await db.update(users).set({ role: 'empreiteiro' }).where(eq(users.id, admin.userId));
  }
});
