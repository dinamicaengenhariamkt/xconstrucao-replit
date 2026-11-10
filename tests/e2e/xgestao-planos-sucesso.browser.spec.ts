import { expect, test, type Page } from '@playwright/test';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

/**
 * TST-10 — volta do checkout: `/xgestao/planos/sucesso`.
 *
 * A ativação acontece no webhook, então a tela fica em espera consultando o
 * plano e muda para "ativada" quando ele troca. O webhook é disparado pela rota
 * test-only `POST /api/test/webhooks/asaas` (E2E_TEST_AUTH=1), que chama o mesmo
 * `aplicarEventoWebhook` do handler real.
 *
 * A tela desiste depois de ~10 s ("Quase lá!"): o webhook sai logo que a espera
 * aparece, e a ativação tem de vir antes disso.
 */
const origemUI = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';

async function entrar(page: Page, email: string, destino: string) {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (chave: string) {
      return chave.startsWith('xgestao-tour-') ? '1' : original.call(this, chave);
    };
  });
  await page.goto(`${origemUI}/login?perfil=xgestao&next=${encodeURIComponent(destino)}`);
  await page.getByTestId('input-email').fill(email);
  await page.getByTestId('input-password').fill('Xconstr@E2E2026!');
  // Anti-bot do login: o formulário precisa ficar montado alguns segundos.
  await page.waitForTimeout(3500);
  const login = page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
  await page.getByTestId('button-login').click();
  expect((await login).status()).toBe(200);
  await page.waitForURL('**/xgestao/**');
  const legal = page.getByRole('dialog', { name: 'Atualizamos nossos documentos' });
  await legal.waitFor({ state: 'visible', timeout: 3000 }).catch(() => undefined);
  if (await legal.isVisible()) await legal.getByRole('button', { name: 'Agora não' }).click();
}

test.describe('TST-10 — retorno do checkout do xgestão', () => {
  test('mostra a espera e depois a assinatura ativada quando o webhook chega', async ({ page, request }) => {
    const { email, userId } = await novoAssinanteHomologacao(request, 'planos-sucesso');
    const catalogo = await (await request.get('/api/planos?persona=xgestao')).json() as Array<{ id: string; tier: string; nome?: string }>;
    const premium = catalogo.find((p) => p.tier === 'premium');
    expect(premium, 'plano premium do xgestão no catálogo').toBeTruthy();

    await entrar(page, email, '/xgestao/planos/sucesso');
    if (!page.url().includes('/xgestao/planos/sucesso')) await page.goto(`${origemUI}/xgestao/planos/sucesso`);

    const tela = page.getByTestId('xgestao-plano-sucesso-page');
    await expect(tela).toBeVisible();
    // Espera: o plano ainda é o do teste.
    await expect(page.getByTestId('icon-polling-spinner')).toBeVisible();
    await expect(tela).toContainText('Pagamento registrado!');
    await expect(page.getByTestId('icon-activated')).toHaveCount(0);

    const webhook = await request.post('/api/test/webhooks/asaas', {
      data: {
        type: 'payment_succeeded',
        externalReference: `xconstrucao|${userId}|${premium!.id}|mensal`,
        gatewaySubscriptionId: `sub_e2e_sucesso_${Date.now().toString(36)}`,
        valor: 299,
      },
    });
    expect(webhook.status(), await webhook.text()).toBe(200);
    expect((await webhook.json()).processed).toBe(true);

    // Ativada: a tela troca sozinha, sem recarregar.
    await expect(page.getByTestId('icon-activated')).toBeVisible({ timeout: 10_000 });
    await expect(tela).toContainText('Assinatura ativada!');
    await expect(page.getByTestId('icon-timeout')).toHaveCount(0);
    await expect(page.getByTestId('link-ir-dashboard')).toBeVisible();
    // XG50 — o retorno mostra a próxima cobrança e o valor do plano.
    await expect(page.getByTestId('xgestao-sucesso-cobranca')).toContainText('Próxima cobrança em');
    await expect(page.getByTestId('xgestao-sucesso-cobranca')).toContainText('299,00 por mês');
  });
});
