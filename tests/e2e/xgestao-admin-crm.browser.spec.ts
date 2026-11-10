import { expect, test } from '@playwright/test';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { assinaturas, users } from '@shared/db/schema';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

const origem = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';
const SENHA = 'Xconstr@E2E2026!';

async function entrar(page: import('@playwright/test').Page, email: string, proximo: string) {
  await page.goto(`${origem}/login${proximo.startsWith('/xgestao') ? '?perfil=xgestao&' : '?'}next=${encodeURIComponent(proximo)}`);
  await page.getByTestId('input-email').fill(email);
  await page.getByTestId('input-password').fill(SENHA);
  await page.waitForTimeout(3500);
  const login = page.waitForResponse((r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
  await page.getByTestId('button-login').click();
  expect((await login).status()).toBe(200);
}

/**
 * CRM (doc 49) — o empreiteiro cancela informando o motivo; o admin parte da
 * home (atalho "Cancelamentos agendados"), vê o motivo e o contato, registra
 * um contato e exporta o recorte. Um login de UI por teste (limite por IP).
 */
test('CRM-03 empreiteiro cancela informando o motivo (opcional)', async ({ page, request }) => {
  test.setTimeout(180_000);
  const { email, userId } = await novoAssinanteHomologacao(request, 'crm-ui-cancela', { assinar: 'basic_plus' });
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await entrar(page, email, '/xgestao/configuracoes?tab=plano');
  await page.waitForURL('**/xgestao/**');
  await page.getByTestId('button-cancelar-assinatura').click();
  const dialogo = page.getByTestId('dialog-cancelar-assinatura');
  await expect(dialogo.getByTestId('cancelar-motivo')).toBeVisible();
  await dialogo.getByTestId('cancelar-motivo-usei_pouco').click();
  await expect(dialogo.getByTestId('cancelar-motivo-usei_pouco')).toHaveAttribute('aria-checked', 'true');
  await dialogo.getByTestId('cancelar-motivo-texto').fill('Só tinha uma obra este mês');
  const resposta = page.waitForResponse((r) => r.url().includes('/api/assinaturas/cancelar'));
  await dialogo.getByTestId('button-confirmar-cancelamento').click();
  expect((await resposta).status()).toBe(200);
  const [a] = await db.select().from(assinaturas)
    .where(and(eq(assinaturas.userId, userId), eq(assinaturas.persona, 'xgestao')))
    .orderBy(desc(assinaturas.createdAt)).limit(1);
  expect(a).toMatchObject({ motivoCancelamento: 'usei_pouco', motivoCancelamentoTexto: 'Só tinha uma obra este mês' });
  expect(erros).toEqual([]);
});

test('CRM admin: atalho da home, contato com WhatsApp, motivo, registro de contato e CSV do recorte', async ({ page, request }) => {
  test.setTimeout(240_000);
  const { userId } = await novoAssinanteHomologacao(request, 'crm-ui-admin', { assinar: 'basic_plus' });
  const cancelar = await request.post('/api/assinaturas/cancelar', { data: { persona: 'xgestao', motivo: 'preco_alto' } });
  expect(cancelar.status(), await cancelar.text()).toBe(200);

  const admin = await novoAssinanteHomologacao(request, 'crm-ui-adm', { iniciarTeste: false });
  // Só a conta descartável recebe o papel; nenhum guard é liberado.
  await db.update(users).set({ role: 'superadmin' }).where(eq(users.id, admin.userId));
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await entrar(page, admin.email, '/admin/xgestao');
  await page.waitForURL('**/admin/xgestao');

  // Home: atalhos dos segmentos urgentes.
  const atalhos = page.getByTestId('xgestao-segmentos-urgentes');
  await expect(atalhos.getByTestId('xgestao-segmento-teste-7d')).toBeVisible();
  await expect(atalhos.getByTestId('xgestao-segmento-aguardando')).toBeVisible();
  await expect(atalhos.getByTestId('xgestao-segmento-inadimplentes')).toBeVisible();
  await atalhos.getByTestId('xgestao-segmento-cancelamentos').click();
  await page.waitForURL(/situacao=cancelamento_agendado/);
  await expect(page.getByTestId('xgestao-assinantes-filtro-cancelamento_agendado')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('xgestao-assinantes-ordem-urgencia')).toHaveAttribute('aria-pressed', 'true');

  // Lista: telefone compacto, botões de contato, motivo e "nunca contatado".
  const linha = page.getByTestId(`xgestao-assinante-${userId}`);
  await expect(linha).toBeVisible();
  await expect(page.getByTestId(`xgestao-assinante-contato-${userId}`)).toContainText('(11) 98888-0000');
  await expect(page.getByTestId(`xgestao-assinante-botoes-${userId}-whatsapp`)).toHaveAttribute('href', 'https://wa.me/5511988880000');
  await expect(page.getByTestId(`xgestao-assinante-botoes-${userId}-whatsapp`)).toHaveAttribute('target', '_blank');
  await expect(page.getByTestId(`xgestao-assinante-ultimo-contato-${userId}`)).toContainText('Nunca contatado');
  await page.getByTestId('xgestao-assinantes-nunca-contatado').click();
  await page.waitForURL(/contato=nunca/);
  await expect(linha).toBeVisible();
  // O CSV leva o recorte da tela.
  await expect(page.getByTestId('xgestao-assinantes-exportar'))
    .toHaveAttribute('href', /tipo=assinantes&situacao=cancelamento_agendado&ordem=urgencia&contato=nunca/);

  // Detalhe: motivo, contato e registro.
  await page.getByTestId(`xgestao-assinante-link-${userId}`).click();
  await page.waitForURL(`**/admin/xgestao/assinantes/${userId}`);
  await expect(page.getByTestId('xgestao-assinante-motivo-cancelamento')).toContainText('Preço alto');
  await expect(page.getByTestId('xgestao-assinante-telefone')).toContainText('(11) 98888-0000');
  await expect(page.getByTestId('xgestao-assinante-contato-botoes-email')).toHaveAttribute('href', /^mailto:/);
  await expect(page.getByTestId('xgestao-contatos-vazio')).toBeVisible();
  await page.getByTestId('xgestao-contato-canal-telefone').click();
  await page.getByTestId('xgestao-contato-nota').fill('Ofereci o Basic');
  const registro = page.waitForResponse((r) => r.url().includes(`/assinantes/${userId}/contatos`) && r.request().method() === 'POST');
  await page.getByTestId('xgestao-contato-registrar').click();
  expect((await registro).status()).toBe(201);
  await expect(page.getByTestId('xgestao-contatos-historico')).toContainText('Ofereci o Basic');
  await expect(page.getByTestId('xgestao-contatos-historico')).toContainText('Telefone');

  // Conversão: motivo na lista de saídas e o resumo por período.
  await page.goto(`${origem}/admin/xgestao/conversao`);
  await expect(page.getByTestId(`xgestao-saida-motivo-${userId}`)).toContainText('Preço alto');
  await expect(page.getByTestId('xgestao-motivo-preco_alto')).toBeVisible();
  await page.getByTestId('xgestao-motivos-periodo-90d').click();
  await expect(page.getByTestId('xgestao-motivos-periodo-90d')).toHaveAttribute('aria-pressed', 'true');

  // Financeiro: estornos com período e CSV.
  await page.goto(`${origem}/admin/xgestao/financeiro`);
  await expect(page.getByTestId('xgestao-estornos')).toBeVisible();
  await page.getByTestId('xgestao-estornos-periodo-30d').click();
  await expect(page.getByTestId('xgestao-estornos-exportar')).toHaveAttribute('href', /tipo=estornos&periodo=30d/);
  expect(erros).toEqual([]);
});
