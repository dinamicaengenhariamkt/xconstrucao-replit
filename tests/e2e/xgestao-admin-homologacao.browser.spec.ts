import { expect, test } from '@playwright/test';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { obras, users } from '@shared/db/schema';
import { novoAssinanteHomologacao } from './helpers-xgestao-homologacao';

const origem = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : '';

test('XG42 admin: login normal, telas xgestão, nomes novos e detalhe da obra', async ({ page, request }) => {
  test.setTimeout(180_000);
  await novoAssinanteHomologacao(request, 'admin-obra');
  const criar = await request.post('/api/xgestao/obras', {
    data: { nome: 'E2E obra admin XG42', endereco: 'Rua da Auditoria, 42' },
  });
  expect(criar.status(), await criar.text()).toBe(201);
  const { id } = await criar.json();
  const admin = await novoAssinanteHomologacao(request, 'admin-ui', { iniciarTeste: false });
  // Só a conta descartável recebe o papel. O navegador faz login com senha;
  // nenhum guard, cookie ou rota da aplicação é temporariamente liberado.
  await db.update(users).set({ role: 'superadmin' }).where(eq(users.id, admin.userId));
  const erros: string[] = [];
  page.on('pageerror', erro => erros.push(erro.message));
  try {
    await page.goto(`${origem}/login?next=%2Fadmin%2Fxgestao`);
    await page.getByTestId('input-email').fill(admin.email);
    await page.getByTestId('input-password').fill('Xconstr@E2E2026!');
    await page.waitForTimeout(3500);
    const login = page.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
    await page.getByTestId('button-login').click();
    expect((await login).status()).toBe(200);
    await page.waitForURL('**/admin/**');
    for (const path of [
      '/admin/xgestao', '/admin/xgestao/assinantes', '/admin/xgestao/obras',
      '/admin/xgestao/financeiro', `/admin/xgestao/obras/${id}`,
    ]) {
      const documento = await page.goto(`${origem}${path}`);
      expect(documento?.status(), path).toBe(200);
      expect(new URL(page.url()).pathname).toBe(path);
      await expect(page.locator('body')).not.toContainText('Application error');
      if (path.endsWith('/financeiro')) {
        await expect(page.locator('body')).toContainText('Basic Plus');
        await expect(page.locator('body')).toContainText('Premium');
      }
      if (path.endsWith(id)) await expect(page.locator('body')).toContainText('E2E obra admin XG42');
    }
    expect(erros).toEqual([]);
  } finally {
    await db.update(users).set({ role: 'empreiteiro' }).where(eq(users.id, admin.userId));
    await db.delete(obras).where(eq(obras.id, id));
  }
});
