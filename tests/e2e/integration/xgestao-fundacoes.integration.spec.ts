import { expect, test, type APIRequestContext } from '@playwright/test';
import { loginAs, logout, SEED_ADMIN_EMAIL, uniqueEmail, uniqueUsername } from '../helpers';

const ANTI_BOT = { website: '', mountedAt: Date.now() - 5_000 };
const CNPJ_VALIDO = '11222333000181';

async function criarEmpreiteiroParaXGestao(request: APIRequestContext) {
  const email = uniqueEmail('xgestao-entitlement');
  const response = await request.post('/api/auth/register', {
    data: {
      name: 'Empreiteiro de teste xgestão',
      email,
      username: uniqueUsername('xgestao'),
      password: 'Xconstr@E2E2026!',
      role: 'empreiteiro',
      phone: '11988880000',
      cpfCnpj: CNPJ_VALIDO,
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(response.status()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  return email;
}

test.describe('Fundações xgestão — entitlement administrativo', () => {
  test('superadmin concede, testa via Ver como e revoga o acesso xgestão', async ({ request }) => {
    const email = await criarEmpreiteiroParaXGestao(request);

    await loginAs(request, email);
    const semEntitlement = await request.get('/xgestao/obras', { maxRedirects: 0 });
    expect(semEntitlement.status()).toBe(307);
    expect(semEntitlement.headers().location).toContain('/login?next=%2Fxgestao%2Fobras');
    await logout(request);

    await loginAs(request, SEED_ADMIN_EMAIL);
    const usuarios = await request.get(`/api/admin/usuarios?q=${encodeURIComponent(email)}`);
    expect(usuarios.status()).toBe(200);
    const payload = (await usuarios.json()) as { rows: Array<{ id: string; xgestao?: boolean }> };
    expect(payload.rows).toHaveLength(1);
    const userId = payload.rows[0].id;
    expect(payload.rows[0].xgestao).toBe(false);

    const conceder = await request.patch(`/api/admin/usuarios/${userId}`, {
      data: { xgestao: true },
    });
    const concederBody = await conceder.json().catch(() => ({}));
    expect(conceder.status(), JSON.stringify(concederBody)).toBe(200);
    expect(concederBody as { xgestao: boolean }).toMatchObject({ xgestao: true });

    const impersonar = await request.post(`/api/admin/impersonate/${userId}`, { data: {} });
    expect(impersonar.status()).toBe(200);
    expect((await impersonar.json()) as { target: { roles: string[] } }).toMatchObject({
      target: { roles: expect.arrayContaining(['xgestao']) },
    });
    const comoEmpreiteiro = await request.get('/xgestao/obras', { maxRedirects: 0 });
    expect(comoEmpreiteiro.status()).toBe(200);

    await request.post('/api/admin/impersonate/exit').catch(() => {});
    await loginAs(request, SEED_ADMIN_EMAIL);
    const revogar = await request.patch(`/api/admin/usuarios/${userId}`, {
      data: { xgestao: false },
    });
    expect(revogar.status()).toBe(200);
    expect((await revogar.json()) as { xgestao: boolean }).toMatchObject({ xgestao: false });

    await logout(request);
    await loginAs(request, email);
    const revogado = await request.get('/xgestao/obras', { maxRedirects: 0 });
    expect(revogado.status()).toBe(307);
    await logout(request);
  });
});