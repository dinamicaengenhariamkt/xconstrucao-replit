import { expect, test } from '@playwright/test';
import { and, eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, financeiro, users } from '@shared/db/schema';
import { aplicarEventoWebhook } from '@features/planos/assinatura-service';
import { ORIGEM_MENSALIDADE_XGESTAO } from '@features/xgestao/lib/receita';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

const origem = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';

/**
 * XG45 — o admin chega aos números comerciais só clicando: home → Conversão
 * (funil, coortes, quem assinou) → detalhe do assinante (quanto já pagou) e
 * Financeiro (receita por plano, quem mais pagou). Um único login de UI.
 */
test('XG45 admin: home leva à conversão, ao assinante que pagou e à receita por plano', async ({ page, request }) => {
  test.setTimeout(240_000);
  const { userId } = await novoAssinanteHomologacao(request, 'xg45-ui');
  const catalogo = await (await request.get('/api/planos?persona=xgestao')).json() as Array<{ id: string; tier: string }>;
  const checkout = await request.post('/api/assinaturas/checkout', {
    data: { planoId: catalogo.find((p) => p.tier === 'basic_plus')!.id, persona: 'xgestao', ciclo: 'mensal' },
  });
  expect(checkout.status(), await checkout.text()).toBe(201);
  const [paga] = await db.select().from(assinaturas)
    .where(and(eq(assinaturas.userId, userId), eq(assinaturas.status, 'ativa'), eq(assinaturas.persona, 'xgestao')));
  await aplicarEventoWebhook({
    eventId: `xg45-ui-${Date.now()}`, type: 'payment_succeeded', gatewaySubscriptionId: paga.gatewaySubscriptionId!,
    dueDate: paga.renovaEm!.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }), valor: 179, paymentId: `pay_xg45_ui_${Date.now()}`,
  });

  const admin = await novoAssinanteHomologacao(request, 'xg45-admin', { iniciarTeste: false });
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

    // Home: quatro números comerciais, cada um leva à página que explica.
    await expect(page.getByTestId('xgestao-comercial-resumo')).toBeVisible();
    await expect(page.getByTestId('xgestao-comercial-mrr')).toContainText('R$');
    await page.getByTestId('xgestao-comercial-conversao').click();
    await page.waitForURL('**/admin/xgestao/conversao');

    // Conversão: funil, coorte do mês e o assinante entre os que assinaram.
    await expect(page.getByTestId('xgestao-funil')).toBeVisible();
    const mes = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 7);
    await expect(page.getByTestId(`xgestao-coorte-${mes}`)).toBeVisible();
    await expect(page.getByTestId('xgestao-cancelamentos')).toBeVisible();
    await expect(page.getByTestId('xgestao-cancel-taxa')).toContainText('Taxa de cancelamento do mês');
    const convertido = page.getByTestId(`xgestao-convertido-${userId}`);
    await expect(convertido).toBeVisible();
    await convertido.click();
    await page.waitForURL(`**/admin/xgestao/assinantes/${userId}`);
    await expect(page.getByTestId('xgestao-assinante-total-pago')).toContainText('179,00');
    await expect(page.getByTestId('xgestao-assinante-total-pago')).toContainText('1 mensalidade');
    await expect(page.getByTestId('xgestao-assinante-jornada').locator('[data-estado]')).toHaveAttribute('data-estado', 'convertido');
    await expect(page.getByTestId('xgestao-assinante-jornada')).toContainText('no teste, com mês extra');

    // Financeiro pelo menu lateral: receita por plano e quem mais pagou.
    await page.getByRole('link', { name: 'Financeiro xgestão' }).first().click();
    await page.waitForURL('**/admin/xgestao/financeiro');
    await expect(page.getByTestId('xgestao-receita-planos')).toBeVisible();
    await expect(page.getByTestId('xgestao-receita-plano-basic_plus')).toBeVisible();
    await expect(page.getByTestId('xgestao-ticket-medio')).toContainText('Ticket médio');
    await expect(page.getByTestId('xgestao-top-clientes')).toBeVisible();

    // Celular: a Conversão cabe na largura, sem rolagem lateral.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${origem}/admin/xgestao/conversao`);
    await expect(page.getByTestId('xgestao-funil')).toBeVisible();
    const largura = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(largura).toBeLessThanOrEqual(390 + 1);

    expect(erros).toEqual([]);
  } finally {
    await db.update(users).set({ role: 'empreiteiro' }).where(eq(users.id, admin.userId));
    await db.delete(financeiro).where(and(eq(financeiro.origemTipo, ORIGEM_MENSALIDADE_XGESTAO), eq(financeiro.pagadorUserId, userId)));
  }
});
