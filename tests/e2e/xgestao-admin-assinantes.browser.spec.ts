import { expect, test } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { obraShareLinks, obras, users } from '@shared/db/schema';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

const origem = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';

/**
 * XG44 — o admin navega do macro ao micro só clicando: home → situação →
 * lista filtrada → detalhe do assinante → obra → de volta ao assinante.
 * Um único login de UI (o limite é 10 por 15 min por IP).
 */
test('XG44 admin: home leva à lista filtrada, ao detalhe do assinante e à obra, ida e volta', async ({ page, request }) => {
  test.setTimeout(240_000);
  const { email, userId } = await novoAssinanteHomologacao(request, 'xg44-ui');
  const nomeObra = `E2E XG44 UI ${Date.now()}`;
  const criar = await request.post('/api/xgestao/obras', { data: { nome: nomeObra, endereco: 'Rua do Clique, 44' } });
  expect(criar.status(), await criar.text()).toBe(201);
  const { id: obraId } = await criar.json();
  const link = await request.post(`/api/xgestao/obras/${obraId}/share`, { data: { nome: 'Cliente' } });
  expect(link.status(), await link.text()).toBe(201);
  await db.update(obras).set({ valorTotal: '2500' }).where(eq(obras.id, obraId));

  const admin = await novoAssinanteHomologacao(request, 'xg44-admin', { iniciarTeste: false });
  // Só a conta descartável recebe o papel; nenhum guard é liberado.
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

    // Home: o macro. Sem a tabela completa; com o resumo e a atenção.
    await expect(page.getByTestId('xgestao-assinaturas-resumo')).toBeVisible();
    await expect(page.getByTestId('xgestao-assinantes-atencao')).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Acessos xgestão');
    const contadorTeste = page.getByTestId('xgestao-assinaturas-situacao-em_teste');

    // Clique na situação: a lista abre já filtrada pela URL.
    await contadorTeste.click();
    await page.waitForURL(/\/admin\/xgestao\/assinantes\?situacao=em_teste$/);
    await expect(page.getByTestId('xgestao-assinantes-filtro-em_teste')).toHaveAttribute('aria-pressed', 'true');
    await page.getByTestId('xgestao-assinantes-busca').fill(email);
    const linha = page.getByTestId(`xgestao-assinante-${userId}`);
    await expect(linha).toBeVisible();
    await expect(linha).toHaveAttribute('data-situacao', 'em_teste');
    await expect(page.getByTestId(`xgestao-uso-obras-${userId}`)).toHaveAttribute('data-nivel', 'no_limite');
    await expect(page.getByTestId(`xgestao-uso-obras-${userId}`)).toContainText('1 de 1');
    await expect(page.getByTestId(`xgestao-uso-links-${userId}`)).toContainText('1 de 1');
    await expect(page.getByTestId(`xgestao-uso-pessoas-${userId}`)).toContainText('1 de 2');
    await expect(page.getByTestId(`xgestao-assinante-atencao-${userId}`)).toContainText('No limite de obras (1 de 1)');

    // Outros recortes: aparece em "Pedem atenção", some em "Pagamento pendente".
    await page.getByTestId('xgestao-assinantes-filtro-atencao').click();
    await page.waitForURL(/\/admin\/xgestao\/assinantes\?situacao=atencao$/);
    await expect(linha).toBeVisible();
    await page.getByTestId('xgestao-assinantes-filtro-inadimplente').click();
    await page.waitForURL(/\/admin\/xgestao\/assinantes\?situacao=inadimplente$/);
    await expect(linha).toHaveCount(0);
    await page.getByTestId('xgestao-assinantes-filtro-todos').click();
    await page.waitForURL(/\/admin\/xgestao\/assinantes$/);
    await expect(linha).toBeVisible();

    // Micro: detalhe do assinante.
    await page.getByTestId(`xgestao-assinante-link-${userId}`).click();
    await page.waitForURL(`**/admin/xgestao/assinantes/${userId}`);
    await expect(page.getByTestId('xgestao-assinante-detalhe-situacao')).toHaveAttribute('data-situacao', 'em_teste');
    await expect(page.getByTestId('xgestao-assinante-uso-obras')).toHaveAttribute('data-nivel', 'no_limite');
    await expect(page.getByTestId('xgestao-assinante-kpis')).toContainText('2.500,00');
    await expect(page.getByTestId('xgestao-assinante-plano')).toContainText('Grátis no teste');
    await expect(page.getByTestId('xgestao-assinante-eventos')).toContainText('Teste grátis iniciado');
    await expect(page.getByTestId(`xgestao-assinante-obra-${obraId}`)).toContainText(nomeObra);

    // Da obra de volta ao assinante.
    await page.getByTestId(`xgestao-assinante-obra-link-${obraId}`).click();
    await page.waitForURL(`**/admin/xgestao/obras/${obraId}`);
    await expect(page.locator('body')).toContainText(nomeObra);
    await page.getByTestId('xgestao-obra-assinante-link').click();
    await page.waitForURL(`**/admin/xgestao/assinantes/${userId}`);
    await expect(page.getByTestId('xgestao-assinante-detalhe')).toBeVisible();

    // Id que não é assinante: mensagem clara, sem tela de erro.
    await page.goto(`${origem}/admin/xgestao/assinantes/00000000-0000-4000-8000-000000000000`);
    await expect(page.getByTestId('xgestao-assinante-nao-encontrado')).toBeVisible();

    // Celular: a lista continua legível e leva ao detalhe.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${origem}/admin/xgestao/assinantes?situacao=atencao`);
    await page.getByTestId('xgestao-assinantes-busca').fill(email);
    await expect(linha).toBeVisible();
    const larguraPagina = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(larguraPagina).toBeLessThanOrEqual(390 + 1);
    await page.getByTestId(`xgestao-assinante-link-${userId}`).click();
    await page.waitForURL(`**/admin/xgestao/assinantes/${userId}`);
    await expect(page.getByTestId('xgestao-assinante-uso')).toBeVisible();

    expect(erros).toEqual([]);
  } finally {
    await db.update(users).set({ role: 'empreiteiro' }).where(eq(users.id, admin.userId));
    await db.delete(obraShareLinks).where(eq(obraShareLinks.obraId, obraId));
    await db.delete(obras).where(eq(obras.id, obraId));
  }
});
