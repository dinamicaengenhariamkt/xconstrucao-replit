import { expect, test, type Page } from '@playwright/test';
import { and, eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas } from '@shared/db/schema';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

/** XG43 — faixa com relógio, tolerância de 24h, +1 mês e cancelamento pela aba Plano. */
const origemUI = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';
const HORA_MS = 60 * 60_000;

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
  await page.waitForTimeout(3500);
  const login = page.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
  await page.getByTestId('button-login').click();
  expect((await login).status()).toBe(200);
  await page.waitForURL('**/xgestao/**');
  const legal = page.getByRole('dialog', { name: 'Atualizamos nossos documentos' });
  await legal.waitFor({ state: 'visible', timeout: 3000 }).catch(() => undefined);
  if (await legal.isVisible()) await legal.getByRole('button', { name: 'Agora não' }).click();
}

test.describe('XG43 — fim do teste na tela', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('relógio com segundos nas últimas horas, +1 mês e as 24h de tolerância', async ({ page, request }) => {
    const { email, userId } = await novoAssinanteHomologacao(request, 'faixa-ui');
    const doTeste = and(eq(assinaturas.userId, userId), eq(assinaturas.gatewayProvider, 'trial'));
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() + 2 * HORA_MS) }).where(doTeste);
    await entrar(page, email, '/xgestao/configuracoes?tab=plano');

    const contagem = page.getByTestId('xgestao-barra-contagem');
    await expect(contagem).toContainText('Teste grátis do plano Basic: termina em');
    await expect(contagem).toHaveText(/\d{2}h \d{2}min \d{2}s/);
    // O relógio anda sozinho, sem recarregar a página.
    const antes = await contagem.textContent();
    await expect.poll(async () => contagem.textContent(), { timeout: 5_000 }).not.toBe(antes);
    await expect(page.getByTestId('xgestao-barra-bonus')).toContainText('+1 mês grátis');
    await expect(page.getByTestId('xgestao-plano-bonus')).toContainText('a 1ª cobrança será só em');

    // Prazo vencido há 1h: ainda edita, a faixa conta o tempo até o bloqueio.
    await db.update(assinaturas).set({ renovaEm: new Date(Date.now() - HORA_MS) }).where(doTeste);
    await page.reload();
    await expect(contagem).toContainText('Seu teste grátis terminou. A edição será bloqueada em');
    await expect(contagem).toHaveText(/2[23]h \d{2}min \d{2}s/);
    await expect(page.getByTestId('xgestao-barra-bonus')).toBeVisible();
    await expect(page.getByTestId('link-teste-assinar')).toBeVisible();
    // Sem rolagem horizontal no celular com a faixa maior.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test.describe('XG43 — cancelamento pela aba Plano', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('cancelar mantém o acesso até o fim do período pago e avisa em toda página', async ({ page, request }) => {
    const { email, userId } = await novoAssinanteHomologacao(request, 'cancelar-ui');
    const catalogo = await (await request.get('/api/planos?persona=xgestao')).json() as Array<{ id: string; tier: string }>;
    const assinou = await request.post('/api/assinaturas/checkout', {
      data: { planoId: catalogo.find((p) => p.tier === 'basic_plus')!.id, persona: 'xgestao', ciclo: 'mensal' },
    });
    expect(assinou.status(), await assinou.text()).toBe(201);
    const { primeiraCobrancaEm } = await assinou.json();
    const dataFim = new Date(primeiraCobrancaEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    await entrar(page, email, '/xgestao/configuracoes?tab=plano');
    await expect(page.getByTestId('xgestao-plano-bonus')).toHaveCount(0);
    await expect(page.getByTestId('xgestao-cancelar-assinatura')).toContainText(dataFim);
    await page.getByTestId('button-cancelar-assinatura').click();
    const dialogo = page.getByTestId('dialog-cancelar-assinatura');
    await expect(dialogo).toContainText(`até ${dataFim}`);
    // Desistir não cancela nada.
    await dialogo.getByRole('button', { name: 'Manter assinatura' }).click();
    await expect(dialogo).toBeHidden();
    const [mantida] = await db.select().from(assinaturas).where(and(
      eq(assinaturas.userId, userId), eq(assinaturas.status, 'ativa'),
    ));
    expect(mantida.canceladaEm).toBeNull();

    await page.getByTestId('button-cancelar-assinatura').click();
    const resposta = page.waitForResponse(r => r.url().includes('/api/assinaturas/cancelar'));
    await page.getByTestId('button-confirmar-cancelamento').click();
    expect((await resposta).status()).toBe(200);
    await expect(page.getByTestId('xgestao-plano-cancelamento-agendado')).toContainText(dataFim);
    await expect(page.getByTestId('xgestao-cancelar-assinatura')).toHaveCount(0);
    await expect(page.getByTestId('xgestao-plano-basic_plus').getByRole('button')).toHaveText('Escolher plano');
    await page.goto(`${origemUI}/xgestao/dashboard`);
    await expect(page.getByTestId('xgestao-barra-cancelamento')).toContainText(`até ${dataFim}`);

    const [cancelada] = await db.select().from(assinaturas).where(eq(assinaturas.id, mantida.id));
    expect(cancelada.status).toBe('ativa');
    expect(cancelada.canceladaEm).not.toBeNull();
  });
});
