import { expect, test, type Page } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { users } from '@shared/db/schema';
import { criarTokenDescadastro } from '@features/xgestao/marketing/lib/token-descadastro';
import { uniqueEmail, uniqueUsername } from './helpers';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

/**
 * XG52 — checkbox de marketing no cadastro do xgestão (desmarcado, opcional),
 * erro de telefone e página pública de descadastro.
 */
const origemUI = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';

async function preencherCadastro(page: Page, email: string, telefone = '') {
  await page.goto(`${origemUI}/cadastro?perfil=xgestao`);
  await page.getByTestId('input-name').fill('E2E Marketing Navegador');
  await page.getByTestId('input-email').fill(email);
  await page.getByTestId('input-username').fill(uniqueUsername('xg52_ui'));
  if (telefone) await page.getByTestId('input-phone').fill(telefone);
  await page.getByTestId('input-password').fill('Xconstr@E2E2026!');
  await page.getByTestId('checkbox-terms').check();
  // Anti-bot: o formulário recusa envio rápido demais.
  await page.waitForTimeout(3500);
}

test.describe('XG52 — consentimento de marketing na tela', () => {
  test('o checkbox começa desmarcado e marcar grava o consentimento', async ({ page }) => {
    const email = uniqueEmail('xg52-ui-sim');
    await preencherCadastro(page, email, '(11) 98888-0000');
    const marketing = page.getByTestId('checkbox-marketing');
    await expect(marketing).toBeVisible();
    await expect(marketing).not.toBeChecked();
    await expect(page.getByText('Quero receber dicas e novidades do xgestão por e-mail. Posso sair quando quiser.')).toBeVisible();
    await marketing.check();
    const registro = page.waitForResponse((r) => r.url().includes('/api/auth/register') && r.request().method() === 'POST');
    await page.getByTestId('button-register').click();
    expect((await registro).status()).toBe(201);
    const [u] = await db.select().from(users).where(eq(users.email, email));
    expect(u.marketingConsentimentoEm).toBeInstanceOf(Date);
    expect(u.marketingOrigem).toBe('cadastro');
  });

  test('sem marcar, o cadastro passa e não grava consentimento', async ({ page }) => {
    const email = uniqueEmail('xg52-ui-nao');
    await preencherCadastro(page, email);
    const registro = page.waitForResponse((r) => r.url().includes('/api/auth/register') && r.request().method() === 'POST');
    await page.getByTestId('button-register').click();
    expect((await registro).status()).toBe(201);
    const [u] = await db.select().from(users).where(eq(users.email, email));
    expect(u.marketingConsentimentoEm).toBeNull();
  });

  test('telefone inválido mostra o erro e não envia', async ({ page }) => {
    await preencherCadastro(page, uniqueEmail('xg52-ui-tel'), '1234');
    await page.getByTestId('button-register').click();
    await expect(page.getByTestId('text-phone-error')).toContainText('DDD');
  });

  test('o checkbox não aparece no cadastro do marketplace', async ({ page }) => {
    await page.goto(`${origemUI}/cadastro?perfil=empreiteiro`);
    await expect(page.getByTestId('input-name')).toBeVisible();
    await expect(page.getByTestId('checkbox-marketing')).toHaveCount(0);
  });

  test('descadastro pela página pública, sem login', async ({ page, request }) => {
    const { email, userId } = await novoAssinanteHomologacao(request, 'xg52-ui-desc');
    await db.update(users).set({ marketingConsentimentoEm: new Date(), marketingOrigem: 'configuracoes' }).where(eq(users.id, userId));
    const token = criarTokenDescadastro(userId)!;
    await page.goto(`${origemUI}/descadastro?t=${encodeURIComponent(token)}`);
    // Abrir o link não descadastra: só o botão.
    expect((await db.select().from(users).where(eq(users.email, email)))[0].marketingRevogadoEm).toBeNull();
    await page.getByTestId('descadastro-confirmar').click();
    await expect(page.getByTestId('descadastro-confirmado')).toBeVisible();
    const [u] = await db.select().from(users).where(eq(users.email, email));
    expect(u.marketingRevogadoEm).toBeInstanceOf(Date);
    expect(u.marketingOrigem).toBe('descadastro');
  });

  test('link inválido mostra a mensagem de erro', async ({ page }) => {
    await page.goto(`${origemUI}/descadastro?t=v1.invalido`);
    await page.getByTestId('descadastro-confirmar').click();
    await expect(page.getByTestId('descadastro-erro')).toBeVisible();
  });
});
