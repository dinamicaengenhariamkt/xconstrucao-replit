import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas } from '@shared/db/schema';
import { dataSp } from '@features/xgestao/lib/troca-plano';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

/** XG48 — troca de plano na aba Plano: resumo da subida; aviso e escolha da descida. */
const origemUI = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';
const DIA_MS = 24 * 60 * 60_000;

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

/** Dono com assinatura paga no plano pedido, renovando em 15 dias. */
async function donoPago(request: APIRequestContext, label: string, tier: 'basic' | 'premium') {
  const { email, userId } = await novoAssinanteHomologacao(request, label);
  const catalogo = await (await request.get('/api/planos?persona=xgestao')).json() as Array<{ id: string; tier: string }>;
  const r = await request.post('/api/assinaturas/checkout', {
    data: { planoId: catalogo.find((p) => p.tier === tier)!.id, persona: 'xgestao', ciclo: 'mensal' },
  });
  expect(r.status(), await r.text()).toBe(201);
  const renovaEm = new Date(`${dataSp(new Date(Date.now() + 15 * DIA_MS))}T12:00:00-03:00`);
  await db.update(assinaturas)
    .set({ primeiroPagamentoEm: new Date(Date.now() - 15 * DIA_MS), fimTesteEm: null, renovaEm })
    .where(and(eq(assinaturas.userId, userId), eq(assinaturas.status, 'ativa'), ne(assinaturas.gatewayProvider, 'trial')));
  return { email, userId, renovaEm };
}

async function criarObra(request: APIRequestContext, nome: string) {
  const r = await request.post('/api/xgestao/obras', { data: { nome, endereco: 'Rua E2E Troca, 10', cidade: 'São Paulo', uf: 'SP' } });
  expect(r.status(), await r.text()).toBe(201);
}

test.describe('XG48 — troca de plano na tela', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('subir: botão "Mudar para este plano" e resumo da próxima fatura', async ({ page, request }) => {
    const { email } = await donoPago(request, 'troca-ui-sobe', 'basic');
    await entrar(page, email, '/xgestao/configuracoes?tab=plano');

    const botao = page.getByTestId('xgestao-assinar-basic_plus');
    await expect(botao).toHaveText('Mudar para este plano');
    await botao.click();
    const dialogo = page.getByTestId('dialog-troca-plano');
    await expect(dialogo).toBeVisible();
    const resumo = dialogo.getByTestId('troca-resumo');
    await expect(resumo).toContainText('Hoje: passa a ser Basic Plus.');
    await expect(resumo).toContainText(/Próxima fatura em \d{2}\/\d{2}\/\d{4}: R\$\s179,00 \+ R\$\s[\d,]+ referente a \d+ dias = R\$\s[\d.,]+\./);
    await expect(resumo).toContainText('Depois: R$');
    await dialogo.getByTestId('button-confirmar-troca').click();
    await expect(dialogo).toBeHidden();
    await expect(page.getByTestId('xgestao-assinar-basic_plus')).toHaveText('Plano atual');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('descer: aviso, escolha obrigatória até o limite e ciência antes de confirmar', async ({ page, request }) => {
    const { email } = await donoPago(request, 'troca-ui-desce', 'premium');
    await criarObra(request, 'E2E UI troca A');
    await criarObra(request, 'E2E UI troca B');
    await entrar(page, email, '/xgestao/configuracoes?tab=plano');

    await page.getByTestId('xgestao-assinar-basic').click();
    const dialogo = page.getByTestId('dialog-troca-plano');
    await expect(dialogo).toBeVisible();
    const obras = dialogo.getByTestId('troca-escolha-obras');
    await expect(obras).toContainText(/Você tem 2 obras em andamento e o Basic permite editar 1\. As outras ficarão só para visualização a partir de \d{2}\/\d{2}\/\d{4}\./);
    const confirmar = dialogo.getByTestId('button-confirmar-troca');
    await expect(confirmar).toBeDisabled();

    const caixas = obras.getByRole('checkbox');
    await caixas.first().click();
    // Limite atingido: a outra obra não pode ser marcada.
    await expect(caixas.nth(1)).toBeDisabled();
    await expect(confirmar).toBeDisabled();
    await dialogo.getByTestId('troca-ciente').click();
    await expect(dialogo).toContainText('Entendi que as demais ficarão só para visualização e que essa escolha não poderá ser alterada');
    await expect(confirmar).toBeEnabled();
    await confirmar.click();
    await expect(dialogo).toBeHidden();
    await expect(page.getByTestId('xgestao-troca-agendada')).toContainText('Mudança agendada: em');
    await expect(page.getByTestId('xgestao-assinar-basic')).toHaveText('Mudança agendada');
  });
});
